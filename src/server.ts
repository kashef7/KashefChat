import "dotenv/config";
import { app } from "./app";

const Port = Number(process.env.PORT) || 5000;

app.listen(Port,async ()=>{
  console.log(`listening on port ${Port}`);
})
