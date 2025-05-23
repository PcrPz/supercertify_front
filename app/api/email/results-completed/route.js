// app/api/email/results-completed/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  console.log(`DEBUG: [API Route] results-completed route called`);
  
  try {
    // อ่านข้อมูล request
    const body = await request.json();
    console.log(`DEBUG: [API Route] Request body received:`, body);
    
    const { 
      trackingNumber, 
      customerEmail, 
      customerName, 
      orderId, 
      resultSummary 
    } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!trackingNumber || !customerEmail) {
      console.error(`DEBUG: [API Route] Missing required information:`, { trackingNumber, customerEmail });
      return NextResponse.json(
        { message: 'Missing required information' },
        { status: 400 }
      );
    }

    // สร้าง transporter
    console.log(`DEBUG: [API Route] Creating email transporter`);
    console.log(`DEBUG: [API Route] Email config:`, {
      host: process.env.EMAIL_HOST ? 'set' : 'missing',
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER ? 'set' : 'missing',
      from: process.env.EMAIL_FROM,
      siteUrl: process.env.SITE_URL
    });
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // ทดสอบการเชื่อมต่อ
    try {
      console.log(`DEBUG: [API Route] Testing transporter connection`);
      await transporter.verify();
      console.log(`DEBUG: [API Route] Transporter connection verified`);
    } catch (verifyError) {
      console.error(`DEBUG: [API Route] Transporter verification failed:`, verifyError);
      throw new Error(`Email configuration error: ${verifyError.message}`);
    }

    // สร้าง HTML เนื้อหาอีเมล (โค้ดเดิม)
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
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">ขั้นตอนถัดไป</h3>
          <ol style="padding-left: 20px; color: #555;">
            <li style="margin-bottom: 10px;">ดูรายละเอียดผลการตรวจสอบทั้งหมดได้ในระบบของเรา</li>
            <li style="margin-bottom: 10px;">ดาวน์โหลดรายงานผลการตรวจสอบในรูปแบบเอกสาร</li>
            <li style="margin-bottom: 10px;">หากมีข้อสงสัยเกี่ยวกับผลการตรวจสอบ สามารถติดต่อทีมงานของเราได้</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.SITE_URL}/orders/${orderId}" style="display: inline-block; background-color: #444DDA; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ดูผลการตรวจสอบ</a>
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

    // ตั้งค่าอีเมล
    const mailOptions = {
      from: `"SuperCertify" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `[SuperCertify] ผลการตรวจสอบของคุณพร้อมแล้ว - คำสั่งซื้อ #${trackingNumber}`,
      html: emailContent,
    };
    
    console.log(`DEBUG: [API Route] Mail options:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    // ส่งอีเมล
    try {
      console.log(`DEBUG: [API Route] Sending email...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`DEBUG: [API Route] Email sent successfully:`, {
        messageId: info.messageId,
        response: info.response
      });
    } catch (sendError) {
      console.error(`DEBUG: [API Route] Error sending email:`, sendError);
      throw sendError;
    }

    console.log(`DEBUG: [API Route] Sending success response`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DEBUG: [API Route] Error in results-completed API route:`, error);
    return NextResponse.json(
      { message: 'Failed to send email', error: error.message },
      { status: 500 }
    );
  }
}