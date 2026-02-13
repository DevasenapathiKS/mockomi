import swaggerJSDoc, { type Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mockomi API',
      version: '1.0.0',
      description: 'Interview Conditioning Platform API',
    },
    servers: [{ url: 'http://localhost:8000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['src/api/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);

