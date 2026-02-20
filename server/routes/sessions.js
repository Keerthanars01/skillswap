const express = require('express');
const router = express.Router();
const {
    scheduleSession,
    getUpcomingSessions,
    getSessionHistory,
    confirmSession,
    markNoShow,
    rescheduleSession,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, scheduleSession);
router.get('/upcoming', protect, getUpcomingSessions);
router.get('/history', protect, getSessionHistory);
router.put('/:id/confirm', protect, confirmSession);
router.put('/:id/noshow', protect, markNoShow);
router.put('/:id/reschedule', protect, rescheduleSession);

module.exports = router;
