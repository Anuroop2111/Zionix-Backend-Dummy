const crypto = require('crypto');
const querystring = require('querystring');
const axios = require('axios');

class Client {
    constructor(apiToken, apiSecret, apiHost = 'https://api.tme.eu') {
        this.apiToken = apiToken;
        this.apiSecret = Buffer.from(apiSecret, 'utf-8');
        this.apiHost = apiHost;
    }

    getSignatureBase(url, params) {
        const sortedParams = Object.fromEntries(Object.entries(params).sort());
        const encodedParams = querystring.stringify(sortedParams);
        const signatureBase = `POST&${encodeURIComponent(url)}&${encodeURIComponent(encodedParams)}`;
        return Buffer.from(signatureBase, 'utf-8');
    }

    calculateSignature(url, params) {
        const signatureBase = this.getSignatureBase(url, params);
        const hmacValue = crypto.createHmac('sha1', this.apiSecret).update(signatureBase).digest();
        return hmacValue.toString('base64');
    }

    request(endpoint, params, format = 'json') {
        const url = `${this.apiHost}${endpoint}.${format}`;
        params.Token = this.apiToken;
        params.ApiSignature = this.calculateSignature(url, params);

        // console.log("Params = ",params);

        const data = querystring.stringify(params);
        const headers = {
            'Content-type': 'application/x-www-form-urlencoded',
        };

        const options = {
            method: 'POST',
            headers: headers,
        };

        return axios.post(url,data,{headers})
            .then(response => response.data)
            .catch(error => Promise.reject(error.response ? error.response.data : error.message));
    }

}

module.exports = {
    Client
};


// Example usage
const token = "c850b76479a46e253c40383eb8907071dc3136d3de975d0fe7";
const secret = "fd5a595a6eda52c936f3";



const client = new Client(token, secret);

const fetchPriceAndStock = async (item) => {
    const parameters = {
        'SymbolList[0]': item.Symbol,
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

const fetchData = async (client) =>{
    const param2 = {
        'Country': 'IN',
        'Language': 'EN',
        'SearchPlain': 'SMBJ5.0A'
    }

    const result = [];

    try{
        const resData = await client.request('/Products/Search',param2);
        const prod = resData.Data.ProductList;

        prod.map((val) => {
            if (val.OriginalSymbol === "SMBJ5.0A"){
                result.push(val);
            }
        });

        // console.log("Result = ",result);
        return result;



    } catch(error) {
        console.log("Error : ",error);
    }
};

// Wrap your code in an async IIFE
// (async () => {
//     const result = await fetchData(client);
//     console.log("Result:", result);

//     for (const item of result){
//         const value = await fetchPriceAndStock(item);
//         console.log("Value = ",value);
//     }
     
// })();

