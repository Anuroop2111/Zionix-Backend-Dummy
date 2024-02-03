const mongoose = require("mongoose");
const {Schema} = mongoose;

const digikeyAccessSchema = new Schema ({
    d_id: {
        type: Number,
        required: true,
      },

      access_token: {
        type: String,
        required: true,
      },

      access_token_issued: {
        type: Number,
        required: true,
      },

      access_token_expiry: {
        type: Number,
        required: true,
      },

      refresh_token: {
        type: String,
        required: true,
      },
      
      refresh_token_issued: {
        type: Number,
        required: true,
      },

      refresh_token_expiry: {
        type: Number,
        required: true,
      }
});

const DigikeyAccess = mongoose.model('DigikeyAccess', digikeyAccessSchema);

module.exports = DigikeyAccess;