import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to SmartWhale! 🐋',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #60a5fa; margin: 0; font-size: 32px;">SmartWhale 🐋</h1>
        </div>
        
        <h2 style="color: #e2e8f0; font-size: 24px; margin-top: 0;">Welcome, ${name}!</h2>
        
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
          You have successfully created your SmartWhale account. You're now part of a community of traders who monitor institutional crypto movements.
        </p>

        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #94a3b8; margin: 0 0 10px 0; font-weight: bold;">Get Started:</p>
          <ul style="color: #94a3b8; margin: 10px 0; padding-left: 20px;">
            <li>Complete your profile</li>
            <li>Set up your portfolio</li>
            <li>Enable whale alerts</li>
            <li>Start tracking institutional movements</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://smartwhale-production.vercel.app/dashboard" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">

        <p style="color: #64748b; font-size: 13px; text-align: center;">
          If you have any questions, reply to this email or visit our <a href="https://smartwhale-production.vercel.app/docs" style="color: #3b82f6;">documentation</a>.
        </p>

        <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 20px;">
          SmartWhale © 2025. All rights reserved.
        </p>
      </div>
    `,
  }),

  alert: (whale: string, action: string, coin: string, amount: string) => ({
    subject: `🐋 Whale Alert: ${action} ${amount} ${coin}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px 20px; border-radius: 10px;">
        <h2 style="color: #fbbf24; font-size: 24px; margin-top: 0;">🐋 Whale Alert!</h2>
        
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
          A large whale just <strong>${action}</strong> <strong>${amount} ${coin}</strong>
        </p>

        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #94a3b8; margin: 0;">Wallet: <code style="color: #60a5fa;">${whale}</code></p>
        </div>

        <a href="https://smartwhale-production.vercel.app/alerts" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
          View Details
        </a>
      </div>
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Reset Your SmartWhale Password',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px 20px; border-radius: 10px;">
        <h2 style="color: #e2e8f0; font-size: 24px; margin-top: 0;">Reset Your Password</h2>
        
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
          Click the button below to reset your password. This link expires in 24 hours.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  }),
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, type, data } = await request.json()

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let template

    switch (type) {
      case 'welcome':
        template = emailTemplates.welcome(data.name)
        break
      case 'alert':
        template = emailTemplates.alert(data.whale, data.action, data.coin, data.amount)
        break
      case 'passwordReset':
        template = emailTemplates.passwordReset(data.resetLink)
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@smartwhale.app',
      subject: template.subject,
      html: template.html,
    }

    await sgMail.send(msg as sgMail.MailDataRequired)

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
