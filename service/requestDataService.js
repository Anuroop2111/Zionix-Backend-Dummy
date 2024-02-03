const demandedData_repo = require("../repository/demandedData_respository");

const storeData = async (req) =>{
    const data = req.body;
    const parsedCookie = JSON.parse(req.cookies['exeb2b-cookie']);
    const fileId = parsedCookie.fileId;
    console.log("Going to store fileId = ",fileId);

    const rowData = data.rowData;
    const header = data.header;
    const QuantityIndex = data.QuantityIndex;
    const PartNumIndex = data.PartNumIndex;
    const ManufacturerIndex = data.ManufacturerIndex;
    const DescriptionIndex = data.DescriptionIndex;

    // console.log("QuantityIndex = ",QuantityIndex);
    // console.log("PartNumIndex = ",PartNumIndex);
    // console.log("ManufacturerIndex = ",ManufacturerIndex)
    // console.log("DescriptionIndex = ",DescriptionIndex);

    let indexFixer = 0;

    if (header === "Yes"){
        indexFixer = 1;
    }

    const indexArr = [];

    for(let i = indexFixer; i<rowData.length; i++){
        // console.log("RowDatas = ",rowData[i])

        const saveObj = {
            file_id : fileId,
            index: rowData[i].index-indexFixer, // 
            demanded_mpn: rowData[i].data[PartNumIndex-1],
            demanded_quantity: rowData[i].data[QuantityIndex-1],
            demanded_specs: (DescriptionIndex ? (rowData[i].data[DescriptionIndex-1]===null ? "-" : rowData[i].data[DescriptionIndex-1]) : "-"),
            demanded_brand: (ManufacturerIndex ? (rowData[i].data[ManufacturerIndex-1]=== null ? "-" : rowData[i].data[ManufacturerIndex-1] ) : "-") ,  
        };

        indexArr.push(rowData[i].index-indexFixer);

        try {
            await demandedData_repo.saveData(saveObj);
        } catch (error){
            console.log("Error saving data");
        }
    }

    return indexArr;

    // Check the header

    // Check the Quantity, PartNumber

    // Check if Manufacturer and Description values are given
};

const getData = async (req) => {
    // console.log("index arr = ",indexArr);
    const parsedCookie = JSON.parse(req.cookies['exeb2b-cookie']);
    const fileId = parsedCookie.fileId;
    // const userId = parsedCookie.userId;

    try{
        const dataVal = await demandedData_repo.findData(fileId);
        // console.log("Data Val = ",dataVal);

        return dataVal;

    } catch(error){
        console.log("Error in getting data = ",dataVal);
    }
}

module.exports = {
    storeData,
    getData
}