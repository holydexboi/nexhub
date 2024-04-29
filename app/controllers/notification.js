"use strict"
const { NOTIFICATION_CONSTANTS, USER_CONSTANTS} = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const { Notification, validateCreateNotification, validateNotificationView } = require("../models/notification");
const { User } = require("../models/user");
const uuid = require('uuid');
const router = express.Router();

// create Notification
router.post("/create", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    const { error } = validateCreateNotification(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var fromUserId;
    fromUserId = req.jwtData._id;

    var toUserId;
    if(req.body.toUserId) toUserId = req.body.toUserId

    const existingUser = await User.findOne({ _id: toUserId});
    if (!existingUser) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NOT_FOUND
    });

    const notification = new Notification(_.pick(req.body, [
        "toUserId",
        "message"
    ]));

    notification.fromUserId = fromUserId
    notification.toUserId = toUserId
    notification.createdBy = req.jwtData._id;
    await notification.save();
    notification.notificationId = notification._id;

    let response = _.pick(notification, [
        "_id",
        "notificationId",
        "fromUserId",
        "toUserId",
        "message",
        "viewed",
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
        message: NOTIFICATION_CONSTANTS.NOTIFICATION_CREATED_SUCCESS,
        data: response
    });
});

// get user notification list
router.get("/list", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    var criteria = {};

    var offset = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset) * 10;
    var limit = isNaN(parseInt(req.query.limit)) ? 500 : parseInt(req.query.limit);

    if (req.query.notificationId) {
        criteria._id = new mongoose.Types.ObjectId(req.query.notificationId);
    }
    if (req.query.viewed) criteria.viewed = req.query.viewed;
    criteria.toUserId = req.jwtData._id

    if (req.query.text) {
        var regexName = new RegExp(req.query.text, "i");
        criteria.$or = [{ message: regexName }];
    }

    let response = await Notification.aggregate([
        { $match: criteria },
        { $sort: { insertDate: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
            $project: {
                _id: "$_id",
                notificationId: "$_id",
                fromUserId: 1,
                toUserId: 1,
                viewed: 1,
                updatedAt: 1,
                updatedBy: 1,
                createdBy: 1,
                insertDate: 1,
                creationDate: 1,
            }
        },
    ]);

    let totalCount = await Notification.countDocuments(criteria);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: NOTIFICATION_CONSTANTS.VIEW_NOTIFICATION,
        totalCount,
        data: response
    });
});

// edit category
router.put("/edit", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    const { error } = validateNotificationView(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let notification = await Notification.findById({ _id: req.body.notificationId });
    if (!notification) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: NOTIFICATION_CONSTANTS.NOT_FOUND
    });

    notification.updatedAt = +new Date();
    notification.updatedBy = req.jwtData._id;

    notification.viewed = true
    await notification.save();

    let response = _.pick(notification, [
        "_id",
        "notificationId",
        "fromUserId",
        "toUserId",
        "message",
        "viewed",
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
        message: NOTIFICATION_CONSTANTS.EDIT_NOTIFICATION,
        data: response
    });
});



module.exports = router;