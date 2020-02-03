const mongoose = require('mongoose');
const Joigoose = require('joigoose')(mongoose);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Boom = require('@hapi/boom');

const { UserInput } = require('../validators/user');

// Convert the previously defined validator in a Mongoose Schema
const userSchema = new mongoose.Schema(Joigoose.convert(UserInput), { strict: false });

// EXTRA PROPERTIES
userSchema.remove(['password'])
userSchema.add({
    password: {
        type: String,
        trim: true,
        minlength: 6,
        validate(value){
            if (value.toLowerCase().includes('password') ||
                value.toLowerCase().includes('123456')) {
                    throw Boom.badRequest('Please, think of a more secure password');
                }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});
userSchema.set('timestamps', true)

// METHODS
// Never show the user's password or tokens
userSchema.methods.toJSON = function () {
    const user = this

    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens

    return userObject
};

userSchema.methods.generateAuthToken = async function () {
    const user = this

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '12h' })

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
};

// STATICS
userSchema.statics.findByCredentials = async function (username, password) {
    const User = this;
    const user = await User.findOne({ username });
    if (!user) throw Boom.unauthorized('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw Boom.unauthorized('Invalid credentials')

    return user;
}

// MIDDLEWARE
// Hash any newly created password before we store it in our database
userSchema.pre('save', async function (next) {
    const user = this

    // Avoid duplicated usernames
    if (user.isNew) {
        const previousUser = await User.findOne({ username: user.username })
        if (previousUser) throw Boom.badRequest('Name unavailable')
    }

    // Hash any new password
    if (user.isModified('password')) user.password = await bcrypt.hash(user.password, 8)

    next()
})

const User = mongoose.model('User', userSchema);
module.exports = User;