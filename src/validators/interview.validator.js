// src/validators/interview.validator.js
const { Joi, celebrate, Segments } = require('celebrate');

exports.createInterviewValidator = celebrate({
  [Segments.BODY]: Joi.object({
    student: Joi.string().hex().length(24).required(),
    client: Joi.string().hex().length(24).required(),
    date: Joi.date().required().messages({
      'date.base': 'Date must be valid',
      'any.required': 'Date is required',
    }),
    status: Joi.string().valid('scheduled', 'attended', 'missed', 'selected', 'rejected').default('scheduled'),
    notes: Joi.string().max(500).allow('', null),
  }),
});
