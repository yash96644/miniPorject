const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/myapp')


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    age: Number,
    username: String,
    });

module.exports = mongoose.model('User', userSchema);

