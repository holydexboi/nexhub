"use strict"
const path = require('path');
require('dotenv').config({ path: path.join("./config", '.env') });
const winston = require("winston");
const express = require("express");
const app = express();
const seed = require("./app/startup/seed");
const mongoose = require("mongoose");
mongoose.set("debug", true); // Enable Mongoose debugging before connecting to db

require("./app/startup/dbConnection")();
require("./app/startup/logging")();
require("./app/startup/logger");
require("./app/startup/cors")(app);
require("./app/startup/routes")(app);

seed();

// To generate random jwt secret key....
// const crypto = require('crypto');
// // Generate a 256-bit (16-byte) random string
// const jwtSecretKey = crypto.randomBytes(16).toString('hex');
// console.log(jwtSecretKey);

const port = 7003 || process.env.PORT;
const server = app.listen(port, () => { winston.info(`Server is running on ${port}....`) });
console.log(`Server is running on ${port}....`);

module.exports = server;
