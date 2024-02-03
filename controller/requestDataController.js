const express = require('express');
const router = express.Router();

const requestDataService = require('../service/requestDataService');

router.post("/store", async(req,res) => {
    try{
        console.log("Reached ");
        const response = await requestDataService.storeData(req);
        // console.log("response of index = ",response);
        res.send(response);
        
    } catch (error){
        console.log("Error in store controller : ",error);
    }
});

router.post("/getData", async(req, res) => {
    try{
        console.log("Going to fetch Data in req : ");
        const response = await requestDataService.getData(req);
        // console.log("Response = ",response);
        res.send(response);

    } catch(e){
        console.log("Error in /get controller = ",e);
    }
})

module.exports = router;
