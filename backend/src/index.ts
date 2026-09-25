import app from "./app";
import { createServer } from "http";   

import  pool  from "./config/db";
import { initializeSocket } from "./sockets/socket";
import { config } from "./config/env";

const httpServer = createServer(app);

const io = initializeSocket(httpServer);

pool.query("SELECT 1")
.then(() => {
    console.log("Database Connected");
})
.then(() => {
    httpServer.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    });
})
.catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exitCode = 1;
});

