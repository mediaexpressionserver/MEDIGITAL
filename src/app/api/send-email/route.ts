import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, mobile, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Website Contact" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_RECEIVER,
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      html: `
  <div style="background:#f4f4f5; padding:40px; font-family: Inter, Arial, sans-serif;">
    <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #ff8a00, #ffb347); padding:26px;">
        <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:0.4px;">
          New Enquiry
        </h1>
        <p style="margin:6px 0 0; font-size:13px; color:rgba(255,255,255,0.9);">
          Medigital Contact Form
        </p>
      </div>

      <!-- Body -->
      <div style="padding:28px; color:#1f2937;">
        <p style="font-size:14px; margin:0 0 18px;">
          You’ve received a new enquiry through your website. Details are below.
        </p>

        <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr>
              <td style="padding:8px 0; color:#6b7280; width:120px;">Name</td>
              <td style="padding:8px 0; font-weight:600;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280;">Email</td>
              <td style="padding:8px 0;">${email}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280;">Mobile</td>
              <td style="padding:8px 0;">${mobile || "N/A"}</td>
            </tr>
          </table>
        </div>

        <!-- Message -->
        <div style="margin-top:22px;">
          <p style="font-size:13px; color:#6b7280; margin-bottom:8px;">
            Message
          </p>
          <div style="background:#fff7ed; border-left:4px solid #ff8a00; padding:16px; border-radius:8px; font-size:14px; line-height:1.6;">
            ${message.replace(/\n/g, "<br/>")}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
        © ${new Date().getFullYear()} Medigital · This email was generated automatically
      </div>

    </div>
  </div>
`,
    });
console.log("✅ send-email API hit");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email error:", err);
    return NextResponse.json(
      { ok: false, error: "Email failed" },
      { status: 500 }
    );
  }
}