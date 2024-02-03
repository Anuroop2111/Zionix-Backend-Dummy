const express = require('express');
const app = express();

const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');

const cors = require('cors');
const config = require('./config/config');
// const db = require("./database");
const mdb = require('./MongoDatabase');
const cookieParser = require('cookie-parser');

const apiService = require('./service/apiService');
const demandedDataRepo = require("./repository/demandedData_respository");
const apiController = require("./controller/apiController");
const fileController = require("./controller/fileController");
const requestDataController =require("./controller/requestDataController");
const apiUtil = require('./util/apiUtil');
const dataValueController = require("./controller/dataValueController");
const authController = require("./controller/authController");
// const initializeWebSocket = require('./websocket');
// const { Socket } = require('socket.io');

const port = config.port;

const corsOptions = {
  origin:["http://127.0.0.1:5173", "http://localhost:5173",], 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}

app.use(cors(corsOptions)); // {credentials: true}
app.use(express.json());
app.use(cookieParser());


const server = http.createServer(app);

const io = new Server(server,{
  cors: {
    origin: ["http://127.0.0.1:5173", "http://localhost:5173",],
    methods: ['GET','POST'],
    credentials: true,
  },
});

// Initialize WebSocket
// initializeWebSocket(io);

io.on("connection", (Socket) =>{
  console.log("User connected");

  Socket.on("send_data", async (data) =>{
    console.log("Reached Socket");
    // console.log("Socket data = ",data);
    const fileId = data.fileId;
    const userId = data.userId;
    // const demandedData = await fileRepository.findByUserIdAndFileId(userId, fileId);
    const demandedData = await demandedDataRepo.findData(fileId);
    // console.log("Demanded data = ",demandedData);
    // console.log("Demanded Data [0] = ",demandedData[0]);
    // const rowData = demandedData.file_data.rowData;

    const USD_TO_INR = 83.08; // await apiUtil.getConversion("USD","INR");
    const EUR_TO_INR = 90.42; // await apiUtil.getConversion("EUR","INR");
    console.log("EUR_to_inr : ",EUR_TO_INR);

    const batchSize = 30;
    // const totalItems = data.rowData?.length || 0;
    const totalItems = demandedData?.length || 0;
    console.log("Lenght of data = ",totalItems);
    const delay = 60*1000; // 30 seconds delay

    // console.log(data);
    console.log("Recieved Data in backend.")

    const processBatch = async (startIndex, endIndex) => {
      for (let i = startIndex; i < Math.min(endIndex,totalItems); i++){
        const index = demandedData[i].index;
        const partNumberVal = demandedData[i].demanded_mpn;
        const quantityVal = demandedData[i].demanded_quantity;
        const manufacturerVal = demandedData[i].demanded_brand;
        const descriptionVal = demandedData[i].demanded_specs;

        const newData = {
          index : index,
          partNumberVal : partNumberVal,
          quantityVal : quantityVal,
          manufacturerVal : manufacturerVal,
          descriptionVal : descriptionVal,
          fileId : fileId,
          userId : userId
        };

        try {
          const resultData = await apiService.getSortedWebData(newData, USD_TO_INR, EUR_TO_INR);
          Socket.emit("receive_data", resultData);
          console.log("Send data to frontend");

        } catch (error) {
          console.log("Error in sending response via websocket: ", error);
        }

      }

    };

    for (let i = 0; i < totalItems ; i++){
      const endIndex = Math.min(i + batchSize, totalItems);
      console.log(`Processing batch ${i} to ${endIndex + 1}`);

      const startTime = new Date()
      await processBatch(i,endIndex);
      const endTime = new Date();
      const elapsedTime = endTime - startTime;

      const remainingDelay = Math.max(0, delay - elapsedTime);

      if (i+batchSize <= totalItems){
        console.log(`Waiting for ${remainingDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

    };


  
    // const header = data.header;
    // const QuantityIndex = data.QuantityIndex;
    // console.log("Quantity index : ",QuantityIndex);
    // const PartNumIndex = data.PartNumIndex;
    // const ManufacturerIndex = data.ManufacturerIndex;
    // const DescriptionIndex = data.DescriptionIndex;
    // let indexFixer = 0;


    // if (header === "Yes"){
    //   indexFixer = 1;
    // }


    // const processBatch = async (startIndex,endIndex) =>{
    //   for (let i=startIndex; i<Math.min(endIndex,totalItems); i++){
    //     // console.log("Value of i = ",i)
    //     const item = data.rowData[i].data;
    //     const index = data.rowData[i].index;


    //     const newData = {
    //       index: index,
    //       rowData: item,
    //       header: header,
    //       QuantityIndex: QuantityIndex-1,
    //       PartNumIndex: PartNumIndex-1,
    //       ManufacturerIndex: ManufacturerIndex-1,
    //       DescriptionIndex: DescriptionIndex-1
    //     };

    //     try {
    //       const sortedData = await apiService.getSortedWebData(newData,USD_TO_INR,EUR_TO_INR);
    //       // console.log("Data about to send to the frontend : ",sortedData);
    //       // console.log("Price about to send to the frontend : ",sortedData[0].data.Price);
    //       Socket.emit("receive_data", sortedData);
    //       // console.log("Send data to frontend");
    //     } catch (error) {
    //       console.log("Error in sending response via websocket: ", error);
    //     }
    //   }
    // };

    // for (let i=0; i<totalItems; i+=batchSize){
    //   const endIndex = Math.min(i+batchSize,totalItems);
    //   console.log(`Processing batch ${i} to ${endIndex + 1}`);

    //   const startTime = new Date()
    //   await processBatch(i,endIndex);
    //   const endTime = new Date();
    //   const elapsedTime = endTime - startTime;

    //   // Calculate the remaining time to reach the next delay
    //   const remainingDelay = Math.max(0, delay - elapsedTime);

    //   if (i+batchSize <= totalItems){
    //     console.log(`Waiting for ${remainingDelay / 1000} seconds...`);
    //     await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    //   }

    // }
    });
    // console.log("Data sending to frontend finished");
  });
// });

app.use('/api',apiController);
app.use('/files',fileController);
app.use("/save",requestDataController);
app.use('/result', dataValueController);
app.use("/authenticate",authController);


// const initDb = async () =>{
//   console.log("Initialising DB connection");

//   try{
//     await db.authenticate();
//     console.log("Connection has been established successfully.");
//   } catch(error){
//     console.log("Error in db connection: ",error);
//   }
// }

// initDb();

mdb.mong();


server.listen(port,() =>{
    console.log("Port = ",port)
});
