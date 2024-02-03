const axios = require("axios");
const config = require('../config/config');
const {v4:uuidv4} = require('uuid');

// Extract digits from a string after the last hyphen(-). eg, 4545jgh-fg-10-455; -> output = 455
const extractQuantity = (key) =>{
    const match = key.match(/-(\d+)$/);

    if (match) {
        // Extract the matched digits and convert them to an integer
        const digits = parseInt(match[1], 10);
        return digits;
    }
}

// Get conversion rate. For example USD to INR = 83.06 . Here, from - "USD", to - "INR"
const getConversion = async(from,to) =>{
    try{
        const access_key = config.fixerConversionKEY;
        const response = await axios.get(`http://data.fixer.io/api/latest?access_key=${access_key}`);
        const rate = response.data.rates[to]/response.data.rates[from];
        return rate
        
    } catch(error){
        console.log("Error in conversion : ",error);
    }
}

// Function to sort the data according to the price
const sortData = (data,quantity) => {
    // console.log("Data received for sorting:", data);
    // console.log("*****************")

   
    if (quantity===0){  // Not used. Redundant
        // console.log("Printing all Data");
        return data;

    } else{
        const sortedAllData = data.sort((a,b) =>{
            const getPrice = (item) =>{
                // console.log("Item : ",item);
                // console.log("item.Price[0] : ",item.Price[0]);
                const price = parseFloat(item.Price[0].Price);
                    return isNaN(price) ? Number.POSITIVE_INFINITY : price;
            };

            const priceA = getPrice(a);
            const priceB = getPrice(b);

            if (isNaN(priceA) && isNaN(priceB)){
                return 0; // Both are "NaN", keep the order unchanged

            } else if (isNaN(priceA)){
                return 1; // "NaN" comes after numeric values

            } else if(isNaN(priceB)){
                return -1; // "NaN" comes after numeric values

            } else{
                return priceA - priceB;
            }
        });

        // console.log("sortedAllData = ",sortedAllData);
        // return sortedAllData;

        // Return only the best element (the first element after sorting)
        // return sortedAllData.length > 0 ? [sortedAllData[0]] : [];
        // console.log("Called sortData = ",sortedAllData[0])
        // console.log("All sortedData = ",sortedAllData);
        return sortedAllData;
        // return sortedAllData[0]; // Only sending the lowest Price
    }
};

const manufactureSortData = (priceSortedData,manufacturerVal) => {
    const manufacturerSortedData = priceSortedData.sort((a,b) => {
        const aMatch = manufacturerVal.some(manufacturer => matchString(manufacturer, a.Manufacturer));
        const bMatch = manufacturerVal.some(manufacturer => matchString(manufacturer, b.Manufacturer));

        if (aMatch && bMatch){
            return 0; // Maintains original order if both a,b matches
        } else if (aMatch){
            return -1; // Prioritise a
        } else if (bMatch){
            return 1; // prioritise b
        } else {
            return 0; // Maintains original order if both a,b doesn't match
        }
    });

    return manufacturerSortedData;
}

const generateId = () =>{
    const uuid = uuidv4().replace(/-/g, '');
    const randomString = uuid.substring(0, 8); // Length of id is set to be 8

    return randomString;
}

const createResultObj = (mpn, distributer, avail, descr, priceVal, manufacturer) =>{
    // console.log("Availability inside createResultObj : ",avail);
    const resultObject = {
        Distributer: distributer,
        Availability: `${avail} In Stocks`,
        Description: descr,
        Manufacturer: manufacturer,
        Price: priceVal,
        MPN: mpn,
    };

    return resultObject;
}

const createResObj = (index,partNumberVal,distributer,avail,descr,manufacturer,priceVal,currency,quantityVal) =>{
    const resultObject = [{
        index: index,
        partNum: partNumberVal,
        data: {
            Distributer: distributer,
            Availability: avail,
            Description: descr,
            Manufacturer: manufacturer,
            Price: priceVal,
            MPN: "Not Found"
        },
        currency: currency,
        quantity: quantityVal,
}];

    return resultObject;
}

const matchString = (partNum,mpn) => {

    // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    // console.log("partNum = ", partNum, " (length: ", partNum.length, ")");
    // console.log("mpn = ", mpn, " (length: ", mpn.length, ")");

    // Remove trailing and leading zeros
    const trimmedPartNum = partNum.trim();

    // Part Number is received from the BOM
    const regex = new RegExp(trimmedPartNum, 'i');

    if (mpn === undefined) {
        return false;
    }

    const ans = regex.test(mpn)
    // console.log("Ans = ",ans);
    // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    // mpn is received from the API
    return ans;
};

const extractMpn = (inputStr)=>{
    const index = inputStr.indexOf("-@-");
    let mpn = "";
    let manufacturer = "";


    if (index!==-1){
        mpn = inputStr.substring(0,index);
        manufacturer = inputStr.substring(index+3);
    }

    return {    mpn: mpn,
                manufacturer: manufacturer
            };
};

const processSKU = (sku) => {
    if (sku.endsWith('RL')) {
        // Remove 'RL' from the end of the SKU
        return sku.slice(0, -2);
    } else {
        // SKU does not end with 'RL', return the original SKU
        return sku;
    }
}

module.exports = {
    extractQuantity,
    getConversion,
    sortData,
    generateId,
    createResultObj,
    createResObj,
    matchString,
    manufactureSortData,
    extractMpn,
    processSKU,
}