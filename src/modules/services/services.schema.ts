const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

const serviceBody = {
  type: 'object',
  required: ['name', 'duration_minutes', 'price'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string' },
    duration_minutes: {
      type: 'integer',
      minimum: 15,
      maximum: 240,
      multipleOf: 15,
    },
    price: {
      type: 'number',
      exclusiveMinimum: 0,
    },
  },
};

const serviceUpdateBody = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: serviceBody.properties,
};

export const createServiceSchema = {
  body: serviceBody,
};

export const listServicesSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      includeInactive: { type: 'string', enum: ['true', 'false'] },
    },
  },
};

export const getServiceSchema = {
  params: idParam,
};

export const updateServiceSchema = {
  params: idParam,
  body: serviceUpdateBody,
};

export const deleteServiceSchema = {
  params: idParam,
};
