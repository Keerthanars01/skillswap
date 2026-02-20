const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    uploadAvatar,
    changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/password', protect, changePassword);

module.exports = router;
