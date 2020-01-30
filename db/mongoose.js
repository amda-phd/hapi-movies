const mongoose = require('mongoose');
const url = `${process.env.MONGODB_URL}/${process.env.MONGODB_NAME}`;

mongoose.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false // To avoid warnings when using findAndUpdate due to deprecation
});