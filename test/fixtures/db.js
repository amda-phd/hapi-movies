const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const Movie = require('../../models/movie');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    username: 'elizabethbennet',
    password: 'georgeWickham',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
};

const movieOneId = new mongoose.Types.ObjectId();
const movieOne = {
    _id: movieOneId,
    title: 'Alien, The Eitghth Passenger',
    plot: 'A fake distress signal is investigated. In space. Where no one can hear you scream.',
    genre: 'Terror',
    creator: userOneId
};

const movieTwoId = new mongoose.Types.ObjectId();
const movieTwo = {
    _id: movieTwoId,
    title: 'Booksmart',
    plot: 'High school is over. Being a girl is still weird. And being bright doesnt mean being smart.',
    genre: 'Comedia',
    creator: userOneId
};

const movieThreeId = new mongoose.Types.ObjectId();
const movieThree = {
    _id: movieThreeId,
    title: 'Star Wars, Episode V: The Empire Strikes Back',
    plot: 'A suitable master is found for the bright kid. An old fiend commits a betrayal. And a distant friend becomes a lover.A suitable master is found for the bright kid. An old fiend commits a betrayal. And a distant friend becomes a lover.',
    genre: 'Acción',
    creator: userOneId
};

const setUpDatabase =  async () => {
    await User.deleteMany();
    await new User(userOne).save();

    await Movie.deleteMany();
    await new Movie(movieOne).save();
    await new Movie(movieTwo).save();
    await new Movie(movieThree).save();
};

module.exports = {
    User,
    userOne, userOneId,
    Movie,
    movieOne, movieOneId,
    movieTwo, movieTwoId,
    movieThree, movieThreeId,
    setUpDatabase
}