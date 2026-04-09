const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns application health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });
});
