import { app } from './api/app';
import { getDb, closeDb } from './db/sqlite';

const PORT = process.env.PORT || 3001;

function start() {
  getDb(); // Initialize DB (synchronous now)

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    closeDb();
    server.close(() => {
      process.exit(0);
    });
  });
}

start();