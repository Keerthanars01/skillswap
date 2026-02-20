const User = require('../models/User');

// @desc    Get auto-matched users for the logged-in user
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res, next) => {
    try {
        const currentUser = await User.findById(req.user._id);

        const teachNames = currentUser.skillsTeach.map((s) => s.name);
        const learnNames = currentUser.skillsLearn.map((s) => s.name);

        if (teachNames.length === 0 && learnNames.length === 0) {
            return res.json({
                success: true,
                matches: [],
                message: 'Add skills to your teach and learn lists to see matches',
            });
        }

        // Find users where:
        // THEIR teach list has something from MY learn list
        // AND THEIR learn list has something from MY teach list
        const matchQuery = { _id: { $ne: req.user._id } };
        if (learnNames.length > 0) matchQuery['skillsTeach.name'] = { $in: learnNames };
        if (teachNames.length > 0) matchQuery['skillsLearn.name'] = { $in: teachNames };

        const candidates = await User.find(matchQuery).select('-password');

        // Score each match
        const scored = candidates.map((user) => {
            const teachOverlap = user.skillsTeach.filter((s) =>
                learnNames.map((n) => n.toLowerCase()).includes(s.name.toLowerCase())
            ).length;
            const learnOverlap = user.skillsLearn.filter((s) =>
                teachNames.map((n) => n.toLowerCase()).includes(s.name.toLowerCase())
            ).length;

            // Which of my learn skills they can teach
            const theyTeach = user.skillsTeach.filter((s) =>
                learnNames.map((n) => n.toLowerCase()).includes(s.name.toLowerCase())
            );
            // Which of my teach skills they want to learn
            const theyLearn = user.skillsLearn.filter((s) =>
                teachNames.map((n) => n.toLowerCase()).includes(s.name.toLowerCase())
            );

            return {
                user,
                matchScore: teachOverlap + learnOverlap,
                reliabilityScore: user.reliabilityScore,
                theyTeach,
                theyLearn,
            };
        });

        // Sort by matchScore desc, then reliabilityScore desc
        scored.sort(
            (a, b) =>
                b.matchScore - a.matchScore || b.reliabilityScore - a.reliabilityScore
        );

        res.json({ success: true, matches: scored });
    } catch (error) {
        next(error);
    }
};

// @desc    Search users by skill name and level
// @route   GET /api/matches/search?skill=HTML&level=Beginner
// @access  Private
const searchBySkill = async (req, res, next) => {
    try {
        const { skill, level } = req.query;

        if (!skill) {
            res.status(400);
            return next(new Error('Please provide a skill name to search'));
        }

        const query = {
            _id: { $ne: req.user._id },
            'skillsTeach.name': { $regex: skill, $options: 'i' },
        };

        if (level) {
            query['skillsTeach.level'] = level;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ reliabilityScore: -1 });

        res.json({ success: true, users });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMatches, searchBySkill };
