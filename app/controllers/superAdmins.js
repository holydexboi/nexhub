"use strict"
const { AUTH_CONSTANTS, USER_CONSTANTS, OTP_CONSTANTS } = require("../../config/constant");
const { SuperAdmin, validateSuperAdminLogin, validateEmail, validateSuperAdminEdit, validateForgotResetPasswordEmail, validateChangePassword } = require("../models/superAdmin");
const { SuperAdmin, validateSuperAdminLogin, validateEmail, validateSuperAdminEdit, validateForgotResetPasswordEmail, validateChangePassword } = require("../model");
const { verifyAndDeleteToken } = require("../models/otp");
const { compareHash, generateHash } = require("../services/bcrypt.js");
const { generateToken } = require("../services/jwtToken.js");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const uploadDirect = multer({ storage: storage });
const { uploadFiles } = require("../services/awsService");
const _ = require("lodash");
const express = require("express");
const router = express.Router();


// login
router.post("/login", async (req, res) => {
    const { error } = validateSuperAdminLogin(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let email;
    if (req.body.email) email = req.body.email.toLowerCase();

    let superAdmin = await SuperAdmin.findOne({ email: email });
    if (!superAdmin) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NOT_FOUND
    });

    const validPassword = compareHash(req.body.password, superAdmin.password);
    if (!validPassword) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_PASSWORD,
    });
    const authToken = generateToken(superAdmin._id, superAdmin.email, superAdmin.role);
    superAdmin.authToken = authToken;
    await superAdmin.save();
    superAdmin.status = "active";

    let response = _.pick(superAdmin, [
        "_id",
        "email",
        "countryCode",
        "mobile",
        "role",
        "fullName",
        "address",
        "profilePic",
        "createdAt",
        "updatetdAt",
        "status"
    ]);
    res.header("Authorization", authToken).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.LOGIN_SUCCESS,
        data: response,
        authToken
    });
});

// view profile
router.get("/view/profile", authMiddleware(["superAdmin"]), async (req, res) => {
    let userId;
    if (req.jwtData.role === "superAdmin") userId = req.jwtData._id;

    let superAdmin = await SuperAdmin.findById(userId);
    if (!superAdmin) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_USER
    });

    superAdmin.userId = superAdmin._id;

    let response = _.pick(superAdmin, [
        "userId",
        "role",
        "profilePic",
        "fullName",
        "address",
        "email",
        "countryCode",
        "mobile",
        "status",
        "createdAt",
        "updatedAt"
    ]);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.VIEW_PROFILE_SUCCESS,
        data: response
    });
});

// verify email if super admin wants to change its email during edit profile
router.post("/verify/email", async (req, res) => {
    const { error } = validateEmail(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let criteria = {};
    let email = req.body.email.toLowerCase();
    if (req.body.email) criteria.email = email;

    let user = await SuperAdmin.findOne(criteria);
    if (user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.EMAIL_ALREADY_EXISTS
    });
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.VERIFICATION_EMAIL_SUCCESS
    });
});

// edit profile
router.put("/edit/profile", authMiddleware(["superAdmin"]), (req, res, next) => {
    uploadDirect.fields([{ name: 'profilePic', maxCount: 1 }])(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
            err.message = 'Maximum 1 image file is allowed.';
            if (err) return res.status(400).send({
                apiId: req.apiId,
                statusCode: 400,
                success: false,
                message: err.message
            });
        }
        next();
    });
}, async (req, res) => {
    const { error } = validateSuperAdminEdit(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let userId;
    if (req.jwtData.role === "superAdmin") userId = req.jwtData._id;
    let superAdmin = await SuperAdmin.findById(userId);
    if (!superAdmin) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_USER
    });

    let profilePicUrl = [];
    if (req.files) {
        profilePicUrl = await uploadFiles(req.files, 'profilePic', 'images');
    }

    superAdmin.profilePic = profilePicUrl || superAdmin.profilePic;

    superAdmin.updatedAt = +new Date();
    superAdmin.fullName = req.body.fullName || superAdmin.fullName;
    superAdmin.address = req.body.address || superAdmin.address;
    superAdmin.countryCode = req.body.countryCode || superAdmin.countryCode;
    superAdmin.mobile = req.body.mobile || superAdmin.mobile;

    // if (req.body.email && req.body.email != req.userData.email) {
    //     superAdmin = await SuperAdmin.findOne({ email: req.body.email });
    //     if (superAdmin) return res.status(400).send({
    //         apiId: req.apiId,
    //         statusCode: 400,
    //         success: false,
    //         message: USER_CONSTANTS.EMAIL_ALREADY_EXISTS
    //     });

    //     if (req.body.otpToken) {
    //         let isValid = await verifyAndDeleteToken(req.body.email, req.body.otpToken, "SAU");
    //         if (!isValid) return res.status(400).send({
    //             apiId: req.apiId,
    //             statusCode: 400,
    //             success: false,
    //             message: OTP_CONSTANTS.INVALID_OTP
    //         });
    //     } else {
    //         return res.status(400).send({
    //             apiId: req.apiId,
    //             statusCode: 400,
    //             success: false,
    //             message: OTP_CONSTANTS.PLEASE_VERIFY
    //         });
    //     }
    //     superAdmin.email = req.body.email.toLowerCase();
    // }

    await superAdmin.save();

    let response = _.pick(superAdmin, [
        "_id",
        "email",
        "countryCode",
        "mobile",
        "status",
        "role",
        "fullName",
        "address",
        "profilePic",
        "createdAt",
        "updatetdAt"
    ]);
    res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.EDIT_PROFILE_SUCCESS,
        data: response
    });
});

// forgot password
router.post("/forgot/password", async (req, res) => {
    const { error } = validateForgotResetPasswordEmail(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let superAdmin = await SuperAdmin.findOne({ email: req.body.email.toLowerCase() });
    if (!superAdmin) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NO_USER_FOUND_EMAIL
    });

    let isValid = await verifyAndDeleteToken(req.body.email, req.body.otpToken, "SAFP");
    if (!isValid) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: OTP_CONSTANTS.INVALID_OTP
    });

    var encryptPassword = generateHash(req.body.newPassword);
    superAdmin.password = encryptPassword;
    await superAdmin.save();
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.PASSWORD_RESET_SUCCESS
    });
});

//change password
router.post("/change/password", authMiddleware(["superAdmin"]), async (req, res) => {
    const { error } = validateChangePassword(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let user = await SuperAdmin.findById(req.jwtData._id);
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NOT_FOUND
    });

    const validPassword = compareHash(req.body.oldPassword, user.password);
    if (!validPassword) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.INVALID_OLD_PASSWORD
    });

    let encryptPassword = generateHash(req.body.newPassword);
    user.password = encryptPassword;

    await user.save();
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.PASSWORD_CHANGE_SUCCESS
    });
});

// logout
router.post("/logout", authMiddleware(["superAdmin"]), async (req, res) => {
    let userId;
    if (req.jwtData.role === "superAdmin") userId = req.jwtData._id;
    let superAdmin = await SuperAdmin.findById(userId);
    if (!superAdmin) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_USER
    });

    superAdmin.authToken = "";
    superAdmin.save();
    return res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.LOGOUT_SUCCESSFULLY
    });
});

router.get("/dashboard", authMiddleware(["superAdmin"]), async (req, res) => {
    

    let totalCount = await User.countDocuments({});
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.,
        data: totalCount
    });
});


module.exports = router;
