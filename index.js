'use strict'
const { start } = require('./server');

start()
    .then(() => {})
    .catch(error => {
        console.log('Something went wrong');
        console.log(error);
    })