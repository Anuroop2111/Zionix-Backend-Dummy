const ResultData = require("../models/resultDataModel");

const findData = async (fileId, index, dataId) => {
    try {
        const data = await ResultData.findOne(
            {   
                file_id : fileId,
                index : index,
                data_id : dataId,
            },
        )
        .sort({ upload_date: -1 })
        .exec();
        
        return data;

    } catch (error){
        console.log("Error in getting data from data_value repository : ",error);
    }

};

const createData = async (data) => {
    try{
        const newData = new ResultData(data);
        const newRecord = await newData.save();
        // console.log("Record created = ",newRecord);
    } catch (error){
        console.log("Error creating record = ",error);
    }
};

// Currently in sequelise schema -> chaneg it to mongodb schema

// const updateData = async (fileId, index, dataId, newData) => {
//     try {
//         const [rowsUpdated, [updatedRecord]] = await ResultData.update(
//             newData, 
//             {
//                 where: {
//                     file_id: fileId,
//                     index: index,
//                     data_id: dataId
//                 },
//                 // returning: true, // Return the updated record
//             }
//         );

//         if (rowsUpdated > 0) {
//             console.log("Record updated:", updatedRecord);
//         } else {
//             console.log("Record not found for update");
//         }
//     } catch (error) {
//         console.log("Error updating record:", error);
//     }
// };

module.exports = {
    findData,
    createData,
    // updateData,
}