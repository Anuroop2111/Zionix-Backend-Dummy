const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');

const userDetailsSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
  
    email: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    salt: {
        type: String, // Store the salt as a string
        required: true,
    }
});

const User = mongoose.model('User', userDetailsSchema);

module.exports = User;
