const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);

const UserInput = Joi.object({
    name: Joi
        .string()
        .min(3).max(30)
        .required(),
    password: Joi
        .string()
        .required()                 
})
.required()
.label('User')
.description('Fields required in order to generate a new user and/or login an existing one');

module.exports = UserInput;