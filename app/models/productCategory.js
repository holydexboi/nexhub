"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const CategorySchema = new mongoose.Schema({
    categoryName: String,
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
    },
});

const Category = mongoose.model("Category", CategorySchema);


// add new Category
function validateCategoryCreate(req) {
    const schema = Joi.object({
        categoryName: Joi.string().min(2).max(80).required(),
    });
    return schema.validate(req);
};

//update Category
function validateCategoryEdit(req) {
    const schema = Joi.object({
        categoryId: Joi.string().min(1).max(200).required(),
        categoryName: Joi.string().min(2).max(80),
    });
    return schema.validate(req);
};


module.exports = {
    Category,
    validateCategoryCreate,
    validateCategoryEdit
}