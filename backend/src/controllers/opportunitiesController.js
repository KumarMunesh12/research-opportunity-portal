const { getPool } = require('../config/db');

const textFields = [
  'title',
  'description',
  'research_area',
  'faculty_name',
  'department',
  'required_skills'
];

function validateOpportunity(body, requireStatus) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const opportunity = {};
  for (const field of textFields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return { error: `${field} is required and must be a non-empty string.` };
    }
    opportunity[field] = body[field].trim();
  }

  if (!Number.isSafeInteger(body.available_positions) || body.available_positions <= 0) {
    return { error: 'available_positions must be a positive integer.' };
  }
  opportunity.available_positions = body.available_positions;

  const deadline = body.application_deadline;
  if (
    typeof deadline !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
    Number(deadline.slice(0, 4)) < 1000 ||
    Number(deadline.slice(5, 7)) < 1 ||
    Number(deadline.slice(5, 7)) > 12 ||
    Number(deadline.slice(8, 10)) < 1 ||
    Number(deadline.slice(8, 10)) >
      new Date(Date.UTC(Number(deadline.slice(0, 4)), Number(deadline.slice(5, 7)), 0))
        .getUTCDate()
  ) {
    return { error: 'application_deadline must be a valid date in YYYY-MM-DD format.' };
  }
  opportunity.application_deadline = deadline;

  if (requireStatus && !Object.hasOwn(body, 'status')) {
    return { error: 'status is required for a full opportunity update.' };
  }
  const status = Object.hasOwn(body, 'status') ? body.status : 'Open';
  if (status !== 'Open' && status !== 'Closed') {
    return { error: 'status must be Open or Closed.' };
  }
  opportunity.status = status;

  return { opportunity };
}

function validId(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const listOpportunities = asyncHandler(async (req, res) => {
  const [opportunities] = await getPool().query(
    'SELECT * FROM opportunities ORDER BY created_at DESC, id DESC'
  );
  res.status(200).json(opportunities);
});

const getOpportunity = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'id must be a positive integer.' });
  }

  const [opportunities] = await getPool().execute(
    'SELECT * FROM opportunities WHERE id = ?',
    [Number(req.params.id)]
  );
  if (opportunities.length === 0) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  res.status(200).json(opportunities[0]);
});

const createOpportunity = asyncHandler(async (req, res) => {
  const { opportunity, error } = validateOpportunity(req.body, false);
  if (error) {
    return res.status(400).json({ error });
  }

  const [result] = await getPool().execute(
    `INSERT INTO opportunities
      (title, description, research_area, faculty_name, department, required_skills,
       available_positions, application_deadline, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      opportunity.title,
      opportunity.description,
      opportunity.research_area,
      opportunity.faculty_name,
      opportunity.department,
      opportunity.required_skills,
      opportunity.available_positions,
      opportunity.application_deadline,
      opportunity.status
    ]
  );
  const [created] = await getPool().execute('SELECT * FROM opportunities WHERE id = ?', [
    result.insertId
  ]);
  res.status(201).json(created[0]);
});

const updateOpportunity = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'id must be a positive integer.' });
  }

  // PUT replaces all editable fields; every field, including status, is required.
  const { opportunity, error } = validateOpportunity(req.body, true);
  if (error) {
    return res.status(400).json({ error });
  }

  await getPool().execute(
    `UPDATE opportunities
     SET title = ?, description = ?, research_area = ?, faculty_name = ?, department = ?,
         required_skills = ?, available_positions = ?, application_deadline = ?, status = ?
     WHERE id = ?`,
    [
      opportunity.title,
      opportunity.description,
      opportunity.research_area,
      opportunity.faculty_name,
      opportunity.department,
      opportunity.required_skills,
      opportunity.available_positions,
      opportunity.application_deadline,
      opportunity.status,
      Number(req.params.id)
    ]
  );
  const [updated] = await getPool().execute('SELECT * FROM opportunities WHERE id = ?', [
    Number(req.params.id)
  ]);
  if (updated.length === 0) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  res.status(200).json(updated[0]);
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'id must be a positive integer.' });
  }

  const [result] = await getPool().execute('DELETE FROM opportunities WHERE id = ?', [
    Number(req.params.id)
  ]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  res.status(200).json({ message: 'Opportunity deleted successfully.' });
});

module.exports = {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
