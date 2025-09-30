// tests/enquiry.test.js
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');

describe('Enquiry API', () => {
  beforeAll(async () => {
    // connect to test DB
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create enquiry', async () => {
    const res = await request(app).post('/api/enquiries').send({
      student: new mongoose.Types.ObjectId(),
      course: new mongoose.Types.ObjectId(),
      status: 'pending',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
  });
});
