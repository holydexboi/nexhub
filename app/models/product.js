"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");


const productSchema = new mongoose.Schema({
    productCategoryId: String,
    productName: String,
    productPic: { type: String, default: "" },
    description: String,
    quantity: String,
    pricePerKg: String,
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

const Product = mongoose.model("Product", productSchema);

// Joi validations for Product

// create Product
function validateProductCreate(req) {
    const schema = Joi.object({
        productCategoryId: Joi.string().min(2).max(255).required(),
        productName: Joi.string().min(2).max(100).required(),
        productPic: Joi.string().min(2).max(255).allow(""),
        description: Joi.string().min(2).max(255).required(),
        quantity: Joi.string().min(1).max(255).required(),
        pricePerKg: Joi.string().min(1).max(255).required()
    })
    return schema.validate(req);
};

// edit Product
function validateProductEdit(req) {
    const schema = Joi.object({
        productId: Joi.string().min(2).max(255).required(),
        productCategoryId: Joi.string().min(2).max(255),
        productName: Joi.string().min(2).max(255),
        productPic: Joi.string().min(2).max(255).allow(""),
        description: Joi.string().min(2).max(255),
        quantity: Joi.string().min(1).max(255),
        pricePerKg: Joi.string().min(1).max(255)
    });
    return schema.validate(req);
};


module.exports = {
    Product,
    validateProductCreate,
    validateProductEdit,
}

