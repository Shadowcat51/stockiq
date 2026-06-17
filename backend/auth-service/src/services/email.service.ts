import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using the default SMTP transport
export const createTransporter = async () => {
  // If user provided SMTP credentials, use them (for real email testing)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal Email for local development if no SMTP config is found
  console.log('No SMTP credentials found in .env, generating Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const transporter = await createTransporter();
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: '"StockIQ" <noreply@stockiq.app>',
    to: email,
    subject: 'Verifikasi Email StockIQ Anda',
    html: `
      <h2>Halo ${name},</h2>
      <p>Terima kasih telah mendaftar di StockIQ! Silakan klik link di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akun Anda:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verifikasi Email</a>
      <p>Jika Anda tidak merasa mendaftar di StockIQ, abaikan email ini.</p>
      <p>Link ini berlaku selama 24 jam.</p>
    `,
  });

  console.log('Message sent: %s', info.messageId);
  if (info.messageId && !process.env.SMTP_HOST) {
    console.log('\n======================================================');
    console.log('⚠️  TIDAK MENGGUNAKAN SMTP ASLI (MODE DEVELOPMENT) ⚠️');
    console.log('Buka link ini di browser Anda untuk Verifikasi Email:');
    console.log(nodemailer.getTestMessageUrl(info));
    console.log('======================================================\n');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string) => {
  const transporter = await createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: '"StockIQ" <noreply@stockiq.app>',
    to: email,
    subject: 'Reset Password StockIQ Anda',
    html: `
      <h2>Halo ${name},</h2>
      <p>Kami menerima permintaan untuk mereset password Anda. Klik link di bawah ini untuk membuat password baru:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ff4d4f; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Jika Anda tidak meminta reset password, abaikan email ini dan akun Anda akan tetap aman.</p>
      <p>Link ini berlaku selama 1 jam.</p>
    `,
  });

  console.log('Message sent: %s', info.messageId);
  if (info.messageId && !process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};
