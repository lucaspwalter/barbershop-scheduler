const queueStatuses = ['waiting', 'called', 'in_progress', 'done', 'cancelled'];

const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

export const createQueueEntrySchema = {
  body: {
    type: 'object',
    required: ['barber_id', 'service_id', 'client_id'],
    additionalProperties: false,
    properties: {
      barber_id: { type: 'string', format: 'uuid' },
      service_id: { type: 'string', format: 'uuid' },
      client_id: { type: 'string', format: 'uuid' },
    },
  },
};

export const listQueueByBarberSchema = {
  params: {
    type: 'object',
    required: ['barber_id'],
    properties: {
      barber_id: { type: 'string', format: 'uuid' },
    },
  },
};

export const updateQueueStatusSchema = {
  params: idParam,
  body: {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: queueStatuses },
    },
  },
};

export const deleteQueueEntrySchema = {
  params: idParam,
};
