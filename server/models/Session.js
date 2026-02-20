const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        learnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: { type: Date, required: [true, 'Session date is required'] },
        duration: { type: Number, default: 60 }, // in minutes
        mode: {
            type: String,
            enum: ['online', 'offline'],
            default: 'online',
        },
        meetingLink: { type: String, default: '' },
        completionStatus: {
            type: String,
            enum: ['scheduled', 'completed', 'no-show', 'cancelled'],
            default: 'scheduled',
        },
        teacherConfirmed: { type: Boolean, default: false },
        learnerConfirmed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
