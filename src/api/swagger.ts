import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Process Manager API',
      version: '1.0.0',
      description: 'API documentation for Process Manager',
    },
    components: {
      schemas: {
        TimeWindow: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
          required: ['start', 'end'],
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            test_window: { $ref: '#/components/schemas/TimeWindow' },
            preprod_window: { $ref: '#/components/schemas/TimeWindow' },
            prod_window: { $ref: '#/components/schemas/TimeWindow' },
          },
        },
        CreateEvent: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            test_window: { $ref: '#/components/schemas/TimeWindow' },
            preprod_window: { $ref: '#/components/schemas/TimeWindow' },
            prod_window: { $ref: '#/components/schemas/TimeWindow' },
          },
          required: ['name', 'test_window', 'preprod_window', 'prod_window'],
        },
        UpdateEvent: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            test_window: { $ref: '#/components/schemas/TimeWindow' },
            preprod_window: { $ref: '#/components/schemas/TimeWindow' },
            prod_window: { $ref: '#/components/schemas/TimeWindow' },
          },
        },
        AttachRelease: {
          type: 'object',
          properties: {
            releaseId: { type: 'string' },
            eventId: { type: 'string', format: 'uuid' },
          },
          required: ['releaseId', 'eventId'],
        },
        ReleaseAttachment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            releaseId: { type: 'string' },
            eventId: { type: 'string', format: 'uuid' },
            attachedAt: { type: 'string', format: 'date-time' },
          },
        },
        ValidationResponse: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            phase: { type: 'string', enum: ['TEST', 'PREPROD', 'PROD', null] },
            message: { type: 'string' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            environments: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string', enum: ['APAC', 'CH', 'EMEA', 'US'] },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateApplication: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            environments: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string', enum: ['APAC', 'CH', 'EMEA', 'US'] },
              },
            },
          },
          required: ['name', 'environments'],
        },
      },
    },
  },
  apis: ['./src/api/routes.ts'], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
