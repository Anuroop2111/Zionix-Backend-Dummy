// const {DataTypes} = require('sequelize');
// const sequelize  = require("../database");

// const data_index = sequelize.define('data_index',{
//     id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true,
//     },

//     data_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         // autoIncrement: true,
//         // primaryKey: true,
//     },

//     index: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//     },
// },{
//     timestamps: false, // Include createdAt and updatedAt columns
//     tableName: 'data_index'
// });

// data_index.sync();

// module.exports = data_index;