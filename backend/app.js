import express from "express"
import dotenv from "dotenv"


dotenv.config({ path: "./config/config.env" });

const app = express();


app.get('/', (req, res) => {
    res.send('Hello from the server')
})


export default app;