const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);

const MovieInput = Joi.object({
    title: Joi
        .string()
        .optional()
        .description('This field will be mandatory in order to create a new entry'),
    plot: Joi
        .string()
        .optional()
        .description('What was the film about?'),
    genre: Joi
        .string()
        .valid('Terror', 'Drama', 'Comedia', 'Acción', 'Desconocido')
        .optional()
        .description('If you dont know the genre, "Desconocido" will be set as default')
})
.required()
.label('Movie')
.description('This is what you need to define a movie in our database');

const MovieIdInput = Joi
    .objectId()
    .required()
    .label('movieId')
    .description('A 24 character length string that represents the MongoDB ObjectId for a movie in our database')

const MovieQuery = Joi.object({
    name: Joi
        .string()
        .optional()
        .description('This string must be contained in the title'),
    letter: Joi
        .string()
        .max(1)
        .min(1)
        .optional()
        .description('The first letter of the titles that will be returned'),
    genre: Joi
        .string()
        .optional()
        .description('Will select movies belonging only to this genre. You can add more than one genre, separate the words by a comma'),
    limit: Joi
        .number()
        .min(1)
        .optional()
        .description('The amount of entries that you want to see. Make it larger than zero'),
    skip: Joi
        .number()
        .min(1)
        .optional()
        .description('The number of entries that you want to skip from the global list. Make it larger than zero')
})
.optional()
.label('movieQuery')
.description('The fields that we can use to filter our queries to the Movies database')

module.exports = { MovieInput, MovieIdInput, MovieQuery };