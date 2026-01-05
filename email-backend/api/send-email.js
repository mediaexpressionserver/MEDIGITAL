import nodemailer from "nodemailer";

/**
 * Minimal HTML escape helper
 */
function escapeHtml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { name, mobile, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields: name, email, message",
    });
  }

  const {
    SMTP_USER,
    SMTP_APP_PASS,
    RECEIVER_EMAIL = "nazeernashih@gmail.com",
  } = process.env;

  if (!SMTP_USER || !SMTP_APP_PASS) {
    console.error("Missing SMTP credentials");
    return res.status(500).json({
      ok: false,
      error: "Email service not configured",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_APP_PASS,
      },
    });

    const plainBody = `
You have a new contact form submission:

Name: ${name}
Mobile: ${mobile || "N/A"}
Email: ${email}

Message:
${message}

-- Sent from website contact form
`.trim();

    const htmlBody = `
<div style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#f59e0b;padding:16px">
      <h2 style="margin:0;color:#fff">📩 New Contact Form Message</h2>
    </div>
    <div style="padding:20px">
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Mobile:</strong> ${escapeHtml(mobile || "N/A")}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      <hr />
      <p style="font-size:12px;color:#666">
        Sent from website contact form<br/>
        ${new Date().toLocaleString()}
      </p>
    </div>
  </div>
</div>
`;

    const info = await transporter.sendMail({
      from: `"Website Contact" <${SMTP_USER}>`,
      to: RECEIVER_EMAIL,
      subject: `${name} wanted to reach out to you`,
      text: plainBody,
      html: htmlBody,
    });

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({
      ok: false,
      error: "Email send failed",
    });
  }
}