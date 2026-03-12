const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  const subjects = {
    verification: 'Verify Your Rounds Account',
    booking: 'Your Ride OTP - Rounds',
  };

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 28px; margin: 0;">Rounds</h1>
        <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Bike Rental Service</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">
          ${purpose === 'verification' ? 'Welcome! Please verify your email address.' : 'Use this OTP to start your ride.'}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: #0ea5e9; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 32px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 16px 0 0;">
          This OTP expires in 10 minutes. Do not share it with anyone.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: subjects[purpose] || 'Your OTP - Rounds',
    html,
  });
};

module.exports = { sendEmail, sendOTPEmail };
