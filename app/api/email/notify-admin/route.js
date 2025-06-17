import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getAdminEmails } from '@/services/profileApi'; // ปรับ path ตามโครงสร้างโปรเจ็คของคุณ

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Admin notification request body:', body);
    const { orderId, trackingNumber, totalPrice, paymentInfo } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orderId || !trackingNumber) {
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

    // เรียกใช้ API เพื่อดึงอีเมลของแอดมินทั้งหมดโดยตรงจาก ProfileAPI
    try {
      const adminEmails = await getAdminEmails();
      
      if (!adminEmails || adminEmails.length === 0) {
        console.error('No admin emails found from API');
        
        // ถ้าไม่มีอีเมลแอดมิน ให้ใช้ค่าจาก environment variables (ถ้ามี)
        if (process.env.ADMIN_EMAILS) {
          console.log('Using fallback admin emails from environment variable');
          const fallbackEmails = process.env.ADMIN_EMAILS.split(',');
          
          // ส่งต่อเพื่อใช้อีเมลแอดมินจาก environment
          return sendEmailToAdmins(transporter, fallbackEmails, { orderId, trackingNumber, totalPrice, paymentInfo });
        }
        
        return NextResponse.json(
          { message: 'No admin emails found and no fallback available' },
          { status: 500 }
        );
      }
      
      console.log('Admin emails retrieved:', adminEmails);
      return sendEmailToAdmins(transporter, adminEmails, { orderId, trackingNumber, totalPrice, paymentInfo });
      
    } catch (apiError) {
      console.error('Error fetching admin emails from API:', apiError);
      
      // ถ้าเกิดข้อผิดพลาดในการเรียก API ให้ใช้ค่าจาก environment variables (ถ้ามี)
      if (process.env.ADMIN_EMAILS) {
        console.log('Using fallback admin emails from environment variable after API error');
        const fallbackEmails = process.env.ADMIN_EMAILS.split(',');
        
        // ส่งต่อเพื่อใช้อีเมลแอดมินจาก environment
        return sendEmailToAdmins(transporter, fallbackEmails, { orderId, trackingNumber, totalPrice, paymentInfo });
      }
      
      return NextResponse.json(
        { message: 'Failed to fetch admin emails and no fallback available', error: apiError.message },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error sending email to admin:', error);
    return NextResponse.json(
      { message: 'Failed to send email to admin', error: error.message },
      { status: 500 }
    );
  }
}

// แยกฟังก์ชันสำหรับการส่งอีเมลออกมา
async function sendEmailToAdmins(transporter, adminEmails, { orderId, trackingNumber, totalPrice, paymentInfo }) {
  // สร้าง URL สำหรับการ redirect หลังจาก login
  const redirectUrl = encodeURIComponent(`/admin/dashboard/${orderId}`);
  const actionUrl = `${process.env.SITE_URL}/login?callbackUrl=${redirectUrl}`;
  
  // สร้าง HTML เนื้อหาอีเมล
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #444DDA; margin: 0;">มีการแจ้งชำระเงินใหม่</h2>
        <p style="color: #666;">รหัสคำสั่งซื้อ: #${trackingNumber}</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">ข้อมูลการชำระเงิน</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;">ชื่อผู้โอน:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${paymentInfo?.transferInfo?.name || 'ไม่ระบุ'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">วันที่โอน:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${paymentInfo?.transferInfo?.date || 'ไม่ระบุ'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">จำนวนเงิน:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${parseInt(paymentInfo?.transferInfo?.amount || 0).toLocaleString()} บาท</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">ยอดตามคำสั่งซื้อ:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">${parseInt(totalPrice || 0).toLocaleString()} บาท</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">วิธีการชำระเงิน:</td>
            <td style="padding: 8px 0;">${paymentInfo?.paymentMethod === 'qr_payment' ? 'QR พร้อมเพย์' : 'โอนเงินผ่านธนาคาร'}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${actionUrl}" style="display: inline-block; background-color: #444DDA; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ดูรายละเอียดคำสั่งซื้อ</a>
      </div>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #2196F3;">
        <p style="margin: 0; color: #1565C0; font-size: 14px;">
          <strong>หมายเหตุ:</strong> กรุณาเข้าสู่ระบบก่อนเข้าดูรายละเอียดคำสั่งซื้อ
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>นี่เป็นอีเมลอัตโนมัติจากระบบ SuperCertify กรุณาอย่าตอบกลับ</p>
        <p>อีเมลนี้ถูกส่งไปยังแอดมินทั้งหมดในระบบ</p>
      </div>
    </div>
  `;

  // ตั้งค่าอีเมล
  const mailOptions = {
    from: `"SuperCertify" <${process.env.EMAIL_FROM}>`,
    to: adminEmails.join(','),
    subject: `[SuperCertify] มีการแจ้งชำระเงินใหม่ - คำสั่งซื้อ #${trackingNumber}`,
    html: emailContent,
  };

  // ถ้ามีสลิปการโอนเงิน ให้แนบไปกับอีเมล
  if (paymentInfo?.transferInfo?.receiptUrl) {
    mailOptions.attachments = [
      {
        filename: `receipt-${trackingNumber}.jpg`,
        path: paymentInfo.transferInfo.receiptUrl
      }
    ];
  }

  // ส่งอีเมล
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent to admin:', info.messageId);
    console.log('Recipients:', adminEmails.join(', '));
    
    return NextResponse.json({ 
      success: true,
      recipients: adminEmails,
      messageId: info.messageId
    });
  } catch (emailError) {
    console.error('Error in nodemailer:', emailError);
    return NextResponse.json(
      { message: 'Failed to send email', error: emailError.message },
      { status: 500 }
    );
  }
}