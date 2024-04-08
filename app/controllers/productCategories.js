"use strict"
const { CATEGORY_CONSTANTS } = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const { Category, validateCategoryCreate, validateCategoryEdit } = require("../models/productCategory");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

// create category
router.post("/create", authMiddleware(["superAdmin"]), async (req, res) => {
    const { error } = validateCategoryCreate(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var categoryName;
    if (req.body.categoryName) categoryName = req.body.categoryName;

    const existingCategory = await Category.findOne({ categoryName: categoryName, status: "active" });
    if (existingCategory) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: CATEGORY_CONSTANTS.CATEGORY_ALREADY_EXISTS
    });

    const category = new Category(_.pick(req.body, [
        "categoryName"
    ]));

    category.createdBy = req.jwtData._id;
    category.status = "active";
    await category.save();
    category.categoryId = category._id;

    let response = _.pick(category, [
        "_id",
        "categoryId",
        "categoryName",
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
        message: CATEGORY_CONSTANTS.CATEGORY_CREATED_SUCCESS,
        data: response
    });
});

// view category list
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

    if (req.query.categoryId) {
        criteria._id = new mongoose.Types.ObjectId(req.query.categoryId);
    }

    if (req.query.text) {
        var regexName = new RegExp(req.query.text, "i");
        criteria.$or = [{ categoryName: regexName }];
    }

    let response = await Category.aggregate([
        { $match: criteria },
        { $sort: { insertDate: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
            $project: {
                _id: "$_id",
                categoryId: "$_id",
                categoryName: 1,
                status: 1,
                updatedAt: 1,
                updatedBy: 1,
                createdBy: 1,
                insertDate: 1,
                creationDate: 1,
            }
        },
    ]);

    let totalCount = await Category.countDocuments(criteria);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: CATEGORY_CONSTANTS.VIEW_CATEGORY,
        totalCount,
        data: response
    });
});

// edit category
router.put("/edit", authMiddleware(["superAdmin"]), async (req, res) => {
    const { error } = validateCategoryEdit(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let category = await Category.findById({ _id: req.body.categoryId });
    if (!category) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: CATEGORY_CONSTANTS.NOT_FOUND
    });

    category.updatedAt = +new Date();
    category.updatedBy = req.jwtData._id;

    category.categoryName = req.body.categoryName || category.categoryName;
    await category.save();

    let response = _.pick(category, [
        "_id",
        "categoryId",
        "categoryName",
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
        message: CATEGORY_CONSTANTS.EDIT_CATEGORY,
        data: response
    });
});

// delete category
router.delete("/:id", authMiddleware(["superAdmin"]), async (req, res) => {
    let criteria = {};
    criteria._id = req.params.id;

    let category = await Category.findOne({ _id: criteria });
    if (!category) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: CATEGORY_CONSTANTS.NOT_FOUND
    });
    await Category.deleteOne({ _id: criteria });
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: CATEGORY_CONSTANTS.CATEGORY_DELETED
    });
});






module.exports = router;