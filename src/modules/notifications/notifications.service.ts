import { sendWhatsAppMessage } from '../../lib/evolution';
import { NotificationsRepository } from './notifications.repository';

export interface SendNotificationParams {
  client_id: string;
  phone: string;
  type: string;
  message: string;
  appointment_id?: string;
}

export class NotificationsService {
  constructor(private readonly notificationsRepository = new NotificationsRepository()) {}

  async send(params: SendNotificationParams): Promise<void> {
    let sent = false;

    try {
      sent = await sendWhatsAppMessage(params.phone, params.message);
    } catch (error) {
      console.error('Unexpected notification send error', error);
      sent = false;
    }

    try {
      await this.notificationsRepository.create({
        client_id: params.client_id,
        appointment_id: params.appointment_id,
        type: params.type,
        message: params.message,
        status: sent ? 'sent' : 'failed',
        sent_at: sent ? new Date() : undefined,
      });
    } catch (error) {
      console.error('Failed to persist notification status', error);
    }
  }

  async findAll() {
    return this.notificationsRepository.findAll();
  }
}
