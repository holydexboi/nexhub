"use strict"
const { CONTRACT_CONSTANTS, CATEGORY_CONSTANTS, USER_CONSTANTS } = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const uploadDirect = multer({ storage: storage });
const { uploadFiles } = require("../services/awsService");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const { Contract, validateContractCreate, validateContractRequest } = require("../models/contract");
const { Category } = require("../models/productCategory");
const { User } = require("../models/user");
const uuid = require('uuid');
const router = express.Router();

// create Contract
router.post("/create", authMiddleware(["user"]), (req, res, next) => {
    uploadDirect.fields([{ name: 'productPic', maxCount: 4 }])(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
            err.message = 'Maximum 4 image files are allowed.';
            if (err) return res.status(400).send({
                apiId: req.apiId,
                statusCode: 400,
                success: false,
                message: err.message
            });
        }
        next();
    });
}, async (req, res) => {
    const { error } = validateContractCreate(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var userId;
    if (req.jwtData.role === "user") userId = req.jwtData._id;

    const existingUser = await User.findOne({ _id: userId, userType: "exporter" });
    if (!existingUser) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.ONLY_EXPORTER_CONTRACT
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

    let productPicUrls = [];
    if (req.files) {
        productPicUrls = await uploadFiles(req.files, 'productPic', 'images');
    }

    const contract = new Contract(_.pick(req.body, [
        "date",
        "address",
        "exporterName",
        "exporterOrgName",
        "productPic",
        "productCategoryId",
        "productName",
        "quantity",
        "countryOfOrigin",
        "specifications",
        "adMixture",
        "productColor",
        "mucor",
        "deliveryDate",
        "destinationPort",
        "paymentTerms",
        "price",
        "serviceRequests",
        "otherRequests",
        "followUpsAvailability",
        "previousCustomer"
    ]));

    contract.productPic = productPicUrls;
    contract.createdBy = req.jwtData._id;
    contract.status = "pending";
    contract.orderId = "";
    await contract.save();
    contract.contractId = contract._id;

    let response = _.pick(contract, [
        "_id",
        "contractId",
        "orderId",
        "date",
        "address",
        "exporterName",
        "exporterOrgName",
        "productPic",
        "productCategoryId",
        "productName",
        "quantity",
        "countryOfOrigin",
        "specifications",
        "adMixture",
        "productColor",
        "mucor",
        "deliveryDate",
        "destinationPort",
        "paymentTerms",
        "price",
        "serviceRequests",
        "otherRequests",
        "followUpsAvailability",
        "previousCustomer",
        "status",
        "isContractApproved",
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
        message: CONTRACT_CONSTANTS.CONTRACT_CREATED_SUCCESS,
        data: response
    });
});

// view contract list
router.get("/list", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    var criteria = {};

    var offset = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset) * 10;
    var limit = isNaN(parseInt(req.query.limit)) ? 500 : parseInt(req.query.limit);

    if (req.jwtData.role === "user") {
        criteria.createdBy = req.jwtData._id;
    }

    if (req.query.status) criteria.status = req.query.status;

    if (req.query.contractId) {
        criteria._id = new mongoose.Types.ObjectId(req.query.contractId);
    }

    if (req.query.orderId) {
        criteria.orderId = req.query.orderId;
    }

    if (req.query.text) {
        var regexName = new RegExp(req.query.text, "i");
        criteria.$or = [{ exporterName: regexName }, { exporterOrgName: regexName }, { orderId: regexName }, { productName: regexName }];
    }

    let response = await Contract.aggregate([
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
                contractId: "$_id",
                orderId: 1,
                date: 1,
                address: 1,
                exporterName: 1,
                exporterOrgName: 1,
                productPic: 1,
                productCategoryId: 1,
                productCategoryName: { $arrayElemAt: ["$categoryDetails.categoryName", 0] },
                productName: 1,
                quantity: 1,
                countryOfOrigin: 1,
                specifications: 1,
                adMixture: 1,
                productColor: 1,
                orderStatus: 1,
                contractApprovedDate: 1,
                contractConfirmedDate: 1,
                processToSpecDate: 1,
                exportDocumentUploadDate: 1,
                consignmentPortDate: 1,
                consignmentDestinationDate: 1,
                mucor: 1,
                deliveryDate: 1,
                destinationPort: 1,
                paymentTerms: 1,
                price: 1,
                serviceRequests: 1,
                otherRequests: 1,
                followUpsAvailability: 1,
                previousCustomer: 1,
                status: 1,
                isContractApproved: 1,
                updatedAt: 1,
                updatedBy: 1,
                createdBy: 1,
                insertDate: 1,
                creationDate: 1,
            }
        },
    ]);

    let totalCount = await Contract.countDocuments(criteria);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: CONTRACT_CONSTANTS.VIEW_CONTRACT,
        totalCount,
        data: response
    });
});



// approve/reject contract request by admin
router.put("/approve/reject", authMiddleware(["superAdmin"]), async (req, res) => {
    const { error } = validateContractRequest(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var contractId;
    if (req.body.contractId) contractId = req.body.contractId;

    const existingContract = await Contract.findOne({ _id: contractId, status: "pending", isContractApproved: false });
    if (!existingContract) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: CONTRACT_CONSTANTS.NOT_FOUND
    });

    let status;
    if (req.body.status) status = req.body.status;
    if (status === "approved" || status === "rejected") {
        existingContract.status = status;
        existingContract.isContractApproved = status === "approved" ? true : false;

        let orderCounter = 1;
        if (status === "approved") {
            const prefix = "ORD";
            const uniqueId = uuid.v4().split('-')[0];
            existingContract.orderId = `${prefix}${orderCounter++}-${uniqueId}`;
            existingContract.orderStatus = "pending inspection"
            existingContract.contractApprovedDate = new Date()
        } else {
            existingContract.orderId = "";
        }
        await existingContract.save();

        existingContract.contractId = existingContract._id;
        const successMessage = status === "approved" ? CONTRACT_CONSTANTS.CONTRACT_APPROVED : CONTRACT_CONSTANTS.CONTRACT_REJECTED;

        return res.status(200).send({
            apiId: req.apiId,
            statusCode: 200,
            success: true,
            message: successMessage,
            data: existingContract
        });
    } else {
        return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: CONTRACT_CONSTANTS.INVALID_STATUS_PROVIDED
        });
    }
});


module.exports = router;