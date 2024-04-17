"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const productBidSchema = new mongoose.Schema({
    productId: String,
    userId: String,
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

const ProductBid = mongoose.model("ProductBid", productBidSchema);

function validateProductBid(req) {
    const schema = Joi.object({
        productId: Joi.string().min(2).max(255).required(),
    })
    return schema.validate(req);
};

module.exports = {
    ProductBid,
    validateProductBid,
}