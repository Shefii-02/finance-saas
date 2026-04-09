const { StatusCodes } = require('http-status-codes');
const {
  listJournalsByTenant,
  createJournal,
  getJournalById,
  postJournal
} = require('../../services/journal.service');

async function getJournals(req, res, next) {
  try {
    const journals = await listJournalsByTenant(req.tenant_id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: journals
    });
  } catch (error) {
    next(error);
  }
}

async function createJournalEntry(req, res, next) {
  try {
    const journal = await createJournal(req.tenant_id, req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: journal
    });
  } catch (error) {
    next(error);
  }
}

async function getJournal(req, res, next) {
  try {
    const journal = await getJournalById(req.tenant_id, req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: journal
    });
  } catch (error) {
    next(error);
  }
}

async function postJournalEntry(req, res, next) {
  try {
    const journal = await postJournal(req.tenant_id, req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: journal
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getJournals,
  createJournalEntry,
  getJournal,
  postJournalEntry
};
