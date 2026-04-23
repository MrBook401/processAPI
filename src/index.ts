import { app } from './api/app';
import { getDb } from './db/sqlite';

const PORT = process.env.PORT || 3001;

async function start() {
  await getDb(); // Initialize DB
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start().catch(console.error);
