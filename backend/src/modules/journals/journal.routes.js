const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantMiddleware = require('../../middleware/tenant');
const {
  getJournals,
  createJournalEntry,
  getJournal,
  postJournalEntry
} = require('./journal.controller');

const router = express.Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getJournals);
router.post('/', createJournalEntry);
router.get('/:id', getJournal);
router.post('/:id/post', postJournalEntry);

module.exports = router;
