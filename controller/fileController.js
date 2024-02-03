const express = require('express');
const router = express.Router();

const multer = require('multer');
const exceljs = require('exceljs');
const papaparse = require('papaparse');
const xlsx = require('xlsx');

// const fs = require('fs');
// const csv = require('@fast-csv/parse');

const fileService = require('../service/fileService');

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.post('/processFile', upload.single('file'), async (req,res) =>{
    // console.log("File recieved : ",req.file)
    // console.log("Req = ",req);
    // const cookieValue = req.cookies['exeb2b-cookie'];
    // console.log("Cookie value in backend = ",cookieValue);

    const uploadedFile = req.file;
    console.log("Reached here for file upload : ",uploadedFile);

    const fileName = uploadedFile.originalname;
    const fileExtension = uploadedFile.originalname.split('.').pop().toLowerCase();

    let response;
    
    if (fileExtension === "xlsx"){
        response = await processXLSX(uploadedFile.buffer);
        console.log("Response = ",response);

    } else if (fileExtension === "csv"){
        const csvData = uploadedFile.buffer.toString('utf8');
        console.log("Raw data = ",csvData);
        const parsedData = papaparse.parse(csvData, { header: false, delimiter: ",", newline: '\r\n',});

        console.log("parsedData = ",parsedData);
        console.log("CSV Data = ",parsedData.data);
        const filteredData = parsedData.data.filter(row => row.length > 1 || row[0]!=="");
        console.log("Filtered data = ",filteredData);
        
        const l = filteredData[0].length;
        const rowData = [];

        for (let i = 0; i < filteredData.length; i++){
            const index = i+1;
            const data = filteredData[i];
            rowData.push({index : index, data : data});
        }

        // const data = parsedData.data.split(':');

        // rowData.push({index: rowNumber,
        //     data: data});

        // const l = rowData[0].data.length;

        // console.log("Final row Data = ",rowData);
    
        const responseObj = {
            rowLen: l,
            rowData: rowData // Array of objects
        };
    
        // console.log("response obj = ", responseObj);
        const savedFileId = await fileService.saveFile(responseObj, req, res, fileName);
        console.log("Saved FIle = ",savedFileId);
        res.send(savedFileId);
        return savedFileId;

    } else if (fileExtension === "xls"){
        const xlsData = uploadedFile.buffer;
        const workbook = xlsx.read(xlsData, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet, {header : 1, raw: true, defval:""});
        console.log("Raw Data = ",rawData);

        // const filteredData = rawData.filter(row => row.length > 0);
        const cleanedData = rawData.filter(row => row.some(cell => {
            if (typeof cell === 'string') {
                return cell.trim() !== '';
            } else {
                return cell !== undefined && cell !== null;
            }
        }));

        // console.log("Excel Data = ",rawData);
        console.log("Cleaned Data = ",cleanedData)
        // console.log("length of row 1 = ",rawData[0].length);
        // console.log("length of row 2 = ",rawData[1].length);
        console.log("length of cleaned row 1 = ",cleanedData[0].length);
        console.log("length of cleaned row 2 = ",cleanedData[1].length);

        const l = cleanedData[0].length;
        const rowData = [];

        for (let i = 0; i < cleanedData.length; i++){
            const index = i+1;
            const data = cleanedData[i];
            rowData.push({index : index, data : data});
        }

        const responseObj = {
            rowLen: l,
            rowData: rowData // Array of objects
        };

        const savedFileId = await fileService.saveFile(responseObj, req, res, fileName);
        console.log("Saved FIle = ",savedFileId);
        res.send(savedFileId);
        return savedFileId;
    }

    const responseData = await fileService.processFile(response, req, res, fileName);
    // console.log("Response = ",responseData);

    res.send(responseData);
});

const processXLSX = async (file) => {
    const workbook = new exceljs.Workbook();
    // // console.log("Workbook taken : ",workbook);

    return (await workbook.xlsx.load(file));
};

router.post('/checkQuantity', async (req,res) => {
    // console.log("Quantity data received = ",req);
    // console.log("Quantity data received = ",req.body);
    const responseObj = fileService.processQuantity(req.body);

    if (responseObj.length===0){
        res.send({flag: true, indexIssue: responseObj});
    } else {
        res.send({flag: false, indexIssue: responseObj});
    }

});

// router.post('/saveFile', async)
router.post('/getFile', async (req,res) => {

    try {
        const responseFile = await fileService.getFile(req);
        console.log("Response file : ",responseFile);
        res.send(responseFile);

    } catch (e){
        console.log("Error getting File : ",e);
    }

});

router.post("/getPastFiles", async (req,res) => {
    // console.log("req = ",req.body);
    const responseObj = await fileService.getPastFiles(req,res);
    res.send(responseObj);
})

module.exports = router;