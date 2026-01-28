import dotenv from "dotenv";
import { app } from "./app";
import fs from "fs";
import path from "path";

const envPath = path.resolve(__dirname, "../config.env");

if (!fs.existsSync(envPath)) {
  console.error("config.env not found at:", envPath);
}

dotenv.config({ path: envPath });


const Port = Number(process.env.PORT);

app.listen(Port,()=>{
  console.log(`listening on port ${Port}`);
})
