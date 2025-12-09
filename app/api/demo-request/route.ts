import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ============================================
// تنظیمات Gmail - مراحل فعال‌سازی:
// ============================================
// 1. وارد حساب Gmail شو: https://myaccount.google.com
// 2. به Security برو و 2-Step Verification رو فعال کن
// 3. بعد از فعال‌سازی، به App Passwords برو:
//    https://myaccount.google.com/apppasswords
// 4. یه App Password جدید بساز (نام: "Voice Agent")
// 5. رمز 16 کاراکتری رو کپی کن و جایگزین کن
// ============================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "akbarisadegh382@gmail.com", // ایمیل Gmail خودت
    pass: "YOUR_APP_PASSWORD_HERE",    // App Password از گوگل (نه رمز معمولی!)
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate input
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی هستند" },
        { status: 400 }
      );
    }

    // Send email using Nodemailer
    const mailOptions = {
      from: `"دستیار صوتی فارسی" <akbarisadegh382@gmail.com>`,
      to: "akbarisadegh382@gmail.com",
      replyTo: email, // وقتی Reply بزنی، به ایمیل کاربر میره
      subject: `🎯 درخواست دمو جدید از ${name}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); border-radius: 16px; max-width: 500px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 24px;">🎙️ دستیار صوتی فارسی</h1>
            <p style="color: #888; margin: 5px 0;">درخواست دمو جدید</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; border: 1px solid rgba(0,212,255,0.2);">
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="color: #888; font-size: 12px;">👤 نام</span>
              <p style="color: #fff; margin: 4px 0 0 0; font-size: 16px; font-weight: bold;">${name}</p>
            </div>
            
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="color: #888; font-size: 12px;">📧 ایمیل</span>
              <p style="color: #00d4ff; margin: 4px 0 0 0; font-size: 16px;">
                <a href="mailto:${email}" style="color: #00d4ff; text-decoration: none;">${email}</a>
              </p>
            </div>
            
            <div>
              <span style="color: #888; font-size: 12px;">📱 شماره تماس</span>
              <p style="color: #fff; margin: 4px 0 0 0; font-size: 16px; font-weight: bold; direction: ltr; text-align: right;">
                <a href="tel:${phone}" style="color: #fff; text-decoration: none;">${phone}</a>
              </p>
            </div>
          </div>
          
          <p style="color: #666; font-size: 11px; margin-top: 20px; text-align: center;">
            ارسال خودکار از وبسایت دستیار صوتی فارسی • ${new Date().toLocaleDateString('fa-IR')}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "درخواست شما با موفقیت ارسال شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "خطا در ارسال درخواست. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
