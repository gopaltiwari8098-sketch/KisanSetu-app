const express = require('express');
const router = express.Router();
const { getAllMandis } = require('../controllers/mandiController');

router.get('/', getAllMandis);

module.exports = router;