const express = require('express');
const router = express.Router();

const resultDataService = require("../service/resultDataService");

router.post("/getData", async(req, res) => {
    try{
        console.log("Going to fetch Data : ");
        const fileId = req.body[0].file_id;
        const index = req.body[0].index;
        const dataId = req.body[0].data_id;
        
        const response = await resultDataService.getData(fileId, index, dataId);
        // console.log("Response = ",response);
        res.send(response);

    } catch(e){
        console.log("Error in /get controller = ",e);
    }
})

module.exports = router;
