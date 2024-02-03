// const {DataTypes} = require('sequelize');
// const sequelize  = require("../database");
// const components = require('../models/components');

// const price_breaks = sequelize.define('price_breaks',{
//     component_id: {
//         type: DataTypes.INTEGER,
//         // allowNull: true,
//         references: {
//           model: components,
//           key: 'component_id',
//         },
//       },

//       quantity_start: {
//         type: DataTypes.INTEGER,
//         // allowNull: true,
//       },

//       quantity_end: {
//         type: DataTypes.INTEGER,
//         // allowNull: true,
//       },

//       unit_price: {
//         type: DataTypes.INTEGER,
//         // allowNull: true,
//       },

//       currency: {
//         type: DataTypes.STRING(45),
//         // allowNull: true,
//       },
// },{
//     timestamps: false, // Include createdAt and updatedAt columns
//     tableName: 'price_breaks'
// });

// price_breaks.sync();

// module.exports = price_breaks;