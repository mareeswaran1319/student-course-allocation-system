const express = require('express');
const router = express.Router();
const { aiQuery } = require('../controllers/aiController');

router.post('/query', aiQuery);

module.exports = router;
