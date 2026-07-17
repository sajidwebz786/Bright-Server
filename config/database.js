require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'brightsouldb',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'niavoit',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = { sequelize, Sequelize };

module.exports = db;
