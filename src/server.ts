import "dotenv/config";
import { app } from "./app";

const Port = Number(process.env.PORT) || 3000;

app.listen(Port,async ()=>{
  console.log(`listening on port ${Port}`);
})
