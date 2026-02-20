const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Generate JWT
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            return next(new Error('User already exists with that email'));
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                location: user.location,
                avatar: user.avatar,
                availability: user.availability,
                skillsTeach: user.skillsTeach,
                skillsLearn: user.skillsLearn,
                reliabilityScore: user.reliabilityScore,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            res.status(401);
            return next(new Error('Invalid email or password'));
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                location: user.location,
                avatar: user.avatar,
                availability: user.availability,
                skillsTeach: user.skillsTeach,
                skillsLearn: user.skillsLearn,
                reliabilityScore: user.reliabilityScore,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};

// @desc    Update profile (bio, location, availability)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { name, bio, location, availability } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, bio, location, availability },
            { new: true, runValidators: true }
        );

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload avatar to Cloudinary
// @route   PUT /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            return next(new Error('Please upload an image file'));
        }

        // Delete old avatar from Cloudinary if it exists
        if (req.user.avatar && req.user.avatar.public_id) {
            await cloudinary.uploader.destroy(req.user.avatar.public_id);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                avatar: {
                    url: req.file.path,
                    public_id: req.file.filename,
                },
            },
            { new: true }
        );

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');
        if (!(await user.matchPassword(currentPassword))) {
            res.status(401);
            return next(new Error('Current password is incorrect'));
        }

        user.password = newPassword;
        await user.save(); // triggers pre-save hash

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, updateProfile, uploadAvatar, changePassword };
