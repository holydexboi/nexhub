"use strict"
const { PRODUCT_CONSTANTS, PRODUCTBID_CONSTANTS } = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const _ = require("lodash");
const express = require("express");
const { Product } = require("../models/product");
const { ProductBid, validateProductBid} = require("../models/productBid");
const router = express.Router();


router.post("/bid", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    const { error } = validateProductBid(req.body);

    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var productId;
    if (req.body.productId) productId = req.body.productId;

    const existingProduct = await Product.findOne({ _id: productId });
    if (!existingProduct) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PRODUCT_CONSTANTS.NOT_FOUND
    });

    const existingProductBid = await ProductBid.findOne({ productId: productId, userId: req.jwtData._id });
    if (existingProductBid) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PRODUCTBID_CONSTANTS.PRODUCTBID_ALREADY_EXISTS
    });

    const productBid = new ProductBid(_.pick(req.body, [
        "productBidId",
    ]))

    productBid.userId = req.jwtData._id
    productBid.createdBy = req.jwtData._id;
    productBid.status = "active";
    await productBid.save();
    productBid.productBidId = productBid._id;

    let response = _.pick(productBid, [
        "_id",
        "productBidId",
        "userId",
        "status",
        "updatedAt",
        "updatedBy",
        "createdBy",
        "insertDate",
        "creationDate"
    ]);
    res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: PRODUCTBID_CONSTANTS.PRODUCT_BID_SUCCESS,
        data: response
    });
});

module.exports = router;