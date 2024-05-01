"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const chatSchema = new mongoose.Schema({
    senderId: String,
    recipientId: String,
    message: String,
    time: { 
        type: Date,
        default: () => {
            return new Date();
        },
    },
    updatedAt: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    createdBy: String,
    creationDate: {
        type: Date,
        default: () => {
            return new Date();
        },
    },
    insertDate: {
        type: Number,
        default: () => {
            return Math.round(new Date() / 1000);
        },
    }
});

const Chat = mongoose.model("Chat", chatSchema);

// create Contract
function validateCreateChat(req) {
    const schema = Joi.object({
        recipientId: Joi.string().min(2).max(100).required(),
        message: Joi.string().min(1).max(100).required(),
    })
    return schema.validate(req);
};

module.exports = {
    Chat,
    validateCreateChat
}