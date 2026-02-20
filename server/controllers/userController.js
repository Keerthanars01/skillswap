const User = require('../models/User');

// @desc    Get any user's public profile
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select(
            '-password -email'
        );
        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a skill to teach list
// @route   PUT /api/users/skills/teach
// @access  Private
const addTeachSkill = async (req, res, next) => {
    try {
        const { name, level, description } = req.body;
        const user = await User.findById(req.user._id);

        // Prevent duplicate skill names
        const exists = user.skillsTeach.some(
            (s) => s.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            res.status(400);
            return next(new Error('You already have this skill in your teach list'));
        }

        user.skillsTeach.push({ name, level, description });
        await user.save();

        res.json({ success: true, skillsTeach: user.skillsTeach });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a skill to learn list
// @route   PUT /api/users/skills/learn
// @access  Private
const addLearnSkill = async (req, res, next) => {
    try {
        const { name, level, description } = req.body;
        const user = await User.findById(req.user._id);

        const exists = user.skillsLearn.some(
            (s) => s.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            res.status(400);
            return next(new Error('You already have this skill in your learn list'));
        }

        user.skillsLearn.push({ name, level, description });
        await user.save();

        res.json({ success: true, skillsLearn: user.skillsLearn });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a skill from teach or learn list
// @route   DELETE /api/users/skills/:type/:skillId
// @access  Private
const removeSkill = async (req, res, next) => {
    try {
        const { type, skillId } = req.params; // type = 'teach' | 'learn'
        const user = await User.findById(req.user._id);

        if (type === 'teach') {
            user.skillsTeach = user.skillsTeach.filter(
                (s) => s._id.toString() !== skillId
            );
        } else if (type === 'learn') {
            user.skillsLearn = user.skillsLearn.filter(
                (s) => s._id.toString() !== skillId
            );
        } else {
            res.status(400);
            return next(new Error('Type must be "teach" or "learn"'));
        }

        await user.save();
        res.json({ success: true, message: 'Skill removed', user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update an existing skill
// @route   PUT /api/users/skills/:type/:skillId
// @access  Private
const updateSkill = async (req, res, next) => {
    try {
        const { type, skillId } = req.params;
        const { name, level, description } = req.body;
        const user = await User.findById(req.user._id);

        const list = type === 'teach' ? user.skillsTeach : user.skillsLearn;
        const skill = list.id(skillId);
        if (!skill) {
            res.status(404);
            return next(new Error('Skill not found'));
        }

        if (name) skill.name = name;
        if (level) skill.level = level;
        if (description !== undefined) skill.description = description;

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Explore / search all users by skill
// @route   GET /api/users/explore?skill=HTML&level=Beginner&page=1
// @access  Private
const exploreUsers = async (req, res, next) => {
    try {
        const { skill, level, page = 1, limit = 12 } = req.query;

        const query = { _id: { $ne: req.user._id } };

        if (skill) {
            query.$or = [
                { 'skillsTeach.name': { $regex: skill, $options: 'i' } },
                { 'skillsLearn.name': { $regex: skill, $options: 'i' } },
            ];
        }

        if (level) {
            query.$or = [
                { 'skillsTeach.level': level },
                { 'skillsLearn.level': level },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password -email')
            .sort({ reliabilityScore: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            users,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserById,
    addTeachSkill,
    addLearnSkill,
    removeSkill,
    updateSkill,
    exploreUsers,
};
