const axios = require("axios");
const apiUtil = require('../util/apiUtil');
const config = require('../config/config');
const texasRepo = require('../repository/texas_repository');
const componets = require('../repository/components_repository');
const querystring = require('node:querystring');
const tme = require('./tmeRequestService');
const digi_access = require("../repository/digikey_access_repository");



// Getting the Data from Company APIs
// ***********************************************************
const getMouserData = async (data) =>{
    // console.log("Receieved Data inside Mouser = ",data);
        try{
            const mouserApiKey = config.mouserAPI;
            const mouserVersion = config.mouserVersion;
            const mouserUrl = `https://api.mouser.com/api/v${mouserVersion}/search/partnumber?apiKey=${mouserApiKey}`;

            const promises = [];

            for (const item of data){
                // console.log("Inside mouser")
                const partNumber = item.partNumber;
                const quantity = item.quantity;
                // console.log("PartNumebr = ",partNumber);
                // console.log("Quantity = ",quantity);
                
                const mouserPromise = axios.post(mouserUrl,{
                    "SearchByPartRequest": {
                    "mouserPartNumber": partNumber,
                    "partSearchOptions": "string"
                    }
                });

                promises.push(mouserPromise);
            }

            const response = await axios.all(promises);
            // console.log("Response insode mouser = ",response)

            const responseMap = new Map();

            for (let i = 0; i < response.length; i++) {
                if (response[i].status === 200){
                    const obj = {
                        data: response[i].data,
                        distributer: "Mouser"
                    }

                    const partNumber = data[i].partNumber;
                    const quantity = data[i].quantity;
    
                    const key = `${partNumber}-${quantity}`;
                    responseMap.set(key, obj);
                }

            }
            // console.log("Mouser responseMap = ",responseMap);
            return responseMap;

        } catch(error){
            console.log("Error : ",error)
        }

};

const getElementData = async (data) => {
    try{
        const elementApiKey = config.elementAPI;
        const promises = [];

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;

            const elementsUrl = `http://api.element14.com//catalog/products?term=manuPartNum:${partNumber}&storeInfo.id=in.element14.com&resultsSettings.offset=0&resultsSettings.numberOfResults=1&resultsSettings.refinements.filters=inStock&resultsSettings.responseGroup=medium&callInfo.omitXmlSchema=false&callInfo.callback=&callInfo.responseDataFormat=json&callinfo.apiKey=${elementApiKey}`;
            const elementsPromise = axios.get(elementsUrl);

            promises.push(elementsPromise);
        }

        const response = await axios.all(promises);

        const responseMap = new Map();

        for (let i = 0; i < response.length; i++) {
            if (response[i].status === 200){

                try{
                    const obj = {
                        data: response[i].data,
                        distributer: "Element14"
                    }
    
                    const partNumber = data[i].partNumber;
                    const quantity = data[i].quantity;
        
                    const key = `${partNumber}-${quantity}`;
                    responseMap.set(key, obj);
                } catch(error){
                    console.log("Error in Element14 : ",error);
                }

            }

        }
        return responseMap;

    } catch(error){
        console.log("Error : ",error)
    }
};

const getTexasData = async (data) =>{
    try{
        // Find if Access token is valid or not
        const token = await texasRepo.findToken();
        let accessKey;

        if (token.length===0){

            // console.log("Access Key not found");
            // Get a new Access Token and set it in the database
            const url = "https://transact.ti.com/v1/oauth/accesstoken";

            const clientCredentials = {
                grant_type: 'client_credentials',
                client_id: 'TGz6V5i4INHcJg4w8iDa06Y8EJqTiM3Z',
                client_secret: '3oOit3NGRHkG7wjv'
              };

            const requestBody = querystring.stringify(clientCredentials);

            // console.log("request Body : ",requestBody);

            const response = await axios.post(url,requestBody,{
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            // console.log("Response = ",response.data);
            accessKey = response.data.access_token;
            const issued_time = parseInt(response.data.issued_at);
            const expiry_time = issued_time + 3599*1000

            // Insert the new token in the database.
            const tokenObj = {
                token_value: accessKey,
                issued_time: issued_time,
                expiry_time: expiry_time
            }

            texasRepo.createToken(tokenObj);
            // console.log("Data stored 2");


        } else{
            // console.log("Access Key found");
            // console.log("Token = ",token);

            const expiryTime = token[0].expiry_time;
            // console.log("expiry time = ",expiryTime);

            if (expiryTime < Date.now()){
                // console.log("Access Key expired");

                // Token has expired

                // Delete the old token from the table
                texasRepo.deleteToken(token[0].id);

                // Get a new Token
                const url = "https://transact.ti.com/v1/oauth/accesstoken";

            const clientCredentials = {
                grant_type: 'client_credentials',
                client_id: 'TGz6V5i4INHcJg4w8iDa06Y8EJqTiM3Z',
                client_secret: '3oOit3NGRHkG7wjv'
              };

            const requestBody = querystring.stringify(clientCredentials);

            const response = await axios.post(url,requestBody,{
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            accessKey = response.data.access_token;
            const issued_time = parseInt(response.data.issued_at);
            const expiry_time = issued_time + 3599*1000

            // Insert the new token in the database.
            const tokenObj = {
                id: apiUtil.generateId(),
                token_value: accessKey,
                issued_time: issued_time,
                expiryTime: expiry_time
            }

            texasRepo.createToken(tokenObj);
            // console.log("Data stored 2");


            } else {
                accessKey = token[0].token_value;
            }

        }

        // console.log("Access Key = ",accessKey);
        

        // else request for a new Access Token
        // console.log("Texas part number = ",partNumber);

        const accessKeyURL = config.texasAccessKeyURL;
    
        // const accessKey = "PIU3W7QwlRvG8D9qYo30A57fO1Hq";
        // const texasKeyword = partNumber; //"C0603C104K3RAC";  //"SN74LVC1G125DCKR"; 
        
        const texasVersion = config.texasVersion;

        const promises = []
        // console.log("Going to call Texas");

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;

            const texasUrl = `https://transact.ti.com/v${texasVersion}/store/products/${partNumber}/?currency=INR`;

            const texasPromise = axios.get(texasUrl,
                { headers: {'Authorization' : `Bearer ${accessKey}`},
                validateStatus: () => true}
            );
            
            promises.push(texasPromise);
        }

        // console.log("Texas Promises: ",promises);

        const response = await axios.all(promises);

        const responseMap = new Map();

        for (let i = 0; i < response.length; i++) {
            if (response[i].status === 200){
                const obj = {
                    data: response[i].data,
                    distributer: "Texas"
                }

                const partNumber = data[i].partNumber;
                const quantity = data[i].quantity;

                const key = `${partNumber}-${quantity}`;
                responseMap.set(key, obj);
            }

        }

        // console.log("Texas Map : ",responseMap);
        return responseMap;

    } catch(error){
        console.log("Error in getTexasData: ",error);
    }
};

const getTMEData = async (data,conversion) =>{
    try{
        const token = "c850b76479a46e253c40383eb8907071dc3136d3de975d0fe7";
        const secret = "fd5a595a6eda52c936f3";
        const client = new tme.Client(token,secret);

        const promises = [];
        // const result = [];

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;
            promises.push(fetchData(client,partNumber));
        }

        const response = await axios.all(promises);

        // return promises;
        // console.log("Response in TME = ",response);
        // console.log("Response in TME, packing = ",response);
        // console.log("Response in TME = ",response);

        // This is for batching when multiple different Part Number and Quantity pairs are provide.
        // Right now, only one pair of Part number and quantity used, but can be expanded in the future.
        const responseMap = new Map();
        
        for (let i = 0; i < response.length; i++){

            // result variable is an array of objects, where each object represent the data given by the API for a particular Part Number.
            const result = response[i];

            // console.log("response = ",result);

            const partNumber = data[i].partNumber;
            const quantity = data[i].quantity;

            // console.log("receieved Data in TME : ",data);
            // console.log("receieved Data[i] in TME : ",data[i]);
            
            const key = `${partNumber}-${quantity}`;
            let resultObj = {}
            const resultArray = [];
            // For mouser, these data where already given by the API as a single Object ('SearchResults' in the API). But, for TME we are creating the Array of Objects.

            // This is for the results we get for a single PartNumber-Quantity pair
            for (const resultItem of result){
                try{

                    const dataObj = {
                        TMEPartNum: resultItem.Symbol,
                        MPN: resultItem.OriginalSymbol,
                        Manufacturer: resultItem.Producer,
                        Description: resultItem.Description,
                        Moq: resultItem.MinAmount,
                        Spq: resultItem.Multiples,
                    };
    
                    // const obj = {
                    //     data: dataObj,
                    //     distributer: "TME"
                    // };

                    // console.log("TME DataObj = ",dataObj);

                    resultArray.push(dataObj);
    
    
                } catch(error){
                    console.log("Error in TME Fetch = ",error);
                }
            }

            resultObj = {
                data: resultArray,
                distributer: "TME"
            };

            responseMap.set(key, resultObj);

        }

        // console.log("TME responseMap = ",responseMap);
        return responseMap;

    } catch (error){
        console.log("Error in getTME : ",error);
    }
};

const getTMEPriceAndStocks = async (TMEPartNum) => {
    try{
        // console.log("Reached 1");

        const token = "c850b76479a46e253c40383eb8907071dc3136d3de975d0fe7";
        const secret = "fd5a595a6eda52c936f3";
        const client = new tme.Client(token,secret);

        return await fetchPriceAndStock(client,TMEPartNum);

    } catch (error){
        console.log("Error in getting price and stock in TME : ",error);
    }
}

const fetchData = async (client,partNumber) =>{
    const parameters = {
        'Country': 'IN',
        'Language': 'EN',
        'SearchPlain': partNumber
    }

    const result = [];

    // console.log("Reached 2");
    // console.log("Part number : ",partNumber);

    try{
        const resData = await client.request('/Products/Search',parameters);
        const prod = resData.Data.ProductList;

        prod.map((val) => {

            if (apiUtil.matchString(String(partNumber),val.OriginalSymbol)){
                result.push(val);
            }

            // if (val.OriginalSymbol === partNumber){
            //     result.push(val);
            // }
        });

        // console.log("Result = ",result);
        return result;

    } catch(error) {
        console.log("Error : ",error);
    }
};

const fetchPriceAndStock = async (client,TMEPartNum) => {
    const parameters = {
        'SymbolList[0]': TMEPartNum,
        'Country': 'IN',
        'Language': 'EN',
        'Currency': "USD",
    };

    try{
        const res = await client.request('/Products/GetPricesAndStocks', parameters);
        // console.log('Stored response data:', res);
        // console.log("Product List : ", res.Data.ProductList);
        return res;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

const getRutronikData = async (data) => {
    try{
        const rutronikApiKey = "cc6qyfg2yfis";
        const promises = [];

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;

            const rutronikUrl = `https://www.rutronik24.com/api/search/?apikey=${rutronikApiKey}&searchterm=${partNumber}`;
            const elementsPromise = axios.get(rutronikUrl);

            promises.push(elementsPromise);
        }

        const response = await axios.all(promises);

        const responseMap = new Map();

        for (let i = 0; i < response.length; i++) {
            try{

                if (response[i].data.hasOwnProperty('error')) {
                    continue;
                }
                const obj = {
                    data: response[i].data,
                    distributer: "Rutronik"
                }

                const partNumber = data[i].partNumber;
                const quantity = data[i].quantity;
    
                const key = `${partNumber}-${quantity}`;
                responseMap.set(key, obj);

            } catch(error){
                // Mostly error happens when that Part Number is not found
                console.log("Error in Rutronik : ",error);
            }
        }

        // console.log("Rutronik responseMap = ",responseMap);
        return responseMap;

    } catch(error){
        console.log("Error : ",error)
    }
};

const getDigiKeyData = async (data) => {
    try{
        const digiKeyAccess = "hkNUAgljyV78zVdZIyC190u4G4WZ";
        const promises = [];

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;

            const DigiKeyUrl = `https://sandbox-api.digikey.com/Search/v3/Products/ManufacturerProductDetails`;

            const DigiKeyPromise = axios.post(DigiKeyUrl, {
                ManufacturerProduct: 'SMBJ5.0A',
                RecordCount: 10,
                RecordStartPosition: 0,
                Sort: {
                  SortOption: 'SortByDigiKeyPartNumber',
                  Direction: 'Ascending',
                  SortParameterId: 0
                },
                RequestedQuantity: 0,
                SearchOptions: ['ManufacturerPartSearch']
            },{
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${digiKeyAccess}`,
                    'X-DIGIKEY-Client-Id': 'EkbtKePGCDV5UIKRpeN9CJjUumMY6IJ1',
                    'X-DIGIKEY-Locale-Site': 'IN',
                    'Content-Type': 'application/json'
                  }
            });

            promises.push(DigiKeyPromise);
        }

        const response = await axios.all(promises);

        const responseMap = new Map();

        for (let i = 0; i < response.length; i++) {
            try{

                const obj = {
                    data: response[i].data,
                    distributer: "DigiKey"
                }

                // console.log("Digikey response Data[i] : ",response[i].data);

                const partNumber = data[i].partNumber;
                const quantity = data[i].quantity;
    
                const key = `${partNumber}-${quantity}`;
                responseMap.set(key, obj);
            } catch(error){
                // Mostly error happens when that Part Number is not found
                console.log("Error in DigiKey : ",error);
            }
        }

        // console.log("Response map in Digikey : ",responseMap);
        // console.log("Digikey data fetched : ",responseMap.get(`${partNumber}-${quantity}`));

        return responseMap;



    } catch(error){
        console.log("Error : ",error);
    }
};

const getDigikeyKeywordData = async (data) => {
    try {

        const reqUrl = "https://api.digikey.com/v1/oauth2/token";

        const tokenData = await digi_access.findToken();
        console.log("TokenData = ",tokenData);

        // if (tokenData.length === 0){
        //     const authUri = 'https://api.digikey.com/v1/oauth2/authorize';
        //     const clientId = 'U3FpcVLEwL4YN1haZk9ChQ5tjCFENnJS';
        //     const redirectUri = 'https%3A%2F%2Flocalhost';
        //     const responseType = 'code';

        //     // const authorizationUri = `${authUri}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}`;

        //     const authorizationUri = "https://api.digikey.com/v1/oauth2/authorize?response_type=code&client_id=U3FpcVLEwL4YN1haZk9ChQ5tjCFENnJS&redirect_uri=https%3A%2F%2Flocalhost";

        //     const response = await axios.get(authorizationUri);

        //     console.log("Fine till here");

        //     const code = new URL(response.request.res.responseUrl).searchParams.get('code');
        //     console.log("Code = ",code);

        // }

        // console.log("reached here");

        let new_refresh_token = "";
        let new_access_token = "";

        if (tokenData.length === 0){
            const client_id = "ON4KuHJKrEHojfCSg99N5ub3HfI6bZAV";
                const client_secret = "hs3okLjwoq74eOnc";
                // const refresh_token = "a5KnUuftLRBUyIJxZwf7fY0ZWw0HKCDA";
                const grant_type = "refresh_token";
                const refresh_ = "ucW2hYOhREuFLT6OczWWu06Q1kPb9bFK";

        
                const reqBody = {
                    client_id : client_id,
                    client_secret: client_secret,
                    refresh_token: refresh_,
                    grant_type: grant_type    

                    };
        
                const reqBodyString = querystring.stringify(reqBody); // x-www-form-urlencoded format for request body

                
                try{
                    console.log("Reached here");
                    const tokenResponseBody = await axios.post(reqUrl, reqBodyString);
                    console.log("tokenResponseBody = ",tokenResponseBody);
        
                    new_refresh_token = tokenResponseBody.data.refresh_token;
                    new_access_token = tokenResponseBody.data.access_token;

                    const new_access_token_issued = Date.now();
                    const new_access_token_expiry = new_access_token_issued + 1795*1000;

                    const new_refresh_token_issued = Date.now();
                    const new_refresh_token_expiry = new_refresh_token_issued + 7775995 * 1000;

            
                    console.log("new_refresh_token : ",new_refresh_token);
                    console.log("new_access_token : ",new_access_token);

                    // Add the new access and refresh token to the database and remove the older one
                    // await digi_access.deleteToken(d_id);

                    const new_token = {
                        d_id: 1,
                        access_token: new_access_token,
                        access_token_issued: new_access_token_issued,
                        access_token_expiry: new_access_token_expiry,
                        refresh_token: new_refresh_token,
                        refresh_token_issued: new_refresh_token_issued,
                        refresh_token_expiry: new_refresh_token_expiry,
                    };

                    await digi_access.createToken(new_token);

        
                } catch (error){
                    console.log("Error in making refresh token req in DigiKey : ",error);
                }
        } else {
            const access_token = tokenData[0].access_token;
            const access_token_expiry = tokenData[0].access_token_expiry;
            const refresh_ = tokenData[0].refresh_token;
            const refresh_token_expiry = tokenData[0].refresh_token_expiry;
            const d_id = tokenData[0].d_id;
    
            console.log("access_token = ",access_token);
            console.log("access_token_expiry = ",access_token_expiry);
            console.log("refresh_ = ",refresh_);
            console.log("refresh_token_expiry = ",refresh_token_expiry);
            console.log("d_id = ",d_id);
            console.log("Date.now() = ",Date.now());
    
            if (Date.now() > access_token_expiry){
                // Access token expired, use the refresh token to get a new access and refresh token.
    
                if (Date.now() > refresh_token_expiry){
                    // Logic needs to be decided
                } else {
                    // Refresh token is valid
                    const client_id = "ON4KuHJKrEHojfCSg99N5ub3HfI6bZAV";
                    const client_secret = "hs3okLjwoq74eOnc";
                    // const refresh_token = "a5KnUuftLRBUyIJxZwf7fY0ZWw0HKCDA";
                    const grant_type = "refresh_token";
            
                    const reqBody = {
                        client_id : client_id,
                        client_secret: client_secret,
                        refresh_token: refresh_,
                        grant_type: grant_type            
                        };
            
                    const reqBodyString = querystring.stringify(reqBody); // x-www-form-urlencoded format for request body
    
                    
                    try{
                        console.log("Reached here");
                        const tokenResponseBody = await axios.post(reqUrl, reqBodyString);
                        console.log("tokenResponseBody = ",tokenResponseBody);
            
                        new_refresh_token = tokenResponseBody.data.refresh_token;
                        new_access_token = tokenResponseBody.data.access_token;
    
                        const new_access_token_issued = Date.now();
                        const new_access_token_expiry = new_access_token_issued + 1795*1000;
    
                        const new_refresh_token_issued = Date.now();
                        const new_refresh_token_expiry = new_refresh_token_issued + 7775995 * 1000;
    
                
                        console.log("new_refresh_token : ",new_refresh_token);
                        console.log("new_access_token : ",new_access_token);
    
                        // Add the new access and refresh token to the database and remove the older one
                        await digi_access.deleteToken(d_id);
    
                        const new_token = {
                            d_id: 1,
                            access_token: new_access_token,
                            access_token_issued: new_access_token_issued,
                            access_token_expiry: new_access_token_expiry,
                            refresh_token: new_refresh_token,
                            refresh_token_issued: new_refresh_token_issued,
                            refresh_token_expiry: new_refresh_token_expiry,
                        };
    
                        await digi_access.createToken(new_token);
    
            
                    } catch (error){
                        console.log("Error in making refresh token req in DigiKey : ",error);
                    }
    
                }
    
            } else {
                new_access_token = access_token;
            }
        }

        

        console.log("Access = ",new_access_token);
        const digiKeyAccess = new_access_token; //"yLuqRaZaSgoRNSr7ICX9UqCVqIZU";
        const promises = [];

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;

            const DigiKeyUrl = `https://api.digikey.com/products/v4/search/keyword`;

            const DigiKeyPromise = axios.post(DigiKeyUrl, {
                    "Keywords": `${partNumber}`,
                    "Limit": 50,
                    "Offset": 0
                },{
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${digiKeyAccess}`,
                        'X-DIGIKEY-Client-Id': 'ON4KuHJKrEHojfCSg99N5ub3HfI6bZAV',
                        'X-DIGIKEY-Locale-Site': 'IN',
                        'Content-Type': 'application/json'
                    }
                });

            promises.push(DigiKeyPromise);
        }

        const response = await axios.all(promises);

        const responseMap = new Map();

        for (let i = 0; i < response.length; i++) {
            try{

                const obj = {
                    data: response[i].data,
                    distributer: "Digikey_keyword"
                }

                // console.log("Digikey response Data[i] : ",response[i].data);

                const partNumber = data[i].partNumber;
                const quantity = data[i].quantity;
    
                const key = `${partNumber}-${quantity}`;
                responseMap.set(key, obj);
            } catch(error){
                // Mostly error happens when that Part Number is not found
                console.log("Error in DigiKey : ",error);
            }
        }

        return responseMap;

    } catch(error){
        console.log("Error : ",error);
    }
};

const getArrowData = async(data) => {
    try {
        const promises = [];

        const arrowLogin = "zionix1";
        const arrowApiKey = "0bedc103aa75a94fbf40aa0b393363385de77c866e30aa9071b1b1211875519c";
        const currency = `INR`;
        const rows = 25;

        for (const item of data){
            const partNumber = item.partNumber;
            const quantity = item.quantity;

            const arrowUrl = `http://api.arrow.com/itemservice/v4/en/search/token?login=${arrowLogin}&apikey=${arrowApiKey}&search_token=${partNumber}&utm_currency=${currency}&rows=${rows}`;
            const arrowPromise = axios.get(arrowUrl);

            promises.push(arrowPromise);
        }

        const response = await axios.all(promises);

        const responseMap = new Map();

        for (let i = 0; i < response.length; i++) {
            if (response[i].status === 200){

                try{
                    const obj = {
                        data: response[i].data,
                        distributer: "Arrow"
                    }
    
                    const partNumber = data[i].partNumber;
                    const quantity = data[i].quantity;
        
                    const key = `${partNumber}-${quantity}`;
                    responseMap.set(key, obj);
                } catch(error){
                    console.log("Error in Arrow : ",error);
                }
            }   

        }
        return responseMap;

    } catch(error){
        console.log("Error in Arrow Fetch : ",error)
    }
}

const getDatabaseData = async (data) => {
    // console.log("Data in data_fetch = ",data);
    const responseMap = new Map();
    for (const item of data){
        const partNumberVal = item.partNumber;
        const quantity = item.quantity;

        val = await componets.findAllData(partNumberVal);

        

        const obj = {
            data: val,
            distributer: "database Company"
        }

        const key = `${partNumberVal}-${quantity}`;
        responseMap.set(key, obj);        
    }

    return responseMap;
}
// ***********************************************************

module.exports = {
    getMouserData,
    getElementData,
    getTexasData,
    getTMEData,
    fetchPriceAndStock,
    getDatabaseData,
    getTMEPriceAndStocks,
    getRutronikData,
    getDigiKeyData,
    getDigikeyKeywordData,
    getArrowData,
};