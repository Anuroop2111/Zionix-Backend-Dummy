const dataValueRepo = require("../repository/result_repository");

const getData = async (fileId, index, dataId) => {
  try {
    const dataVal = await dataValueRepo.findData(fileId, index, dataId);
    // console.log("Data Val = ",dataVal);

    return dataVal;
  } catch (error) {
    console.log("Error in getting data = ", dataVal);
  }
};

module.exports = {
  getData,
};
