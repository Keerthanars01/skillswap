const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const skillSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
    },
    description: { type: String, trim: true },
});

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'], trim: true },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false, // never returned in queries by default
        },
        bio: { type: String, default: '', trim: true },
        location: { type: String, default: '', trim: true },
        avatar: {
            url: { type: String, default: '' },
            public_id: { type: String, default: '' },
        },
        availability: { type: String, default: '', trim: true },
        skillsTeach: [skillSchema],
        skillsLearn: [skillSchema],
        reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
    },
    { timestamps: true }
);

// Hash password before saving
// NOTE: Mongoose v9 async pre-hooks do NOT receive a `next` callback.
// Simply return early or let the async function resolve — Mongoose handles it.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
