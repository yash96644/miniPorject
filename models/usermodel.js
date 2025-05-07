const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/myapp')

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    username: String,
    age: Number,
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  });
module.exports = mongoose.model('User', userSchema);

