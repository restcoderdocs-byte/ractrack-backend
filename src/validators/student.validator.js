// src/validators/student.validator.js
const { Joi, celebrate, Segments } = require('celebrate');

exports.createStudentValidator = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.empty': 'Phone is required',
      'string.pattern.base': 'Phone must be a valid 10-digit number',
    }),
    address: Joi.string().allow('', null),
    enquiries: Joi.array().items(Joi.string().hex().length(24)),
    interviews: Joi.array().items(Joi.string().hex().length(24)),
  }),
});
