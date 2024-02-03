const DigikeyAccess = require('../models/digikeyAccessModel');

const createToken = async (data) => {
    try{
        const newToken = new DigikeyAccess(data);
        const token = await newToken.save();
        console.log("Digikey Token created : ",token);

    } catch(error){
        console.error('Error creating record:', error);
    }
};

const findToken = async () => {
    try{
        const token = await DigikeyAccess.find();
        return token;
    } catch(error){
        console.error('Error getting records:', error);
    }
};

const deleteToken = async (d_id) =>{
    try{
        await DigikeyAccess.deleteOne({
            d_id: d_id
        });
        console.error('Digikey Token deleted successfully');
    } catch(error){
        console.error('Error in deleteRecord controller:', error);
    }
};

module.exports = {
    createToken,
    findToken,
    deleteToken
};



