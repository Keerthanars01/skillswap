const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'skillswap/reports',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4'],
    },
});

const uploadReportFile = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for evidence
});

module.exports = uploadReportFile;
