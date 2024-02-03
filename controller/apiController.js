const express = require('express');
const apiService = require('../service/apiService');

const router = express.Router();



router.get('/mouser', async(req,res) =>{
    try{
        const apiKey = "e9838601-8de5-44be-855a-7e44ddd6cd08";
        const version = "1";
        const url = `https://api.mouser.com/api/v${version}/search/keyword?apiKey=${apiKey}`;
        const keyword = req.query.keyword //"SMBJ5.0A";
        // console.log(keyword);
   
        const response = await axios.post(url,{
            "SearchByKeywordRequest": {
              "keyword": keyword,
              "records": 0,
              "startingRecord": 0,
              "searchOptions": "string",
              "searchWithYourSignUpLanguage": "string"
            }
          });

        // res.json(response.data);
        res.send(response.data);
    } catch(error){
        console.log("Error : ",error);
    }
});
// instead of /test -> /data
router.post('/test', async(req,res) =>{
    try{
        const dataRecieved = req.body;
        const sortedData = await apiService.getSortedDataList(dataRecieved);
        res.send(sortedData);
    } catch(error){
        console.log("Error : ",error);
    }
});



router.post('web/test',async(req,res) =>{
    try{
        const dataRecieved = req.body;
        for (const item of dataRecieved){
            const response = await apiService.getSortedDataList(item);
            // I need to send the response in each iteration to the subscribed room.
        }
    } catch(error){
        console.log("Error : ",error);
    }
});

router.get('/getSortedData', async(req,res) =>{
    try{
        const partNumber = req.query.partNumber;
        const quantity = isNaN(req.query.quantity) ? 0 : parseInt(req.query.quantity);

        if (!partNumber){
            return []
        }

        const sortedData = await apiService.getSortedData(partNumber, quantity);
        res.send(sortedData);

    } catch(error){
        console.log("Error : ",error);
    }

});

module.exports = router;