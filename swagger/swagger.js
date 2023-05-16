const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger 문서 정의
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Relay FairyTale',
            description:
                '릴레이 동화 서비스를 위한 Node.js환경 Swagger-jsdoc 방식 HTTP API 클라이언트 UI',
            version: '1.0.0',
        },
    },
    apis: ['./routes/*.js'], // API endpoint
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerUi, swaggerSpec };
