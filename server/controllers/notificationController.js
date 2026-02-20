const Notification = require('../models/Notification');

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            readStatus: false,
        });

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { readStatus: true },
            { new: true }
        );

        if (!notification) {
            res.status(404);
            return next(new Error('Notification not found'));
        }

        res.json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, readStatus: false },
            { readStatus: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications, markRead, markAllRead };
