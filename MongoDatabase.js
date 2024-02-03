const mongoose = require("mongoose");

const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const mong = () => {
    try {
        const password = "9b9uDLZUjhkPN9wA";
        const username = "exeb2b";
        mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.ztplmc7.mongodb.net/?retryWrites=true&w=majority`,connectionParams,);
        console.log("mongodb connected");

    } catch (error){
        console.log("error connecting to mongodb = ",error);
    }
}

module.exports = {
    mong,
}