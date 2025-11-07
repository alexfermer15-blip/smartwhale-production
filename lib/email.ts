import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@smartwhale.app',
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export const emailTemplates = {
  welcome: (name: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to SmartWhale, ${name}! 🐋</h2>
      <p>You've successfully created your account. Start tracking whale wallets and predict market moves!</p>
      <a href="https://smartwhale-production.vercel.app/dashboard" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to Dashboard</a>
    </div>
  `,

  alert: (whale: string, action: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Whale Alert! 🐋</h2>
      <p>Whale <strong>${whale}</strong> just <strong>${action}</strong> a large amount of crypto!</p>
      <a href="https://smartwhale-production.vercel.app/alerts" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Details</a>
    </div>
  `,

  passwordReset: (resetLink: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Reset Password</a>
    </div>
  `,
}
