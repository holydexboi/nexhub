const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema({
    apiId: String,
    method: String,
    statusCode: { type: Number, default: -1 },
    userId: String,
    completeUrl: String,
    url: String,
    baseUrl: String,
    params: Object,
    query: Object,
    body: Object,
    startTimeMilli: {
        type: Number,
        default: () => {
            return new Date();
        },
    },
    endTimeMilli: Number,
    responseTimeMilli: { type: Number, default: -1 },
    errorMessage: String,
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

apiLogSchema.index({ creationDate: 1 }, { expireAfterSeconds: 90 * 86400 }); // Delete log after 90 days.

const ApiLog = mongoose.model("apiLog", apiLogSchema);

module.exports.ApiLog = ApiLog;
