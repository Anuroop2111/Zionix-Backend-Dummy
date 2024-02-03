const mongoose = require("mongoose");
const {Schema} = mongoose;

const resultDataSchema = new Schema ({
    file_id: {
        type : String,
        required: true,
    },

    index: {
        type: Number,
        required: true,
    },

    data_id : {
        type: Number,
        required: true,

    },

    icon : {
        type: Boolean,
        required: true
    },
    
    recommended_MPN : {
        type: String,
        required: true,
    },
    
    distributer : {
        type: String,
        required: true,
    },
    
    brand : {
        type: String,
        required: true,
    },
    
    description : {
        type: String,
        required: true,
    },
    
    quantity : {
        type: Number,
        required: true,
    },
    
    unit_price: {
        type: String,
        required: true,
    },
    
    total_price: {
        type: String,
        required: true,
    },

    availability: {
        type : String,
        required: true,
    },

    upload_date: {
        type: Date,
        default: Date.now,
    },

});
const ResultData = mongoose.model('ResultData', resultDataSchema);

module.exports = ResultData;