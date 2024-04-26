"use strict"
const mongoose = require("mongoose");
const Joi = require("joi");

const contractSchema = new mongoose.Schema({
    orderId: { type: String, default: "" },
    date: String, // dd/mm/yyyy
    address: String,
    exporterName: String,
    exporterOrgName: String,
    productPic: { type: Array, default: [] },
    productCategoryId: String,
    productName: String,
    quantity: Number,
    countryOfOrigin: String,
    specifications: String,
    adMixture: String,
    productColor: String,
    mucor: String,
    deliveryDate: String,
    destinationPort: String,
    paymentTerms: String,
    price: String,
    serviceRequests: { type: String, default: "" },
    otherRequests: { type: String, default: "" },
    followUpsAvailability: { type: String, default: "" },
    previousCustomer: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected", "completed", "in-progress"], default: "pending" },
    orderStatus: { type: String, enum: ["pending inspection", "on transit", "at port of shipment", "completed"], default: "" },
    contractApprovedDate: {type: Date},
    contractConfirmedDate: {type: Date},
    processToSpecDate: {type: Date},
    exportDocumentUploadDate: {type: Date},
    consignmentPortDate: {type: Date},
    consignmentDestinationDate: {type: Date},
    isContractApproved: { type: Boolean, default: false },
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

const Contract = mongoose.model("Contract", contractSchema);

// Joi validations for Contract

// create Contract
function validateContractCreate(req) {
    const schema = Joi.object({
        date: Joi.string().pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid date format. Use dd/mm/yyyy.',
            }).required(),
        address: Joi.string().min(2).max(100).required(),
        exporterName: Joi.string().min(2).max(100).required(),
        exporterOrgName: Joi.string().min(2).max(100).required(),
        productPic: Joi.array().items(Joi.string().allow("")),
        productCategoryId: Joi.string().min(2).max(100).required(),
        productName: Joi.string().min(2).max(100).required(),
        quantity: Joi.number().min(1).required(),
        countryOfOrigin: Joi.string().min(2).max(100).required(),
        specifications: Joi.string().min(2).max(100).required(),
        adMixture: Joi.string().min(2).max(100).required(),
        productColor: Joi.string().min(2).max(100).required(),
        mucor: Joi.string().min(2).max(100).required(),
        deliveryDate: Joi.string().pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid date format. Use dd/mm/yyyy.',
            }).required(),
        destinationPort: Joi.string().min(2).max(100).required(),
        paymentTerms: Joi.string().min(2).max(100).required(),
        price: Joi.string().min(1).max(100).required(),
        serviceRequests: Joi.string().min(2).max(100).allow(""),
        otherRequests: Joi.string().min(2).max(100).allow(""),
        followUpsAvailability: Joi.string().min(2).max(100).allow(""),
        previousCustomer: Joi.string().min(2).max(100).allow(""),
    })
    return schema.validate(req);
};

// edit Contract
// function validateContractEdit(req) {
//     const schema = Joi.object({
//         ContractId: Joi.string().min(2).max(255).required(),
//         date: Joi.string().min(2).max(255),
//         address: Joi.string().min(2).max(100),
//         exporterName: Joi.string().min(2).max(100),
//         exporterOrgName: Joi.string().min(2).max(100),
// productPic: Joi.array().items(Joi.string().allow("")),
// productCategoryId: Joi.string().min(2).max(100),
//         productName: Joi.string().min(2).max(100),
//         quantity: Joi.number().min(1).max(20),
//         countryOfOrigin: Joi.string().min(2).max(100),
//         specifications: Joi.string().min(2).max(100),
//         adMixture: Joi.string().min(2).max(100),
//         productColor: Joi.string().min(2).max(100),
//         mucor: Joi.string().min(2).max(100),
//         deliveryDate: Joi.string().min(2).max(100),
//         destinationPort: Joi.string().min(2).max(100),
//         paymentTerms: Joi.string().min(2).max(100),
//         price: Joi.string().min(1).max(100),
//         serviceRequests: Joi.string().min(2).max(100).allow(""),
//         otherRequests: Joi.string().min(2).max(100).allow(""),
//         followUpsAvailability: Joi.string().min(2).max(100).allow(""),
//         previousCustomer: Joi.string().min(2).max(100).allow(""),
//     });
//     return schema.validate(req);
// };

// approve/reject contract request
function validateContractRequest(req) {
    const schema = Joi.object({
        contractId: Joi.string().required(),
        status: Joi.string().valid("approved", "rejected").required(),
        // rejectionReason: Joi.when("applicationStatus", {
        //     is: "rejected",
        //     then: Joi.string().required(),
        //     otherwise: Joi.string(),
        // }),
    });
    return schema.validate(req);
}

module.exports = {
    Contract,
    validateContractCreate,
    // validateContractEdit,
    validateContractRequest
}

