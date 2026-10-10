const express = require('express');
const {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
} = require('../controllers/opportunitiesController');

const router = express.Router();

router
  .route('/')
  .post(createOpportunity)
  .get(listOpportunities);

router
  .route('/:id')
  .get(getOpportunity)
  .put(updateOpportunity)
  .delete(deleteOpportunity);

module.exports = router;
