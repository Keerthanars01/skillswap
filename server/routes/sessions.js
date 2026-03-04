const express = require('express');
const router = express.Router();
const {
    scheduleSession,
    getUpcomingSessions,
    getSessionHistory,
    confirmSession,
    markNoShow,
    rescheduleSession,
    confirmSchedule,
    cancelSession,
    rateSession,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, scheduleSession);
router.get('/upcoming', protect, getUpcomingSessions);
router.get('/history', protect, getSessionHistory);
router.put('/:id/confirm', protect, confirmSession);
router.put('/:id/confirm-schedule', protect, confirmSchedule);
router.put('/:id/noshow', protect, markNoShow);
router.put('/:id/reschedule', protect, rescheduleSession);
router.put('/:id/cancel', protect, cancelSession);
router.post('/:id/rate', protect, rateSession);

module.exports = router;
