const { Sequelize } = require('sequelize');
const price_breaks = require('../models/price_breaks');

const findPrice = async (componentId,quantity) =>{
    try{
        const price = await price_breaks.findOne({
            attributes: ['unit_price'],
            where: {
                component_id: componentId,
                quantity_start: {
                    [Sequelize.Op.lte]: quantity,
                },
            },
            order: [[Sequelize.literal('quantity_start DESC')]],
        });

        console.log("price : ",price.unit_price);
        return price.unit_price;

    } catch(error){
        console.log("Error in retrieving price : ", error);
    }
};

module.exports = {
    findPrice
};