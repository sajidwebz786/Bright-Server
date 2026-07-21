require('dotenv').config();
const { Sequelize } = require('sequelize');

const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
const commonOptions = {
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false,
  dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
};

if (!process.env.DATABASE_URL && (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST)) {
  throw new Error('Database environment variables are missing. Set DATABASE_URL or DB_NAME, DB_USER, DB_PASSWORD, and DB_HOST.');
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      ...commonOptions,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432)
    });

const db = { sequelize, Sequelize };

module.exports = db;
