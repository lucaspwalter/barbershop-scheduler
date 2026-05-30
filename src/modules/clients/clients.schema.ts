const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

const clientBody = {
  type: 'object',
  required: ['name', 'phone'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    phone: { type: 'string', minLength: 1, maxLength: 20 },
    email: { type: 'string', format: 'email', maxLength: 150 },
  },
};

const clientUpdateBody = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: clientBody.properties,
};

export const createClientSchema = {
  body: clientBody,
};

export const getClientSchema = {
  params: idParam,
};

export const updateClientSchema = {
  params: idParam,
  body: clientUpdateBody,
};

export const deleteClientSchema = {
  params: idParam,
};
