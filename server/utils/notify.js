const Notification = require('../models/Notification');

/**
 * Creates a notification for a user.
 * @param {string} userId - The recipient user's ID
 * @param {string} message - Notification message text
 * @param {string} type - 'match' | 'request' | 'session' | 'reminder'
 */
const createNotification = async (userId, message, type = 'request') => {
    try {
        await Notification.create({ userId, message, type, readStatus: false });
    } catch (error) {
        // Non-critical — log but don't crash the request
        console.error('Failed to create notification:', error.message);
    }
};

module.exports = { createNotification };
