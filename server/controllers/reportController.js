const Report = require('../models/Report');
const Session = require('../models/Session');
const User = require('../models/User');

// @desc    Submit a new report against a user
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res, next) => {
    try {
        const { reportedUserId, sessionId, description } = req.body;

        if (!reportedUserId || !description) {
            res.status(400);
            return next(new Error('Reported user and description are required'));
        }

        if (reportedUserId === req.user._id.toString()) {
            res.status(400);
            return next(new Error('You cannot report yourself'));
        }

        if (sessionId) {
            const existingReport = await Report.findOne({
                reporterId: req.user._id,
                sessionId,
                status: 'pending',
            });
            if (existingReport) {
                res.status(400);
                return next(new Error('You already have a pending report for this session'));
            }
        }

        const evidenceUrl = req.file ? req.file.path : '';

        const report = await Report.create({
            reporterId: req.user._id,
            reportedUserId,
            sessionId: sessionId || null,
            description,
            evidenceUrl,
        });

        res.status(201).json({ success: true, report });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
const getReports = async (req, res, next) => {
    try {
        // Here you would normally verify req.user.isAdmin
        // For now, we will just return them assuming route protection handles auth
        const reports = await Report.find()
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email')
            .sort('-createdAt');

        res.json({ success: true, count: reports.length, reports });
    } catch (error) {
        next(error);
    }
};

module.exports = { createReport, getReports };
