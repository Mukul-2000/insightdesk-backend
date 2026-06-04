import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../index.js'; // Imports the explicit app configuration instance

describe('InsightDesk Core Endpoint Suites', () => {
    
    // 1. Test standard base framework health check endpoint
    test('GET /health should return 200 with an operational status message', async () => {
        const response = await request(app).get('/health');
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            status: 'ok',
            message: 'InsightDesk Core is fully operational'
        });
    });

    // 2. Test Joi input protection boundaries against bad payloads
    test('POST /api/v1/tickets/create should fail validation if description parameter is missing', async () => {
        const malformedPayload = {
            title: "System server failure",
            customerEmail: "developer@test.com"
            // Missing explicit required description
        };

        const response = await request(app)
            .post('/api/v1/tickets/create')
            .send(malformedPayload);

        expect(response.statusCode).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.message).toContain('Validation Failed');
    });
});