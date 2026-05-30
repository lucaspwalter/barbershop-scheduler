const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

const barberBody = {
  type: 'object',
  required: ['name', 'email'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email', maxLength: 150 },
    phone: { type: 'string', maxLength: 20 },
    avatar_url: { type: 'string' },
  },
};

const barberUpdateBody = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: barberBody.properties,
};

export const createBarberSchema = {
  body: barberBody,
};

export const listBarbersSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      includeInactive: { type: 'string', enum: ['true', 'false'] },
    },
  },
};

export const getBarberSchema = {
  params: idParam,
};

export const updateBarberSchema = {
  params: idParam,
  body: barberUpdateBody,
};

export const deleteBarberSchema = {
  params: idParam,
};
