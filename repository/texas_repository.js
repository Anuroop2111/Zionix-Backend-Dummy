const TexasAccess = require('../models/texasAccessModel');

const createToken = async (data) => {
    try{
        const newToken = new TexasAccess(data);
        const token = await newToken.save();
        // console.log("Token created : ",token);
    } catch(error){
        console.error('Error creating record:', error);
    }
};

const findToken = async () => {
    try{
        const token = await TexasAccess.find();
        return token;
    } catch(error){
        console.error('Error getting records:', error);
    }
};

const deleteToken = async (tokenId) =>{
    try{
        await TexasAccess.deleteOne({
            id: tokenId
        });
        console.error('Token deleted successfully');
    } catch(error){
        console.error('Error in deleteRecord controller:', error);
    }
};

module.exports = {
    createToken,
    findToken,
    deleteToken
};



