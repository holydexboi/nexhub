"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const UserSchema = new mongoose.Schema({
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    countryCode: { type: String },
    mobile: { type: String, default: "" },
    profilePic: { type: Array, default: [] },
    password: { type: String, default: "" },
    referralCode: { type: String, default: "" },
    userType: { type: String, enum: ["importer", "exporter"] },
    companyName: { type: String, default: "" },
    storeName: { type: String, default: "" },
    aboutBusiness: { type: String, default: "" },
    typeofProduct: { type: String, default: "" },
    registrationNo: { type: String, default: "" },
    exportLicenseNo: { type: String, default: "" },
    uploadDocPic: { type: Array, default: [] },
    role: { type: String, default: "user" },
    authToken: { type: String, default: "" },
    firebaseToken: { type: String, default: "" },
    authType: { type: String, enum: ["google", "apple", "facebook", "app", "web"], default: "app" },
    termsNconditons: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive", "blocked", "deleted"], default: "active", },
    facebookId: { type: String, default: "" },
    googleId: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    // lastSeen: {
    //     type: Date,
    //     default: () => {
    //         return new Date();
    //     },
    // },

    updatedAt: { type: String, default: "" },
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

const User = mongoose.model("User", UserSchema);

// signup
function validateUserSignup(user) {
    const schema = Joi.object({
        userType: Joi.string().valid("importer", "exporter").required(),
        firstName: Joi.string().min(3).max(50).required(),
        lastName: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().min(5).max(50).required(),
        countryCode: Joi.string().min(1).required(),
        mobile: Joi.string().min(10).max(15).required(),
        password: Joi.string().min(8).max(255).required(),
        confirmPassword: Joi.string().min(8).max(255).required(),
        referralCode: Joi.string().min(4).max(15).allow(""),
        firebaseToken: Joi.string().min(1).max(200).required(),
        termsAndConditions: Joi.boolean().valid(true).required()
    });
    return schema.validate(user);
}

// login
function validateUserLogin(user) {
    const schema = Joi.object({
        userType: Joi.string().valid("importer", "exporter").required(),
        email: Joi.string().min(5).max(50).email().required(),
        password: Joi.string().min(8).max(255).required(),
        firebaseToken: Joi.string().min(1).max(200).allow(""),
    });
    return schema.validate(user);
}

// social signup
function validateUserSocialPost(req) {
    const schema = Joi.object({
        authType: Joi.string().valid("google", "facebook", "apple").required(),
        firstName: Joi.string().min(1).max(100).allow(""),
        mobile: Joi.string(),
        email: Joi.string().allow(""),
        countryCode: Joi.string(),
        profilePic: Joi.string(),
        facebookId: Joi.when("authType", {
            is: "facebook",
            then: Joi.string().min(1).max(255).required(),
            otherwise: Joi.any(),
        }),
        googleId: Joi.when("authType", {
            is: "google",
            then: Joi.string().min(1).max(255).required(),
            otherwise: Joi.any(),
        }),
        appleId: Joi.when("authType", {
            is: "apple",
            then: Joi.string().min(1).max(255).required(),
            otherwise: Joi.any(),
        }),
        location: Joi.array(),
        address: Joi.object({
            currentAddress: Joi.string().required(),
            firstName: Joi.string().allow(""),
            completeAddress: Joi.string(),
            tag: Joi.string().valid("home", "work", "other"),
            zipcode: Joi.string().allow(""),
        }),
        firebaseToken: Joi.string().min(1).max(200).allow(""),

        // deviceType: Joi.string().valid("android", "ios").required(),
        otpToken: Joi.number(),
    });
    let result = schema.validate(req);
    // if (result.error) result.error.details[0].message = valMsgFormatter(result.error.details[0].message);
    return result;
}

// edit profile
function validateUserEdit(req) {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(50),
        lastName: Joi.string().min(3).max(50),
        companyName: Joi.string().min(3).max(50),
        storeName: Joi.string().min(3).max(50),
        aboutBusiness: Joi.string().min(3).max(50),
        typeofProduct: Joi.string(),
        registrationNo: Joi.string().min(3).max(50),
        exportLicenseNo: Joi.string().min(3).max(50),
        uploadDocPic: Joi.array().items(Joi.string().allow("")),
        profilePic: Joi.array().items(Joi.string().allow("")),
        firebaseToken: Joi.string().min(1).max(200).allow(""),                                                              
    });
    return schema.validate(req);
};

// forgot password reset
function validateForgotResetPasswordEmail(req) {
    const schema = Joi.object({
        email: Joi.string().email().min(5).max(50).required(),
        newPassword: Joi.string().min(8).required().label('Password'),
        confirmPassword: Joi.any().equal(Joi.ref('newPassword')).required().label('Confirm password').options({ messages: { 'any.only': '{{#label}} does not match' } }),
    });
    return schema.validate(req);
};

function validateForgotResetPasswordToken(req) {
    const schema = Joi.object({
        email: Joi.string().email().min(5).max(50).required(),
        otpToken: Joi.string().required(),
    });
    return schema.validate(req);
};

function validateGetLocation(req) {
    const schema = Joi.object({
        lat: Joi.string().required(),
        long: Joi.string().required(),
    });
    return schema.validate(req);
};

//change password
function validateChangePassword(req) {
    const schema = Joi.object({
        oldPassword: Joi.string().min(8).required(),
        newPassword: Joi.string().min(8).required(),
        confirmPassword: Joi.any().equal(Joi.ref('newPassword')).required().label('Confirm password').options({ messages: { 'any.only': '{{#label}} does not match' } }),
    });
    return schema.validate(req);
}


module.exports = {
    User,
    validateUserSignup,
    validateUserLogin,
    validateUserEdit,
    validateUserSocialPost,
    validateForgotResetPasswordEmail,
    validateChangePassword,
    validateForgotResetPasswordToken,
    validateGetLocation
}