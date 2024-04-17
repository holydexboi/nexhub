"use strict"
const express = require("express");
const Logger = require("../startup/logger");
const superAdmin = require("../controllers/superAdmins");
const otp = require("../controllers/otps");
const user = require("../controllers/users");
const productCategory = require("../controllers/productCategories");
const product = require("../controllers/products");
const productBid = require("../controllers/productBid");
const contract = require("../controllers/contracts");


const error = require("../middleware/error");


module.exports = function (app) {
    app.use(express.json());
    app.use(Logger);
    app.use("/api/superAdmins", superAdmin);
    app.use("/api/otp", otp);
    app.use("/api/user", user);
    app.use("/api/productCategory", productCategory);
    app.use("/api/product", product);
    app.use("/api/product/contract/", productBid);
    app.use("/api/contract", contract);



    app.use(error);
};
