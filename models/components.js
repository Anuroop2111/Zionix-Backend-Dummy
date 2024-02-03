// const {DataTypes} = require('sequelize');
// const sequelize  = require("../database");

// const components = sequelize.define('components',{
//     component_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         autoIncrement: true,
//         primaryKey: true,
//     },

//     distributer_name: {
//         type: DataTypes.STRING(45),
//         // allowNull: true,
//     },

//     part_number: {
//         type: DataTypes.STRING(45),
//         // allowNull: true,
//     },

//     manufacturer_name: {
//         type: DataTypes.STRING(45),
//         // allowNull: true,
//     },

//     availability: {
//         type: DataTypes.INTEGER,
//         // allowNull: false,
//     },

//     moq: {
//         type: DataTypes.INTEGER,
//         // allowNull: true,
//     },

//     description: {
//         type: DataTypes.TEXT,
//     },
// },{
//     timestamps: false, // Include createdAt and updatedAt columns
//     tableName: 'components'
// });

// components.sync();

// module.exports = components;