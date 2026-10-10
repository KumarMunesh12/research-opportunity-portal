const express = require('express');
const cors = require('cors');
const opportunitiesRouter = require('./routes/opportunities');
const {
  verifyDatabaseConnection,
  closePool,
  safeDatabaseError
} = require('./config/db');

const app = express();
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    }
  })
);
app.use(express.json());
app.use('/api/opportunities', opportunitiesRouter);
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  if (error instanceof SyntaxError && Object.hasOwn(error, 'body')) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  console.error('An unexpected request error occurred.');
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function startServer() {
  try {
    await verifyDatabaseConnection();
  } catch (error) {
    console.error(safeDatabaseError(error));
    await closePool();
    process.exitCode = 1;
    return;
  }

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`Research Opportunity API listening on port ${port}.`);
  });
}

startServer();
