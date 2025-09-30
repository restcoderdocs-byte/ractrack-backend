// src/validators/enquiry.validator.js
const { Joi, celebrate, Segments } = require('celebrate');

exports.createEnquiryValidator = celebrate({
  [Segments.BODY]: Joi.object({
    student: Joi.string().hex().length(24).required().messages({
      'string.empty': 'Student ID is required',
      'string.hex': 'Student ID must be a valid ObjectId',
    }),
    course: Joi.string().hex().length(24).required().messages({
      'string.empty': 'Course ID is required',
      'string.hex': 'Course ID must be a valid ObjectId',
    }),
    status: Joi.string().valid('pending', 'follow-up', 'converted').default('pending'),
    notes: Joi.string().max(500).allow('', null),
  }),
});
