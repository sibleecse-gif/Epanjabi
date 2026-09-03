import axios from 'axios';

/**
 * SMS dispatcher.
 * Providers are not configured in dev so we log the message to the console.
 * To integrate a real provider (Banglalink SMS / Twilio / SSL Wireless),
 * add the provider credentials to env and implement the branch below.
 */

interface SendSmsInput {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SendSmsInput): Promise<{ success: boolean; provider: string }> {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider !== 'console') {
    try {
      // Example: Twilio-like generic transport. Replace with your provider SDK.
      const res = await axios.post(
        `https://sms-provider.example.com/send`,
        { to, message },
        { headers: { Authorization: `Bearer ${process.env.SMS_API_KEY || ''}` } }
      );
      return { success: res.status === 200, provider };
    } catch (err) {
      console.error('❌ SMS send failed:', (err as Error).message);
      return { success: false, provider };
    }
  }

  console.log(`📱 [SMS] -> ${to}: ${message}`);
  return { success: true, provider: 'console' };
}