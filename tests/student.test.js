// tests/student.test.js
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Student = require('../src/models/student.model');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Student API', () => {
  let studentId;

  it('should create a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ name: 'Test User', email: 'test@example.com', phone: '9876543210' })
      .expect(201);

    studentId = res.body.data._id;
    expect(res.body.data.name).toBe('Test User');
  });

  it('should get student by id', async () => {
    const res = await request(app).get(`/api/students/${studentId}`).expect(200);
    expect(res.body.data._id).toBe(studentId);
  });

  it('should soft delete student', async () => {
    const res = await request(app).delete(`/api/students/${studentId}/soft`).expect(200);
    expect(res.body.message).toBe('Student soft-deleted');
  });

  it('should restore student', async () => {
    const res = await request(app).patch(`/api/students/${studentId}/restore`).expect(200);
    expect(res.body.message).toBe('Student restored');
  });

  it('should hard delete student', async () => {
    await request(app).delete(`/api/students/${studentId}/hard`).expect(200);
    const deleted = await Student.findById(studentId);
    expect(deleted).toBeNull();
  });
});
