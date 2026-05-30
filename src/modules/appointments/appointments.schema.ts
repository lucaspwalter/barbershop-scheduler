const appointmentStatuses = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

export const createAppointmentSchema = {
  body: {
    type: 'object',
    required: ['barber_id', 'service_id', 'client_id', 'starts_at'],
    additionalProperties: false,
    properties: {
      barber_id: { type: 'string', format: 'uuid' },
      service_id: { type: 'string', format: 'uuid' },
      client_id: { type: 'string', format: 'uuid' },
      starts_at: { type: 'string', format: 'date-time' },
    },
  },
};

export const listAppointmentsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      barber_id: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: appointmentStatuses },
    },
  },
};

export const getAppointmentSchema = {
  params: idParam,
};

export const updateAppointmentStatusSchema = {
  params: idParam,
  body: {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: appointmentStatuses },
    },
  },
};

export const deleteAppointmentSchema = {
  params: idParam,
};
