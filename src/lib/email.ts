import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'
import { requireConfig } from './secrets'

function emailProvider(): 'sendgrid' | 'smtp' {
  const provider = requireConfig('EMAIL_PROVIDER')
  if (provider !== 'sendgrid' && provider !== 'smtp') throw new Error('EMAIL_PROVIDER must be sendgrid or smtp')
  return provider
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = options.from || requireConfig('EMAIL_FROM')

  if (emailProvider() === 'sendgrid') {
    await sendEmailViaSendGrid({ ...options, from })
  } else {
    await sendEmailViaSMTP({ ...options, from })
  }
}

/**
 * Send email via SendGrid
 */
async function sendEmailViaSendGrid(options: EmailOptions): Promise<void> {
  sgMail.setApiKey(requireConfig('SENDGRID_API_KEY'))
  const msg = {
    to: options.to,
    from: options.from!,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      type: att.contentType,
      disposition: 'attachment',
    })),
  }

  await sgMail.send(msg as any)
}

/**
 * Send email via SMTP
 */
async function sendEmailViaSMTP(options: EmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: requireConfig('SMTP_HOST'),
    port: Number.parseInt(requireConfig('SMTP_PORT'), 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: requireConfig('SMTP_USER'), pass: requireConfig('SMTP_PASS') },
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
  })
}

/**
 * Send client invitation email
 */
export async function sendClientInvitation(
  clientEmail: string,
  clientName: string,
  portalUrl: string
): Promise<void> {
  await sendEmail({
    to: clientEmail,
    subject: 'Welcome to Our Financial Services Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome ${clientName}!</h2>
        <p>You've been invited to access our secure client portal where you can:</p>
        <ul>
          <li>View your financial documents</li>
          <li>Upload receipts and tax documents</li>
          <li>Track your tax returns</li>
          <li>View invoices and make payments</li>
          <li>Communicate securely with our team</li>
        </ul>
        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Portal
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please don't hesitate to contact us.
        </p>
      </div>
    `,
  })
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  clientEmail: string,
  clientName: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string,
  paymentUrl: string
): Promise<void> {
  await sendEmail({
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from Financial Services`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice ${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>Please find your invoice details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Due:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${dueDate}</td>
          </tr>
        </table>
        <p style="margin: 30px 0;">
          <a href="${paymentUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Pay Now
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Thank you for your business!
        </p>
      </div>
    `,
  })
}

/**
 * Send document request email
 */
export async function sendDocumentRequest(
  clientEmail: string,
  clientName: string,
  documents: string[],
  dueDate?: string
): Promise<void> {
  const documentList = documents.map(doc => `<li>${doc}</li>`).join('')

  await sendEmail({
    to: clientEmail,
    subject: 'Document Request - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Document Request</h2>
        <p>Dear ${clientName},</p>
        <p>We need the following documents to proceed with your tax return/financial services:</p>
        <ul style="margin: 20px 0;">
          ${documentList}
        </ul>
        ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
        <p style="margin: 30px 0;">
          Please upload these documents through our secure client portal.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you have any questions or need assistance, please contact us.
        </p>
      </div>
    `,
  })
}

/**
 * Send tax deadline reminder
 */
export async function sendTaxDeadlineReminder(
  clientEmail: string,
  clientName: string,
  deadlineName: string,
  dueDate: string,
  daysUntilDue: number
): Promise<void> {
  await sendEmail({
    to: clientEmail,
    subject: `Tax Deadline Reminder: ${deadlineName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">⏰ Tax Deadline Reminder</h2>
        <p>Dear ${clientName},</p>
        <p>This is a reminder that the following tax deadline is approaching:</p>
        <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>${deadlineName}</strong></p>
          <p style="margin: 5px 0;">Due Date: ${dueDate}</p>
          <p style="margin: 5px 0; color: #DC2626;">${daysUntilDue} days remaining</p>
        </div>
        <p>Please ensure all necessary documents are submitted and reviewed before this deadline.</p>
        <p style="color: #666; font-size: 14px;">
          Contact us if you need any assistance or have questions.
        </p>
      </div>
    `,
  })
}

/**
 * Send notification email
 */
export async function sendNotification(
  to: string,
  subject: string,
  message: string
): Promise<void> {
  await sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${message}</p>
      </div>
    `,
  })
}
