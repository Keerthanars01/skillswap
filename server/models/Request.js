const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        teachSkill: {
            type: String,
            required: [true, 'Please specify the skill you will teach'],
            trim: true,
        },
        learnSkill: {
            type: String,
            required: [true, 'Please specify the skill you want to learn'],
            trim: true,
        },
        message: { type: String, default: '', trim: true },
        proposedDuration: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
