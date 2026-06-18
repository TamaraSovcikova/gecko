const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gecko API',
      version: '1.0.0',
      description:
        'REST API for the Gecko personal finance app. All endpoints under /api/v1/* require a Firebase ID token in the Authorization header except where noted.',
      contact: { name: 'Tamara Sovcikova' },
    },
    servers: [
      { url: '/api/v1', description: 'Current server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Firebase ID Token',
        },
      },
      schemas: {
        Expense: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            category: { type: 'string', example: 'Food' },
            amount: { type: 'number', example: 12.5 },
            date: { type: 'string', format: 'date', example: '2026-06-01' },
            note: { type: 'string' },
            month: { type: 'integer' },
            year: { type: 'integer' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

module.exports = swaggerJsdoc(options);
