const Joi = require('@hapi/joi');

const UserInput = Joi.object({
    username: Joi
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

const UserPatch = Joi.object({
    oldPassword: Joi
        .string()
        .required(),
    newPassword: Joi
        .string()
        .required()
})
.required()
.label('newPassword')
.description('To change your password you need to provide the previous one, even if you are logged in');


module.exports = { UserInput, UserPatch };