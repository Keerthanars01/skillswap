const Session = require('../models/Session');
const Request = require('../models/Request');
const User = require('../models/User');
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

        if (request.receiverId.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Only the receiver can schedule the session'));
        }

        // Validate date is in the future
        if (new Date(date) <= new Date()) {
            res.status(400);
            return next(new Error('Session date must be in the future'));
        }

        if (mode === 'online' && (!meetingLink || meetingLink.trim() === '')) {
            res.status(400);
            return next(new Error('Meeting link is required for online sessions'));
        }

        // Prevent duplicate session for same request
        const existing = await Session.findOne({
            requestId,
            completionStatus: { $in: ['pending', 'scheduled'] },
        });
        if (existing) {
            res.status(400);
            return next(new Error('A session is already scheduled for this request'));
        }

        // Sender learns, receiver teaches (based on request)
        const session = await Session.create({
            requestId,
            teacherId: request.receiverId,
            learnerId: request.senderId,
            date,
            duration: duration || 60,
            mode: mode || 'online',
            meetingLink: meetingLink || '',
        });

        await Request.findByIdAndUpdate(requestId, { status: 'scheduled' });

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
        // We want to include sessions that are currently ongoing.
        // Allowing sessions up to 4 hours in the past keeps them visible 
        // until they are explicitly marked completed or cancelled.
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

        const sessions = await Session.find({
            $or: [{ teacherId: req.user._id }, { learnerId: req.user._id }],
            completionStatus: { $in: ['pending', 'scheduled'] },
            date: { $gte: fourHoursAgo },
        })
            .populate('teacherId', 'name avatar')
            .populate('learnerId', 'name avatar')
            .populate('requestId', 'teachSkill learnSkill senderId receiverId')
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
            .populate('requestId', 'teachSkill learnSkill senderId receiverId')
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

            await Request.findByIdAndUpdate(session.requestId, { status: 'completed' });

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

// @desc    Confirm a scheduled session by the sender
// @route   PUT /api/sessions/:id/confirm-schedule
// @access  Private
const confirmSchedule = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id).populate('requestId');
        if (!session) {
            res.status(404);
            return next(new Error('Session not found'));
        }

        if (session.requestId.senderId.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Only the sender can confirm this schedule'));
        }

        session.completionStatus = 'scheduled';
        await session.save();

        await createNotification(
            session.requestId.receiverId,
            `${req.user.name} confirmed the scheduled session`,
            'session'
        );

        res.json({ success: true, session });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel a session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
const cancelSession = async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            res.status(400);
            return next(new Error('Cancellation reason is required'));
        }

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

        if (session.completionStatus !== 'pending' && session.completionStatus !== 'scheduled') {
            res.status(400);
            return next(new Error(`Cannot cancel a session that is already ${session.completionStatus}`));
        }

        session.completionStatus = 'cancelled';
        session.cancellationReason = reason;
        await session.save();

        await Request.findByIdAndUpdate(session.requestId, { status: 'accepted' });

        const otherId = session.teacherId.toString() === req.user._id.toString() ? session.learnerId : session.teacherId;
        await createNotification(
            otherId,
            `${req.user.name} cancelled your session. Reason: ${reason}`,
            'session'
        );

        res.json({ success: true, session });
    } catch (error) {
        next(error);
    }
};

// @desc    Rate a completed session (learner rates teacher)
// @route   POST /api/sessions/:id/rate
// @access  Private
const rateSession = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            res.status(404);
            return next(new Error('Session not found'));
        }

        if (session.completionStatus !== 'completed') {
            res.status(400);
            return next(new Error('Can only rate completed sessions'));
        }

        if (session.learnerId.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Only the learner can rate this session'));
        }

        if (session.isRated) {
            res.status(400);
            return next(new Error('You have already rated this session'));
        }

        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            res.status(400);
            return next(new Error('Please provide a valid rating between 1 and 5'));
        }

        const teacher = await User.findById(session.teacherId);
        if (!teacher) {
            res.status(404);
            return next(new Error('Teacher not found'));
        }

        teacher.reviews.push({
            reviewerId: req.user._id,
            sessionId: session._id,
            rating,
            comment,
        });

        // Calculate new average
        const totalRating = teacher.reviews.reduce((sum, r) => sum + r.rating, 0);
        teacher.averageRating = totalRating / teacher.reviews.length;
        teacher.totalRatings = teacher.reviews.length;

        await teacher.save();

        session.isRated = true;
        await session.save();

        await createNotification(
            teacher._id,
            `${req.user.name} left a ${rating}-star review for your session!`,
            'session'
        );

        res.json({ success: true, teacher });
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
    confirmSchedule,
    cancelSession,
    rateSession,
};
