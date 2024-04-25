"use strict"
const { PLAN_CONSTANTS } = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const _ = require("lodash");
const express = require("express");
const { SubscriberPlan, validateSubscriberPlan, validateEditSubscriberPlan} = require("../models/subscriberPlan");
const router = express.Router();

// create SubscriberPlan
router.post("/create", authMiddleware(["superAdmin"]), async (req, res) => {
    const { error } = validateSubscriberPlan(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });


    var type;
    if (req.body.type) type = req.body.type;

    const existingPlan = await SubscriberPlan.findOne({ type: type });
    if (existingPlan) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PLAN_CONSTANTS.PLAN_ALREADY_EXISTS
    });

    const subscriberPlan = new SubscriberPlan(_.pick(req.body, [
        "type",
        "price",
        "description",
        "term",
    ]));

    subscriberPlan.createdBy = req.jwtData._id;
    subscriberPlan.status = "active";
    await subscriberPlan.save();
    subscriberPlan.planId = subscriberPlan._id;

    let response = _.pick(subscriberPlan, [
        "_id",
        "planId",
        "type",
        "price",
        "description",
        "term",
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
        message: PLAN_CONSTANTS.PLAN_CREATED_SUCCESS,
        data: response
    });
});

// view plan list
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

    if (req.query.planId) {
        criteria._id = new mongoose.Types.ObjectId(req.query.planId);
    }

    if (req.query.text) {
        var regexName = new RegExp(req.query.text, "i");
        criteria.$or = [{ type: regexName }];
    }

    let response = await SubscriberPlan.aggregate([
        { $match: criteria },
        { $sort: { insertDate: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
            $project: {
                _id: "$_id",
                planId: "$_id",
                type: 1,
                term: 1,
                price: 1,
                description: 1,
                status: 1,
                updatedAt: 1,
                updatedBy: 1,
                createdBy: 1,
                insertDate: 1,
                creationDate: 1,
            }
        },
    ]);

    let totalCount = await SubscriberPlan.countDocuments(criteria);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: PLAN_CONSTANTS.VIEW_PRODUCT,
        totalCount,
        data: response
    });
});

// edit plan
router.put("/edit", authMiddleware(["superAdmin"]), async (req, res) => {
    const { error } = validateEditSubscriberPlan(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let plan = await SubscriberPlan.findById({ _id: req.body.planId });
    if (!plan) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: PLAN_CONSTANTS.NOT_FOUND
    });

    plan.updatedAt = +new Date();
    plan.updatedBy = req.jwtData._id;

    plan.type = req.body.type || plan.type;
    plan.description = req.body.description || plan.description;
    plan.term = req.body.term || plan.term;
    plan.price = req.body.price || plan.price;

    await plan.save();


    let response = _.pick(plan, [
        "_id",
        "planId",
        "type",
        "term",
        "description",
        "price",
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
        message: PLAN_CONSTANTS.EDIT_PLAN,
        data: response
    });
});


module.exports = router;