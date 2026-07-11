const express = require('express');
const router = express.Router();
const { runAllocation, getAllAllocations, getAllocationStats, resetAllocations } = require('../controllers/allocationController');

router.post('/run', runAllocation);
router.get('/', getAllAllocations);
router.get('/stats', getAllocationStats);
router.delete('/reset', resetAllocations);

module.exports = router;
