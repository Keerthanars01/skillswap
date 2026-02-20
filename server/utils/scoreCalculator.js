const Session = require('../models/Session');
const User = require('../models/User');

/**
 * Recalculates and saves the reliability score for a user.
 * Score = 50 + (completed * 5) - (noShows * 10), clamped to [0, 100].
 */
const updateReliabilityScore = async (userId) => {
    const sessions = await Session.find({
        $or: [{ teacherId: userId }, { learnerId: userId }],
    });

    const total = sessions.length;
    if (total === 0) return 50;

    const completed = sessions.filter(
        (s) => s.completionStatus === 'completed'
    ).length;

    const noShows = sessions.filter(
        (s) =>
            s.completionStatus === 'no-show' &&
            (s.teacherId.toString() === userId.toString() ||
                s.learnerId.toString() === userId.toString())
    ).length;

    const score = Math.min(100, Math.max(0, 50 + completed * 5 - noShows * 10));

    await User.findByIdAndUpdate(userId, { reliabilityScore: score });
    return score;
};

module.exports = { updateReliabilityScore };
