const express = require('express');
const router = express.Router();
const { getMatches, searchBySkill } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMatches);
router.get('/search', protect, searchBySkill);

module.exports = router;
