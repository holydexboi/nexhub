"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const subscriberPlanSchema = new mongoose.Schema({
    type: String,
    price: Number,
    description: String,
    term: String,
    status: { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
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

const SubscriberPlan = mongoose.model("subscriberPlan", subscriberPlanSchema);

function validateSubscriberPlan(req) {
    const schema = Joi.object({
        type: Joi.string().min(2).max(255).required(),
        price: Joi.number().required(),     
        description: Joi.string().min(2).max(502).required(),
        term: Joi.string().required(),
    })
    return schema.validate(req);
};

function validateEditSubscriberPlan(req) {
    const schema = Joi.object({
        planId: Joi.string().min(2).max(255).required(),
        type: Joi.string().min(2).max(255),
        price: Joi.number(),     
        description: Joi.string().min(2).max(502),
        term: Joi.string(),
    })
    return schema.validate(req);
};

module.exports = {
    SubscriberPlan,
    validateSubscriberPlan,
    validateEditSubscriberPlan

}