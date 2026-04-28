"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./api/app");
const sqlite_1 = require("./db/sqlite");
const PORT = process.env.PORT || 3001;
function start() {
    (0, sqlite_1.getDb)(); // Initialize DB (synchronous now)
    const server = app_1.app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    // Graceful shutdown
    process.on('SIGTERM', () => {
        (0, sqlite_1.closeDb)();
        server.close(() => {
            process.exit(0);
        });
    });
}
start();
