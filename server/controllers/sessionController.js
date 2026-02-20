const Session = require('../models/Session');
const Request = require('../models/Request');
const { updateReliabilityScore } = require('../utils/scoreCalculator');
const { createNotification } = require('../utils/notify');

// @desc    Schedule a session (request must be accepted)
// @route   POST /api/sessions
// @access  Private
const scheduleSession = async (req, res, next) => {
    try {
        const { requestId, date, duration, mode, meetingLink } = req.body;

        const request = await Request.findById(requestId);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }
        if (request.status !== 'accepted') {
            res.status(400);
            return next(new Error('Request must be accepted before scheduling a session'));
        }

        // Ensure user is part of this request
        const isParticipant =
            request.senderId.toString() === req.user._id.toString() ||
            request.receiverId.toString() === req.user._id.toString();
        if (!isParticipant) {
            res.status(403);
            return next(new Error('Not authorized'));
        }

        // Validate date is in the future
        if (new Date(date) <= new Date()) {
            res.status(400);
            return next(new Error('Session date must be in the future'));
        }

        // Prevent duplicate session for same request
        const existing = await Session.findOne({
            requestId,
            completionStatus: 'scheduled',
        });
        if (existing) {
            res.status(400);
            return next(new Error('A session is already scheduled for this request'));
        }

        // Sender teaches, receiver learns (based on request)
        const session = await Session.create({
            requestId,
            teacherId: request.senderId,
            learnerId: request.receiverId,
            date,
            duration: duration || 60,
            mode: mode || 'online',
            meetingLink: meetingLink || '',
        });

        const otherId =
            request.senderId.toString() === req.user._id.toString()
                ? request.receiverId
                : request.senderId;

        await createNotification(
            otherId,
            `${req.user.name} scheduled a session for ${new Date(date).toLocaleDateString()}`,
            'session'
        );

        res.status(201).json({ success: true, session });
    } catch (error) {
        next(error);
    }
};

// @desc    Get upcoming sessions for logged-in user
// @route   GET /api/sessions/upcoming
// @access  Private
const getUpcomingSessions = async (req, res, next) => {
    try {
        const sessions = await Session.find({
            $or: [{ teacherId: req.user._id }, { learnerId: req.user._id }],
            completionStatus: 'scheduled',
            date: { $gte: new Date() },
        })
            .populate('teacherId', 'name avatar')
            .populate('learnerId', 'name avatar')
            .populate('requestId', 'teachSkill learnSkill')
            .sort({ date: 1 });

        res.json({ success: true, sessions });
    } catch (error) {
        next(error);
    }
};

// @desc    Get session history for logged-in user
// @route   GET /api/sessions/history
// @access  Private
const getSessionHistory = async (req, res, next) => {
    try {
        const sessions = await Session.find({
            $or: [{ teacherId: req.user._id }, { learnerId: req.user._id }],
            completionStatus: { $in: ['completed', 'no-show', 'cancelled'] },
        })
            .populate('teacherId', 'name avatar')
            .populate('learnerId', 'name avatar')
            .populate('requestId', 'teachSkill learnSkill')
            .sort({ date: -1 });

        res.json({ success: true, sessions });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm session completed (dual confirmation)
// @route   PUT /api/sessions/:id/confirm
// @access  Private
const confirmSession = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            res.status(404);
            return next(new Error('Session not found'));
        }

        const isTeacher = session.teacherId.toString() === req.user._id.toString();
        const isLearner = session.learnerId.toString() === req.user._id.toString();

        if (!isTeacher && !isLearner) {
            res.status(403);
            return next(new Error('Not authorized'));
        }

        if (isTeacher) session.teacherConfirmed = true;
        if (isLearner) session.learnerConfirmed = true;

        // Both confirmed → mark completed and update scores
        if (session.teacherConfirmed && session.learnerConfirmed) {
            session.completionStatus = 'completed';
            await session.save();

            await updateReliabilityScore(session.teacherId);
            await updateReliabilityScore(session.learnerId);

            await createNotification(
                isTeacher ? session.learnerId : session.teacherId,
                `${req.user.name} confirmed the session as completed`,
                'session'
            );
        } else {
            await session.save();
        }

        res.json({ success: true, session });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark session as no-show
// @route   PUT /api/sessions/:id/noshow
// @access  Private
const markNoShow = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            res.status(404);
            return next(new Error('Session not found'));
        }

        const isParticipant =
            session.teacherId.toString() === req.user._id.toString() ||
            session.learnerId.toString() === req.user._id.toString();
        if (!isParticipant) {
            res.status(403);
            return next(new Error('Not authorized'));
        }

        session.completionStatus = 'no-show';
        await session.save();

        // Update scores for both participants
        await updateReliabilityScore(session.teacherId);
        await updateReliabilityScore(session.learnerId);

        res.json({ success: true, session });
    } catch (error) {
        next(error);
    }
};

// @desc    Reschedule a session
// @route   PUT /api/sessions/:id/reschedule
// @access  Private
const rescheduleSession = async (req, res, next) => {
    try {
        const { date, duration, mode, meetingLink } = req.body;
        const session = await Session.findById(req.params.id);
        if (!session) {
            res.status(404);
            return next(new Error('Session not found'));
        }

        const isParticipant =
            session.teacherId.toString() === req.user._id.toString() ||
            session.learnerId.toString() === req.user._id.toString();
        if (!isParticipant) {
            res.status(403);
            return next(new Error('Not authorized'));
        }

        if (new Date(date) <= new Date()) {
            res.status(400);
            return next(new Error('New session date must be in the future'));
        }

        session.date = date;
        if (duration) session.duration = duration;
        if (mode) session.mode = mode;
        if (meetingLink !== undefined) session.meetingLink = meetingLink;
        // Reset confirmations on reschedule
        session.teacherConfirmed = false;
        session.learnerConfirmed = false;
        await session.save();

        const otherId =
            session.teacherId.toString() === req.user._id.toString()
                ? session.learnerId
                : session.teacherId;

        await createNotification(
            otherId,
            `${req.user.name} rescheduled your session to ${new Date(date).toLocaleDateString()}`,
            'session'
        );

        res.json({ success: true, session });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    scheduleSession,
    getUpcomingSessions,
    getSessionHistory,
    confirmSession,
    markNoShow,
    rescheduleSession,
};
