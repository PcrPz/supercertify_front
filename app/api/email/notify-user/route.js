import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {

  try {
    
    const body = await request.json();
    console.log(body)
    const { trackingNumber, customerEmail, customerName, totalPrice ,orderId} = body;

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

    // สร้าง HTML เนื้อหาอีเมล
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #444DDA; margin: 0;">การชำระเงินเสร็จสมบูรณ์</h2>
          <p style="color: #666;">รหัสคำสั่งซื้อ: #${trackingNumber}</p>
        </div>
        
        <div style="background-color: #f1f7f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #2E7D32;">การชำระเงินของคุณได้รับการยืนยันแล้ว</h3>
          <p>เรียน ${customerName || 'ท่านผู้ใช้บริการ'},</p>
          <p>เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว ขณะนี้เราจะเริ่มกระบวนการตรวจสอบประวัติตามบริการที่คุณสั่งซื้อ</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">สรุปคำสั่งซื้อ</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;">รหัสคำสั่งซื้อ:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">#${trackingNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">ยอดชำระ:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #2E7D32;">${parseInt(totalPrice || 0).toLocaleString()} บาท</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">ขั้นตอนถัดไป</h3>
          <ol style="padding-left: 20px; color: #555;">
            <li style="margin-bottom: 10px;">เราจะส่งแบบฟอร์มยินยอมให้ผู้สมัครทางอีเมลภายใน 24 ชั่วโมง</li>
            <li style="margin-bottom: 10px;">เมื่อผู้สมัครกรอกแบบฟอร์มแล้ว เราจะเริ่มกระบวนการตรวจสอบประวัติ</li>
            <li style="margin-bottom: 10px;">คุณจะได้รับการแจ้งเตือนเมื่อการตรวจสอบเสร็จสิ้น</li>
            <li style="margin-bottom: 10px;">คุณสามารถดูผลการตรวจสอบได้ในระบบหรือผ่านอีเมลที่เราจะส่งให้</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.SITE_URL}/background-check/payment-success?orderId=${orderId}" style="display: inline-block; background-color: #444DDA; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ติดตามสถานะคำสั่งซื้อ</a>
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
      subject: `[SuperCertify] การชำระเงินของคุณได้รับการยืนยันแล้ว - คำสั่งซื้อ #${trackingNumber}`,
      html: emailContent,
    };

    // ส่งอีเมล
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { message: 'Failed to send email', error: error.message },
      { status: 500 }
    );
  }
}