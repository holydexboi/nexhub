"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const notificationSchema = new mongoose.Schema({
    fromUserId: String,
    toUserId: String,
    message: String,
    viewed: { type: Boolean, default: false },
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

const Notification = mongoose.model("Notification", notificationSchema);

// create Notification
function validateCreateNotification(req) {
    const schema = Joi.object({
        toUserId: Joi.string().min(2).max(255).required(),
        message: Joi.string().min(1).max(255).required(),
    })
    return schema.validate(req);
};

function validateNotificationView(req){
    const schema = Joi.object({
        notificationId: Joi.string().min(2).max(255).required(),
        
    })
    return schema.validate(req);
}

module.exports = {
    Notification,
    validateCreateNotification,
    validateNotificationView
}