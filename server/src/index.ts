import express, { Express } from "express";
import bodyParser from 'body-parser';
import { listPolls, addPoll, voteInPoll, getPoll } from './routes';


// Configure and start the HTTP server.
const port: number = 8088;
const app: Express = express();
app.use(bodyParser.json());
app.get("/api/list", listPolls);
app.post("/api/add", addPoll);
app.post("/api/vote", voteInPoll);
app.post("/api/get", getPoll);
app.listen(port, () => console.log(`Server listening on ${port}`));
