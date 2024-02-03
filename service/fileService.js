const exceljs = require('exceljs');
const fileRepository = require("../repository/file_repository");
const apiUtil = require("../util/apiUtil");

const processFile = async (workbook, req, res, fileName)=>{
    // console.log("Workbook = ",workbook);
    workSheet = workbook.worksheets[0];

    let rowData = []

    // Iterating over each row
    workSheet.eachRow((row,rowNumber) => {
        const data = [];

        console.log("Row = ",row);
        console.log("Row Values = ",row.values);

        for (const item of row.values.slice(1) ){
            // If a data is in the form of formula object
            if (typeof item === 'object'){
                data.push(item.result);
            } else {
                data.push(item);
            }
        }

        rowData.push({index: rowNumber,
            data: data});
        
    });
    console.log("Row Data = ",rowData[0].data);


    l = rowData[0].data.length;

    console.log("Final row Data = ",rowData);

    responseObj = {
        rowLen: l,
        rowData: rowData // Array of objects
    };

    // console.log("response obj = ", responseObj);
    const savedFileId = await saveFile(responseObj, req, res, fileName);
    console.log("Saved FIle = ",savedFileId);

    // return responseObj;

    return savedFileId;
};

const processQuantity = (data) =>{
    const rowData = data.rowData;
    const QuantityIndex = data.QuantityIndex;
    const header = data.header;

    let indexFixer = 0;

    if (header === "Yes"){
        indexFixer = 1;
    }

    const indexArr = [];

    for (let i = 0; i< rowData.length; i++){
        if (indexFixer === 1 && i===0){
            continue;
        }

        const index = rowData[i].index;
        const rowVal = rowData[i].data;
        // console.log(rowVal);

        if (parseInt(rowVal[QuantityIndex-1])===0 || isNaN(parseInt(rowVal[QuantityIndex-1]))){
            indexArr.push(index);
        }
    }

    // console.log("index Arr = ",indexArr);
    return indexArr;
};

const getFile = async (req) => {
    // const fileId = data.fileId;
    // const userId = data.userId;
    const cookieValue = req.cookies['exeb2b-cookie'];
    const value = JSON.parse(cookieValue);
    const fileId = value.fileId;
    const userId = value.userId;

    console.log("fileId : ",fileId);
    console.log("userId : ",userId);

    try {
        const file = await fileRepository.findByUserIdAndFileId(userId, fileId);
        return file;
    } catch(e){
        console.log("Error in file Service finding file : ",e);
    }
};

const saveFile = async (data, req, res, fileName) => {
    console.log("Data received for saving : ",data);
    // const userId = apiUtil.generateId();
    const cookieValue = req.cookies['exeb2b-cookie'];
    const parsedCookie = JSON.parse(cookieValue);
    const userId = parsedCookie.userId;
    const fileId = apiUtil.generateId();
    // const fileName = fileName;
    const fileData = data;

    parsedCookie.fileId = fileId;
    res.cookie('exeb2b-cookie', JSON.stringify(parsedCookie));
    // const userId = data.userId;
    // const fileId = data.fileId;
    // const fileName = data.fileName;
    // const fileData = data.fileData;

    await fileRepository.saveFile(userId, fileId, fileName, fileData);
    console.log("File Saved Successfully");
    return fileId;
}

const getPastFiles = async (req,res) => {
    const userId = req.body.userId;

    try{
        const files = await fileRepository.findByUserId(userId);
        console.log("Past files = ",files);

        const responseArr = [];

        for (const item of files) {
            const fileName = item.file_name;
            const fileId = item.file_id;

            responseArr.push({fileName : fileName, fileId : fileId});
        }

        return responseArr;

    } catch(e){
        console.log("Error in fetching files = ",e);
        return [];
    }
};

module.exports = {
    processFile,
    processQuantity,
    getFile,
    saveFile,
    getPastFiles,
}