const components = require('../models/components');

const findAllData = async (partNumber) =>{
    try{
        const data = await components.findAll({
            where: {
                part_number: partNumber,
            }
        })

        return data;
    } catch(error){
        console.log("Error in getting data from components table : ",error);
    };
};


module.exports = {
    findAllData
}