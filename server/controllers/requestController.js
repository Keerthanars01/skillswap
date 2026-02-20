const Request = require('../models/Request');
const { createNotification } = require('../utils/notify');

// @desc    Send an exchange request
// @route   POST /api/requests
// @access  Private
const sendRequest = async (req, res, next) => {
    try {
        const { receiverId, teachSkill, learnSkill, message, proposedDuration } = req.body;

        if (receiverId === req.user._id.toString()) {
            res.status(400);
            return next(new Error('You cannot send a request to yourself'));
        }

        // Check for existing pending request between these two users
        const existing = await Request.findOne({
            senderId: req.user._id,
            receiverId,
            status: 'pending',
        });
        if (existing) {
            res.status(400);
            return next(new Error('You already have a pending request with this user'));
        }

        const request = await Request.create({
            senderId: req.user._id,
            receiverId,
            teachSkill,
            learnSkill,
            message,
            proposedDuration,
        });

        await createNotification(
            receiverId,
            `${req.user.name} sent you a skill exchange request`,
            'request'
        );

        res.status(201).json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

// @desc    Get requests sent by logged-in user
// @route   GET /api/requests/sent
// @access  Private
const getSentRequests = async (req, res, next) => {
    try {
        const requests = await Request.find({ senderId: req.user._id })
            .populate('receiverId', 'name avatar reliabilityScore skillsTeach skillsLearn')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

// @desc    Get requests received by logged-in user
// @route   GET /api/requests/received
// @access  Private
const getReceivedRequests = async (req, res, next) => {
    try {
        const requests = await Request.find({ receiverId: req.user._id })
            .populate('senderId', 'name avatar reliabilityScore skillsTeach skillsLearn')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept a request
// @route   PUT /api/requests/:id/accept
// @access  Private
const acceptRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }
        if (request.receiverId.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to accept this request'));
        }
        if (request.status !== 'pending') {
            res.status(400);
            return next(new Error('This request is no longer pending'));
        }

        request.status = 'accepted';
        await request.save();

        await createNotification(
            request.senderId,
            `${req.user.name} accepted your skill exchange request!`,
            'request'
        );

        res.json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject a request
// @route   PUT /api/requests/:id/reject
// @access  Private
const rejectRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }
        if (request.receiverId.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to reject this request'));
        }
        if (request.status !== 'pending') {
            res.status(400);
            return next(new Error('This request is no longer pending'));
        }

        request.status = 'rejected';
        await request.save();

        await createNotification(
            request.senderId,
            `${req.user.name} declined your skill exchange request`,
            'request'
        );

        res.json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel a pending request (sender only)
// @route   DELETE /api/requests/:id
// @access  Private
const cancelRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }
        if (request.senderId.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Only the sender can cancel a request'));
        }
        if (request.status !== 'pending') {
            res.status(400);
            return next(new Error('Only pending requests can be cancelled'));
        }

        request.status = 'cancelled';
        await request.save();

        res.json({ success: true, message: 'Request cancelled' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendRequest,
    getSentRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
};
