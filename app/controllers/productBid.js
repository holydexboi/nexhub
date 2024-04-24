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
        "productId",
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

// view importer request list
router.get("/request/poll", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    var criteria = {};

    var offset = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset) * 10;
    var limit = isNaN(parseInt(req.query.limit)) ? 500 : parseInt(req.query.limit);

    if (req.jwtData.role === "user") {
        criteria.status = "active";
    } else {
        criteria.createdBy = req.jwtData._id;
    }

    if (req.query.status) criteria.status = req.query.status;

    if (req.query.productId) {
        criteria._id = new mongoose.Types.ObjectId(req.query.productId);
    }

    if (req.query.productCategoryId) {
        criteria.productCategoryId = req.query.productCategoryId;
    }

    if (req.query.text) {
        var regexName = new RegExp(req.query.text, "i");
        criteria.$or = [{ productName: regexName }, { productCategoryName: regexName }];
    }

    let response = await Product.aggregate([
        { $match: criteria },
        { $sort: { insertDate: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
            $lookup: {
                from: "categories",
                let: { categoryId: { $toObjectId: "$productCategoryId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } },
                ],
                as: "categoryDetails",
            },
        },
        {
            $project: {
                _id: "$_id",
                productId: "$_id",
                productCategoryId: 1,
                productCategoryName: { $arrayElemAt: ["$categoryDetails.categoryName", 0] },
                productName: 1,
                productPic: 1,
                description: 1,
                quantity: 1,
                pricePerKg: 1,
                status: 1,
                updatedAt: 1,
                updatedBy: 1,
                createdBy: 1,
                insertDate: 1,
                creationDate: 1,
            }
        },
    ]);
    let bidProduct = await ProductBid.aggregate([

        {
            $project: {
                _id: "$_id",
                productId: 1,
                userId: 1
            }
        },
    ]);
    
const importPoll = response.map(resp => {
    resp.bidded = false 
    bidProduct.map(bid => {
        if(bid.productId == resp._id){
            resp.bidded = true
            
        }
            


    })
    return resp
})
    let totalCount = await Product.countDocuments(criteria);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: PRODUCT_CONSTANTS.VIEW_PRODUCT,
        totalCount,
        data: importPoll
    });
});

module.exports = router;