import { db } from '../../database/connection';

export interface CreateNotificationInput {
  client_id: string;
  appointment_id?: string;
  type: string;
  message: string;
  sent_at?: Date;
  status: 'sent' | 'failed';
}

export interface NotificationListItem {
  id: string;
  client_name: string;
  phone: string;
  type: string;
  message: string;
  status: string;
  sent_at?: Date | null;
  created_at: Date;
}

export class NotificationsRepository {
  async create(data: CreateNotificationInput): Promise<void> {
    await db('notifications').insert(data);
  }

  async findAll(): Promise<NotificationListItem[]> {
    return db('notifications')
      .join('clients', 'clients.id', 'notifications.client_id')
      .select(
        'notifications.id',
        'clients.name as client_name',
        'clients.phone',
        'notifications.type',
        'notifications.message',
        'notifications.status',
        'notifications.sent_at',
        'notifications.created_at',
      )
      .orderBy('notifications.created_at', 'desc');
  }
}
