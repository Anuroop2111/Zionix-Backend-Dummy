const User = require('../models/UserDetails');

const findByEmail = async (email) => {
    try{
        const user = await User.findOne({
            email : email,
        });
        return user;

    } catch(error){
        console.log("Error in fetching User Data : ",error);
    }
};

const saveUser = async (userData) => {
    try{
        const newUser = new User(userData);
        
        const savedUser = await newUser.save();
        console.log("Saved user : ",savedUser);
        return true;

    }  catch (error){
        console.log("Error saving user : ",error);
        return false;
    }
};

module.exports = {
    findByEmail,
    saveUser,
};