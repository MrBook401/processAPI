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
            enabled: { type: 'boolean', default: true },
          },
          required: ['start', 'end'],
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            time_windows: {
              type: 'object',
              properties: {
                test: { $ref: '#/components/schemas/TimeWindow' },
                preprod: { $ref: '#/components/schemas/TimeWindow' },
                prod: { $ref: '#/components/schemas/TimeWindow' },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
            event_enabled: { type: 'boolean' },
            event_open_for_delivery: { type: 'boolean' },
            type: { type: 'string' },
          },
        },
        CreateEvent: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            time_windows: {
              type: 'object',
              properties: {
                test: { $ref: '#/components/schemas/TimeWindow' },
                preprod: { $ref: '#/components/schemas/TimeWindow' },
                prod: { $ref: '#/components/schemas/TimeWindow' },
              },
            },
            event_enabled: { type: 'boolean', default: true },
            event_open_for_delivery: { type: 'boolean', default: true },
            type: { type: 'string', default: 'standard' },
          },
          required: ['name', 'time_windows'],
        },
        UpdateEvent: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            time_windows: {
              type: 'object',
              properties: {
                test: { $ref: '#/components/schemas/TimeWindow' },
                preprod: { $ref: '#/components/schemas/TimeWindow' },
                prod: { $ref: '#/components/schemas/TimeWindow' },
              },
            },
            event_enabled: { type: 'boolean' },
            event_open_for_delivery: { type: 'boolean' },
            type: { type: 'string' },
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
