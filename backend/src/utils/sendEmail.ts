import axios from 'axios';

/**
 * Email dispatcher.
 * In dev, logs the email to the console. To use SendGrid / AWS SES
 * in production, set SENDGRID_API_KEY and implement the branch.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ success: boolean; provider: string }> {
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'no-reply@aagdoom.com', name: 'Aagdoom Fashion' },
          subject,
          content: [{ type: 'text/html', value: html }],
        },
        { headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` } }
      );
      return { success: res.status === 202, provider: 'sendgrid' };
    } catch (err) {
      console.error('❌ Email send failed:', (err as Error).message);
      return { success: false, provider: 'sendgrid' };
    }
  }

  console.log(`✉️  [EMAIL] To: ${to}\n  Subject: ${subject}\n  Body: ${html.replace(/<[^>]+>/g, ' ').slice(0, 200)}`);
  return { success: true, provider: 'console' };
}

export function orderConfirmationEmail(orderNumber: string, grandTotalTk: number, deliveryFee: number) {
  return `
    <h2>Aagdoom Fashion</h2>
    <p>আপনার অর্ডার <strong>#${orderNumber}</strong> গ্রহণ করা হয়েছে।</p>
    <p>সর্বমোট: ${grandTotalTk} টাকা (ডেলিভারি চার্জ: ${deliveryFee} টাকা)।</p>
    <p>ডেলিভারি: ৩-৫ কর্মদিবস। ধন্যবাদ!</p>
  `;
}