import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !portRaw || !user || !pass || !from) {
    throw new Error(
      "Faltan variables SMTP. Necesitas SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y EMAIL_FROM"
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port)) throw new Error("SMTP_PORT inválido");

  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE.toLowerCase() === "true"
    : port === 465;

  return { host, port, secure, user, pass, from };
}

export async function sendEmail(input: SendEmailInput) {
  const cfg = getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  const info = await transporter.sendMail({
    from: cfg.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return info.messageId;
}
