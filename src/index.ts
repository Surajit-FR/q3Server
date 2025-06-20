import { app } from './app';
import connectDB from './db/db';
import http from 'http';
import dotenv from "dotenv";
dotenv.config({ path: './.env' });



const server = http.createServer(app);

connectDB().then(() => {
    server.on("error", (error) => {
        console.log(`Server Connection Error: ${error}`);
    });
    server.listen(process.env.PORT || 9000, () => {
        console.log(`⚙️  Server Connected On Port: ${process.env.PORT}\n`);
    });
}).catch((err) => {
    console.log("MongoDB Connection Failed!!", err);
});