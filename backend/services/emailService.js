const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendVerificationEmail(toEmail, fullName, token) {
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;

  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'KisanSetu - Apna account verify karein',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F5C3D;">Namaste ${fullName},</h2>
        <p>KisanSetu join karne ke liye dhanyawad! Apna account verify karne ke liye neeche diye button par click karein.</p>
        <a href="${verifyLink}" style="display: inline-block; background: #1F5C3D; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Account Verify Karein
        </a>
        <p style="color: #666; font-size: 13px;">Agar button kaam nahi kare, toh ye link copy karein: <br>${verifyLink}</p>
      </div>
    `
  };

  await sgMail.send(msg);
}

module.exports = { sendVerificationEmail };