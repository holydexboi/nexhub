"use strict"
const { PRODUCT_CONSTANTS, CATEGORY_CONSTANTS } = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const uploadDirect = multer({ storage: storage });
const { uploadFile } = require("../services/awsService");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const { Product, validateProductCreate, validateProductEdit } = require("../models/product");
const { Category } = require("../models/productCategory");
const router = express.Router();

// create product
router.post("/create", authMiddleware(["superAdmin"]), uploadDirect.fields([{ name: 'productPic', maxCount: 1 }]), async (req, res) => {
    const { error } = validateProductCreate(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var productCategoryId;
    if (req.body.productCategoryId) productCategoryId = req.body.productCategoryId;

    const existingCategory = await Category.findOne({ _id: productCategoryId });
    if (!existingCategory) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: CATEGORY_CONSTANTS.NOT_FOUND
    });

    var productName;
    if (req.body.productName) productName = req.body.productName;

    const existingProduct = await Product.findOne({ productName: productName, productCategoryId: productCategoryId });
    if (existingProduct) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PRODUCT_CONSTANTS.PRODUCT_ALREADY_EXISTS
    });

    let productPicUrl;
    if (req.files) {
        productPicUrl = await uploadFile(req.files, 'productPic', 'images');
    } else {
        productPicUrl = "";
    }

    const product = new Product(_.pick(req.body, [
        "productCategoryId",
        "productName",
        "productPic",
        "description",
        "quantity",
        "pricePerKg"
    ]));

    product.productPic = productPicUrl;
    product.createdBy = req.jwtData._id;
    product.status = "active";
    await product.save();
    product.productId = product._id;

    let response = _.pick(product, [
        "_id",
        "productId",
        "productCategoryId",
        "productName",
        "productPic",
        "description",
        "quantity",
        "pricePerKg",
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
        message: PRODUCT_CONSTANTS.PRODUCT_CREATED_SUCCESS,
        data: response
    });
});

// view product list
router.get("/list", authMiddleware(["superAdmin", "user"]), async (req, res) => {
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

    let totalCount = await Product.countDocuments(criteria);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: PRODUCT_CONSTANTS.VIEW_PRODUCT,
        totalCount,
        data: response
    });
});

// edit product
router.put("/edit", authMiddleware(["superAdmin"]), uploadDirect.fields([{ name: 'productPic', maxCount: 1 }]), async (req, res) => {
    const { error } = validateProductEdit(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let product = await Product.findById({ _id: req.body.productId });
    if (!product) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PRODUCT_CONSTANTS.NOT_FOUND
    });

    const productPicUrl = await uploadFile(req.files, 'productPic', 'images');
    product.productPic = productPicUrl || product.productPic;

    var productCategoryId;
    if (req.body.productCategoryId) productCategoryId = req.body.productCategoryId;

    const existingCategory = await Category.findOne({ _id: productCategoryId });
    if (!existingCategory) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: CATEGORY_CONSTANTS.NOT_FOUND
    });
    product.productCategoryId = req.body.productCategoryId || product.productCategoryId;

    product.updatedAt = +new Date();
    product.updatedBy = req.jwtData._id;

    product.productName = req.body.productName || product.productName;
    product.description = req.body.description || product.description;
    product.quantity = req.body.quantity || product.quantity;
    product.pricePerKg = req.body.pricePerKg || product.pricePerKg;

    await product.save();


    let response = _.pick(product, [
        "_id",
        "productId",
        "productCategoryId",
        "productName",
        "productPic",
        "description",
        "quantity",
        "pricePerKg",
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
        message: PRODUCT_CONSTANTS.EDIT_PRODUCT,
        data: response
    });
});

// delete product
router.delete("/:id", authMiddleware(["superAdmin"]), async (req, res) => {
    let criteria = {};
    criteria._id = req.params.id;

    let product = await Product.findOne({ _id: criteria });
    if (!product) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PRODUCT_CONSTANTS.NOT_FOUND
    });
    await Product.deleteOne({ _id: criteria });
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: PRODUCT_CONSTANTS.PRODUCT_DELETED
    });
});

module.exports = router;