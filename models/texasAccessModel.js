const mongoose = require("mongoose");
const {Schema} = mongoose;

const texasAccessSchema = new Schema ({
    id: {
        type: Number,
        required: true,
        default: 1
    },

    token_value: {
        type: String,
        required: true,
    },

    issued_time: {
        type: Number,
        required: true,
    },

    expiry_time: {
        type: Number,
        required: true,
    }
});

const TexasAccess = mongoose.model('TexasAccess', texasAccessSchema);

module.exports = TexasAccess;

