import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();

const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("At Home Right Now !!!");
});

app.listen(port, () => {
  console.log(`Application running at URL : http:\\localhost:${port}`);
});
