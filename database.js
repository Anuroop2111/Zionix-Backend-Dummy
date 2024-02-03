const Sequelize = require('sequelize');

const sequelize = new Sequelize("exeb2b", "root", "1234",{
    host: "127.0.0.1",
    dialect: "mysql",
    define: {
        timestamps: false
    },
    logging: false
});

module.exports = sequelize;
