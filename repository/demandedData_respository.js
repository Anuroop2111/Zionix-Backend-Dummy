const { Op } = require('sequelize');

const DemandedData = require('../models/demandedDataModel');


const saveData = async (data) => {
    try{
        const newData = new DemandedData(data);
        const saved = await newData.save();
        console.log("Demanded data created : ",saved);
    } catch(error){
        console.error('Error creating record:', error);
    }
};

const findData = async (fileId) => {
    try{
        const data = await DemandedData.aggregate([
            {
                $match: {
                    file_id: fileId,
                },
            },
            {
                $sort: {
                    upload_date: -1,
                },
            },
            {
                $group: {
                    _id: {
                        file_id: '$file_id',
                        index: '$index',
                    },
                    file_id: { $first: '$file_id' },
                    index: { $first: '$index' },
                    demanded_mpn: { $first: '$demanded_mpn' },
                    demanded_quantity: { $first: '$demanded_quantity' },
                    demanded_specs: { $first: '$demanded_specs' },
                    demanded_brand: { $first: '$demanded_brand' },
                    upload_date: { $first: '$upload_date' },
                },
            },
            {
                $project: {
                    _id: 0,
                    file_id: 1,
                    index: 1,
                    demanded_mpn: 1,
                    demanded_quantity: 1,
                    demanded_specs: 1,
                    demanded_brand: 1,
                    upload_date: 1,
                },
            },
            {
                $sort: {
                    index: 1, // Sorting in ascending order of index
                },
            }
        ]);

        // console.log("Fetched Data = ",data);
        return data;

    } catch(error){
        console.error('Error getting records:', error);
    }
};

module.exports = {
    saveData,
    findData,
};



