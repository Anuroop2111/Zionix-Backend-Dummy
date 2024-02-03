const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
  
    file_id: {
        type: String,
        required: true,
    },

    file_name: {
        type: String,
        required: true,
    },

    file_data: {
        type: Object,
        required: true,
    },

    upload_date: {
        type: Date,
        default: Date.now,
    },
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
