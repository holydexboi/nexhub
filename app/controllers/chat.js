"use strict"
const { CHAT_CONSTANTS, USER_CONSTANTS } = require("../../config/constant");
const { authMiddleware } = require("../middleware/auth");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const { Chat, validateCreateChat } = require("../models/chat");
const { User } = require("../models/user");
const { SuperAdmin } = require("../models/superAdmin");
const uuid = require('uuid');
const router = express.Router();

// create chat
router.post("/create", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    const { error } = validateCreateChat(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    var senderId;
    senderId = req.jwtData._id;

    var recipientId;
    if(req.body.recipientId) recipientId = req.body.recipientId

    if(req.jwtData.role == "user"){

        const existingUser = await SuperAdmin.findOne({ _id: recipientId});
        if (!existingUser) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: USER_CONSTANTS.NOT_FOUND
        });
    }else{
        const existingUser = await User.findOne({ _id: recipientId});
        if (!existingUser) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: USER_CONSTANTS.NOT_FOUND
        });
    }



    const chat = new Chat(_.pick(req.body, [
        "recipientId",
        "message"
    ]));

    chat.senderId = senderId
    chat.recipientId = recipientId
    chat.createdBy = req.jwtData._id;
    await chat.save();
    chat.chatId = chat._id;

    let response = _.pick(chat, [
        "_id",
        "chatId",
        "senderId",
        "recipientId",
        "message",
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
        message: CHAT_CONSTANTS.CHAT_CREATED_SUCCESS,
        data: response
    });
});

// get user notification list
router.get("/:senderId/:recipientId", authMiddleware(["superAdmin", "user"]), async (req, res) => {
    let criteria = {};

    if(req.jwtData.role == "user"){

        const existingUser = await User.findOne({ _id: req.jwtData._id});
        console.log(existingUser)
        if (!existingUser) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: USER_CONSTANTS.NOT_FOUND
        });

        const existingAdmin = await SuperAdmin.findOne({ _id: req.params.senderId});
        if (!existingAdmin) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: USER_CONSTANTS.NOT_FOUND
        });
    }else{
        const existingUser = await SuperAdmin.findOne({ _id: req.jwtData._id});
        if (!existingUser) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: USER_CONSTANTS.NOT_FOUND
        });

        const existingAdmin = await User.findOne({ _id: req.params.senderId});
        if (!existingAdmin) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: USER_CONSTANTS.NOT_FOUND
        });
    }
    criteria.senderId = { $in: [req.jwtData._id, req.params.senderId] };
    criteria.recipientId = { $in: [req.jwtData._id, req.params.senderId] };


    var offset = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset) * 10;
    var limit = isNaN(parseInt(req.query.limit)) ? 500 : parseInt(req.query.limit);


    let response = await Chat.aggregate([
        { $match: criteria },
        { $sort: { insertDate: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                let: { recipientId: { $toObjectId: "$recipientId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$recipientId"] } } },
                ],
                as: "recipientDetails",
            },
            
        },
        {
            $lookup: {
                from: "users",
                let: { senderId: { $toObjectId: "$senderId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$senderId"] } } },
                ],
                as: "senderDetails",
            },
            
        },
        {
            $project: {
                _id: "$_id",
                chatId: "$_id",
                recipientId: 1,
                message: 1,
                recipientFirstName: { $arrayElemAt: ["$recipientDetails.firstName", 0]},
                recipientLasttName: { $arrayElemAt: ["$recipientDetails.lastName", 0]},
                senderId: 1,
                senderFirstName: { $arrayElemAt: ["$senderDetails.firstName", 0]},
                senderLasttName: { $arrayElemAt: ["$senderDetails.lastName", 0]},
                updatedAt: 1,
                updatedBy: 1,
                createdBy: 1,
                insertDate: 1,
                creationDate: 1,
            }
        },
    ]);

    res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: CHAT_CONSTANTS.CHAT_CREATED_SUCCESS,
        data: response
    });
})


module.exports = router;