const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reportedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
        },
        description: {
            type: String,
            required: [true, 'Complaint description is required'],
            trim: true,
        },
        evidenceUrl: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
