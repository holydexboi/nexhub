'use strict';
require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const { URL } = require('url');


const s3Client = new S3Client({
    region: process.env.AWS_S3_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY,
    },
});

const myBucket = process.env.AWS_S3_BUCKET_NAME;

const FileUrl = "https://" + process.env.AWS_S3_BUCKET_NAME + ".s3." + process.env.AWS_S3_BUCKET_REGION + ".amazonaws.com/";

// Function to handle single as well as multiple file upload in single field or different fields in array to S#
const uploadDirectFileS3 = async (files, folderName) => {
    const uploadPromises = [];

    for (const fileData of files) {
        if (fileData && fileData.originalname) {
            const dateString = Date.now();
            const regex = /[^a-zA-Z0-9.]/g;
            const key = `${dateString}_${fileData.originalname.replace(regex, "_")}`;

            const params = {
                Bucket: myBucket,
                Key: folderName + '/' + key,
                Body: Buffer.from(fileData.buffer, 'base64'), // Convert base64 data to a buffer
                ContentType: fileData.mimetype,
            };

            console.log('Params before AWS SDK call: ', params);

            const command = new PutObjectCommand(params);

            const uploadPromise = new Promise(async (resolve, reject) => {
                try {
                    const s3Response = await s3Client.send(command);
                    resolve(s3Response);
                } catch (err) {
                    console.error('Error uploading file:', err);
                    reject(new Error('File upload failed'));
                }
            });

            uploadPromises.push(uploadPromise);
        } else {
            console.error('Invalid file data:', fileData);
        }
    }

    try {
        const uploadResults = await Promise.all(uploadPromises);
        return uploadResults;
    } catch (error) {
        throw new Error('Some file uploads failed');
    }
};

// validations for image files only
// const validateMimeType = (mimeType) => {
//     const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
//     return allowedImageTypes.includes(mimeType);
// };

// function to handle single as well as multiple file upload in single field or different fields in array and getting URLs in return
const uploadFiles = async (files, field, folderName) => {
    if (files && files[field] && files[field].length > 0) {
        const uploadedFiles = [];

        for (const fileData of files[field]) {
            const dateString = Date.now();
            const regex = /[^a-zA-Z0-9.]/g;
            // const fileData = files[field][0];
            const key = `${dateString}_${fileData.originalname.replace(regex, "_")}`;
            const fileUrl = `${FileUrl}images/${key}`;

            // if (!validateMimeType(fileData.mimetype)) {
            //     // console.error(`Invalid MIME type for ${field}`);
            //     throw new Error('Invalid file format');
            // }

            try {
                await uploadDirectFileS3(key, folderName, fileData.buffer, fileData.mimetype);
                uploadedFiles.push(fileUrl);
            } catch (ex) {
                console.error(`Error uploading ${field}: ${ex.message}`);
            }
        }
        return uploadedFiles;
    }

    return null;
};


const s3ExcelToJson = async (url) => {
    try {
        const parsedUrl = new URL(url);
        const keyName = decodeURIComponent(parsedUrl.pathname.slice(1)); // Extract key from the pathname

        const params = {
            Bucket: myBucket,
            Key: keyName,
        };

        const excelFile = await s3Client.send(new GetObjectCommand(params));

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(excelFile.Body);

        const worksheet = workbook.worksheets[0]; // Assuming the data is in the first worksheet
        const headers = worksheet.getRow(1).values;

        const response = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const rowData = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    rowData[headers[colNumber - 1]] = cell.value;
                });
                response.push(rowData);
            }
        });

        return { response, statusCode: 200 };
    } catch (err) {
        console.error('Error reading Excel file:', err);
        return { error: 'Error reading Excel file', statusCode: 400 };
    }
};

module.exports = {
    s3Client,
    uploadDirectFileS3,
    uploadFiles,
    s3ExcelToJson
};
