// app/api/email/results-completed/route.js - ปรับปรุงแล้ว
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // 1. อ่านข้อมูล request
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { message: 'Invalid request body', error: parseError.message },
        { status: 400 }
      );
    }
    
    const { 
      trackingNumber, 
      customerEmail, 
      customerName, 
      orderId, 
      resultSummary,
      results
    } = body;


    if (!trackingNumber || !customerEmail) {
      console.error(`❌ [API Route] Missing required information:`, { 
        trackingNumber: !!trackingNumber, 
        customerEmail: !!customerEmail 
      });
      return NextResponse.json(
        { message: 'Missing required information: trackingNumber and customerEmail are required' },
        { status: 400 }
      );
    }

    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { message: `Missing environment variables: ${missingEnvVars.join(', ')}` },
        { status: 500 }
      );
    }


    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // เพิ่มการตั้งค่าเพิ่มเติม
      debug: true, // เปิด debug mode
      logger: true, // เปิด logging
    });

    // 5. ทดสอบการเชื่อมต่อ
    console.log(`🔌 [API Route] Testing transporter connection...`);
    try {
      await transporter.verify();
      console.log(`✅ [API Route] Transporter connection verified successfully`);
    } catch (verifyError) {
      console.error(`❌ [API Route] Transporter verification failed:`, {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command
      });
      return NextResponse.json(
        { message: `Email configuration error: ${verifyError.message}` },
        { status: 500 }
      );
    }

    // 6. สร้าง URLs และเนื้อหาอีเมล
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const redirectUrl = encodeURIComponent(`/orders/${orderId}`);
    const actionUrl = `${siteUrl}/login?callbackUrl=${redirectUrl}`;
    

    // 7. สร้าง HTML เนื้อหาอีเมล (เหมือนเดิม)
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #444DDA; margin: 0;">ผลการตรวจสอบเสร็จสมบูรณ์</h2>
          <p style="color: #666;">รหัสคำสั่งซื้อ: #${trackingNumber}</p>
        </div>
        
        <div style="background-color: #f1f7f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #2E7D32;">ผลการตรวจสอบของคุณพร้อมแล้ว</h3>
          <p>เรียน ${customerName || 'ท่านผู้ใช้บริการ'},</p>
          <p>เรามีความยินดีที่จะแจ้งให้ทราบว่า ผลการตรวจสอบประวัติของรายการทั้งหมดในคำสั่งซื้อเสร็จสมบูรณ์แล้ว</p>
        </div>
        
        ${resultSummary ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">สรุปผลการตรวจสอบ</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 60%;">จำนวนรายการทั้งหมด:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${resultSummary.total} รายการ</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">ผ่านการตรวจสอบ:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #2E7D32;">${resultSummary.passed} รายการ</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">ไม่ผ่านการตรวจสอบ:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #D32F2F;">${resultSummary.failed} รายการ</td>
            </tr>
            ${resultSummary.pending > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">รอผลการตรวจสอบเพิ่มเติม:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #FF9800;">${resultSummary.pending} รายการ</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${actionUrl}" style="display: inline-block; background-color: #444DDA; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ดูผลการตรวจสอบ</a>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #2196F3;">
          <p style="margin: 0; color: #1565C0; font-size: 14px;">
            <strong>หมายเหตุ:</strong> เพื่อความปลอดภัยของข้อมูล กรุณาเข้าสู่ระบบก่อนเข้าดูผลการตรวจสอบ
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777;">
          <p style="margin-bottom: 5px;"><strong>มีคำถาม?</strong> ติดต่อเราได้ที่:</p>
          <p style="margin-top: 5px;">อีเมล: supercertify@gmail.com</p>
          <p style="margin-top: 5px;">โทรศัพท์: 02-XXX-XXXX (จันทร์-ศุกร์ 9:00 - 18:00 น.)</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} SuperCertify. สงวนลิขสิทธิ์.</p>
        </div>
      </div>
    `;

    // 8. ตั้งค่าและส่งอีเมล
    const mailOptions = {
      from: `"SuperCertify" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `[SuperCertify] ผลการตรวจสอบของคุณพร้อมแล้ว - คำสั่งซื้อ #${trackingNumber}`,
      html: emailContent,
    };
    
    console.log(`📤 [API Route] Preparing to send email:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      contentLength: emailContent.length
    });

    console.log(`📨 [API Route] Sending email...`);
    let info;
    try {
      info = await transporter.sendMail(mailOptions);
      console.log(`✅ [API Route] Email sent successfully:`, {
        messageId: info.messageId,
        response: info.response?.slice(0, 100) + '...' // แสดงแค่ 100 ตัวแรก
      });
    } catch (sendError) {
      console.error(`❌ [API Route] Error sending email:`, {
        message: sendError.message,
        code: sendError.code,
        command: sendError.command,
        stack: sendError.stack?.slice(0, 500) + '...'
      });
      
      return NextResponse.json(
        { 
          message: 'Failed to send email', 
          error: sendError.message,
          errorCode: sendError.code 
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    console.log(`🏁 [API Route] Process completed in ${endTime - startTime}ms`);
    
    return NextResponse.json({ 
      success: true,
      recipient: customerEmail,
      messageId: info.messageId,
      processingTime: endTime - startTime
    });
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`💥 [API Route] Unexpected error in results-completed API route:`, {
      message: error.message,
      stack: error.stack?.slice(0, 500) + '...',
      processingTime: endTime - startTime
    });
    
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}