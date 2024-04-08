"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const superAdminSchema = new mongoose.Schema({
    profilePic: { type: Array, default: [] },
    fullName: String,
    email: String,
    password: String,
    countryCode: { type: String, default: "" },
    mobile: { type: String, default: "" },
    address: String,
    authToken: { type: String, default: "" },
    createdAt: { type: String, default: +new Date() },
    updatedAt: { type: String, default: "" },
    role: { type: String, default: "superAdmin" },
    status: { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
});

const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

// Joi validations for superAdmin

// login
function validateSuperAdminLogin(superAdmin) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).email().required(),
        password: Joi.string().min(8).max(255).required()
    })
    return schema.validate(superAdmin);
};

// verify email for changing email during edit profile
function validateEmail(req) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
    });
    return schema.validate(req);
}

// edit profile
function validateSuperAdminEdit(req) {
    const schema = Joi.object({
        fullName: Joi.string(),
        address: Joi.string(),
        countryCode: Joi.string(),
        mobile: Joi.string(),
        // email: Joi.string().min(5).max(40).email(),
        productPic: Joi.array().items(Joi.string().allow("")),
        // otpToken: Joi.number()
    });
    return schema.validate(req);
};

//forgot password reset
function validateForgotResetPasswordEmail(req) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        otpToken: Joi.number().required(),
        newPassword: Joi.string().min(8).required().label('Password'),
        confirmPassword: Joi.any().equal(Joi.ref('newPassword')).required().label('Confirm password').options({ messages: { 'any.only': '{{#label}} does not match' } }),
    });
    return schema.validate(req);
};

//change password
function validateChangePassword(req) {
    const schema = Joi.object({
        oldPassword: Joi.string().min(8).required(),
        newPassword: Joi.string().min(8).required(),
    });
    return schema.validate(req);
}

module.exports = {
    SuperAdmin,
    validateSuperAdminLogin,
    validateEmail,
    validateSuperAdminEdit,
    validateForgotResetPasswordEmail,
    validateChangePassword
}

