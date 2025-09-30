const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Interview = require('../src/models/interview.model');
const Student = require('../src/models/student.model');
const Client = require('../src/models/client.model');

let interviewId, studentId, clientId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const student = await Student.create({ name:'Test', email:'i@test.com', phone:'9876543212' });
  studentId = student._id;
  const client = await Client.create({ name:'Client 1' });
  clientId = client._id;
});

afterAll(async () => await mongoose.connection.close());

describe('Interview Module', () => {
  it('should create interview', async () => {
    const res = await request(app).post('/api/interviews').send({ student: studentId, client: clientId, date: new Date() }).expect(201);
    interviewId = res.body.data._id;
  });

  it('should get interview', async () => await request(app).get(`/api/interviews/${interviewId}`).expect(200));
  it('should soft delete interview', async () => await request(app).delete(`/api/interviews/${interviewId}/soft`).expect(200));
  it('should restore interview', async () => await request(app).patch(`/api/interviews/${interviewId}/restore`).expect(200));
  it('should hard delete interview', async () => await request(app).delete(`/api/interviews/${interviewId}/hard`).expect(200));
});
