import 'dotenv/config';

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    console.error('Evolution API environment variables are not configured');
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error('Failed to send WhatsApp message through Evolution API', error);
    return false;
  }
}
