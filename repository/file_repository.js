const File = require('../models/fileDataModel');

const findByUserIdAndFileId = async (userId, fileId) => {
    try{
        const file = await File.findOne({
            user_id : userId,
            file_id : fileId
        });
        return file;

    } catch(error){
        console.log("Error in fetching File Data : ",error);
    }
};

const findByUserId = async (userId) => {
    try {
        const files = await File.find({
            user_id : userId,
        })
        .sort({ upload_date: -1 });
        
        return files;
    } catch(e){
        console.log("Error fetching past files = ",e);
    }
};

const saveFile = async (userId, fileId, fileName, fileData) => {
    try{
        const newFile = new File({
            user_id : userId,
            file_id : fileId,
            file_name : fileName,
            file_data : fileData
        });
        
        const savedFile = await newFile.save();
        console.log("Saved file : ",savedFile);
    }  catch (error){
        console.log("Error saving file : ",error);
    }
};

const updateByUserIdAndFileId = async (fileId, userId, newFile) => {
    try {
        const updatedFile = await File.findOneAndUpdate(
            {file_id : fileId},
            {user_id : userId},
            {$set : newFile},
            {new : true}
        );
        console.log("Updated file : ",updatedFile);

    } catch(error) {
        console.log("Error updating file : ",error);
    }
};

module.exports = {
    findByUserIdAndFileId,
    findByUserId,
    saveFile,
    updateByUserIdAndFileId,
};