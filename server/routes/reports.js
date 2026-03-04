const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const uploadReportFile = require('../middleware/uploadReport');

router.post('/', protect, uploadReportFile.single('evidence'), createReport);
router.get('/', protect, getReports);

module.exports = router;
