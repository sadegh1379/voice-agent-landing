import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with API key
// Get your free API key from: https://resend.com/api-keys
const resend = new Resend("re_X9JYd3wA_GJsLhvzDUqeFkmPxmPpBrDhu");

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

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: email, // User's email as sender
      to: "akbarisadegh382@gmail.com",
      subject: `درخواست دمو جدید از ${name}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background: #f5f5f5; border-radius: 10px;">
          <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">
            🎯 درخواست دمو جدید - دستیار صوتی فارسی
          </h2>
          <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <p><strong>👤 نام:</strong> ${name}</p>
            <p><strong>📧 ایمیل:</strong> ${email}</p>
            <p><strong>📱 شماره تماس:</strong> ${phone}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            این ایمیل به صورت خودکار از وبسایت دستیار صوتی فارسی ارسال شده است.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "خطا در ارسال درخواست. لطفاً دوباره تلاش کنید." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "درخواست شما با موفقیت ارسال شد", data },
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
