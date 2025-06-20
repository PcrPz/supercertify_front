// app/api/email/payment-rejected/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Payment rejection email request body:', body);
    const { trackingNumber, customerEmail, customerName, totalPrice, orderId, paymentInfo } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!trackingNumber || !customerEmail) {
      return NextResponse.json(
        { message: 'Missing required information' },
        { status: 400 }
      );
    }

    // สร้าง transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // สร้าง URL สำหรับการ redirect หลังจาก login
    // ปรับเปลี่ยนเป็น path ที่ถูกต้อง: /background-check/payment/:orderId
    const redirectUrl = encodeURIComponent(`/background-check/payment/${orderId}`);
    const actionUrl = `${process.env.SITE_URL}/login?callbackUrl=${redirectUrl}`;

    // สร้าง HTML เนื้อหาอีเมล
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #D32F2F; margin: 0;">การชำระเงินไม่สำเร็จ</h2>
          <p style="color: #666;">รหัสคำสั่งซื้อ: #${trackingNumber}</p>
        </div>
        
        <div style="background-color: #FFEBEE; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #D32F2F;">
          <h3 style="margin-top: 0; color: #D32F2F;">การชำระเงินของคุณไม่สามารถตรวจสอบได้</h3>
          <p>เรียน ${customerName || 'ท่านผู้ใช้บริการ'},</p>
          <p>เราขออภัย แต่การชำระเงินของคุณไม่สามารถตรวจสอบได้ หรือมีข้อมูลไม่ครบถ้วน กรุณาทำรายการชำระเงินใหม่อีกครั้ง</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">สาเหตุที่อาจเป็นไปได้</h3>
          <ul style="padding-left: 20px; color: #555;">
            <li style="margin-bottom: 10px;">ข้อมูลการโอนเงินไม่ถูกต้องหรือไม่ชัดเจน</li>
            <li style="margin-bottom: 10px;">จำนวนเงินที่โอนไม่ตรงกับยอดที่ต้องชำระ</li>
            <li style="margin-bottom: 10px;">วันที่หรือเวลาในการโอนเงินไม่ตรงกับที่แจ้งไว้</li>
            <li style="margin-bottom: 10px;">รูปภาพสลิปไม่ชัดเจนหรือไม่สามารถอ่านข้อมูลได้</li>
            <li style="margin-bottom: 10px;">อาจมีความล่าช้าในระบบธนาคาร</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">ขั้นตอนถัดไป</h3>
          <ol style="padding-left: 20px; color: #555;">
            <li style="margin-bottom: 10px;">ตรวจสอบข้อมูลการชำระเงินของคุณให้ถูกต้อง</li>
            <li style="margin-bottom: 10px;">กรอกข้อมูลการชำระเงินใหม่อีกครั้ง</li>
            <li style="margin-bottom: 10px;">แนบสลิปการโอนเงินที่ชัดเจน</li>
            <li style="margin-bottom: 10px;">ตรวจสอบว่าจำนวนเงินที่โอนตรงกับยอดที่ต้องชำระ (${parseInt(totalPrice || 0).toLocaleString()} บาท)</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${actionUrl}" style="display: inline-block; background-color: #444DDA; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ชำระเงินอีกครั้ง</a>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #2196F3;">
          <p style="margin: 0; color: #1565C0; font-size: 14px;">
            <strong>หมายเหตุ:</strong> คุณสามารถชำระเงินใหม่ได้โดยใช้ลิงก์ด้านบน คำสั่งซื้อของคุณจะยังคงอยู่ในระบบ
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

    // ตั้งค่าอีเมล
    const mailOptions = {
      from: `"SuperCertify" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `[SuperCertify] การชำระเงินไม่สำเร็จ - คำสั่งซื้อ #${trackingNumber}`,
      html: emailContent,
    };

    // ส่งอีเมล
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent to customer:', info.messageId);

    return NextResponse.json({ 
      success: true,
      recipient: customerEmail,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { message: 'Failed to send email', error: error.message },
      { status: 500 }
    );
  }
}