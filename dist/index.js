"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./api/app");
const sqlite_1 = require("./db/sqlite");
const PORT = process.env.PORT || 3001;
async function start() {
    await (0, sqlite_1.getDb)(); // Initialize DB
    app_1.app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
start().catch(console.error);
