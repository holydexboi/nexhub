"use strict"
require('dotenv').config({ path: './config/env' });
const winston = require("winston");
const mongoose = require("mongoose");


// DB CONNECTION
module.exports = async function () {
    try {
        const db = process.env.MONGO_URL;
        await mongoose.connect(db).then(() => winston.info(`Connected to the database : ${db}`));
        console.log(`Connected to the database : ${db}`);
    } catch (err) {
        console.log(err.message, "Could not connect to the database");
    }
}





