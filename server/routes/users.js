const express = require('express');
const router = express.Router();
const {
    getUserById,
    addTeachSkill,
    addLearnSkill,
    removeSkill,
    updateSkill,
    exploreUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/explore', protect, exploreUsers);
router.get('/:id', protect, getUserById);
router.put('/skills/teach', protect, addTeachSkill);
router.put('/skills/learn', protect, addLearnSkill);
router.delete('/skills/:type/:skillId', protect, removeSkill);
router.put('/skills/:type/:skillId', protect, updateSkill);

module.exports = router;
