const mongoose = require("mongoose");
const {Schema} = mongoose;

const demandedDataSchema = new Schema ({
    file_id: {
        type : String,
        required: true,
    },

    index: {
        type: Number,
        required: true,
    },

    demanded_mpn: {
        type: String,
        required: true,
    },

    demanded_quantity: {
        type: String,
        required: true,
    },

    demanded_specs: {
        type: String,
        required: true,
    },

    demanded_brand: {
        type: String,
        required: true,
    },

    upload_date: {
        type: Date,
        default: Date.now,
    },
});

const DemandedData = mongoose.model('DemandedData', demandedDataSchema);

module.exports = DemandedData;