require("dotenv").config();
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/bikash", (req, res) => {
  res.send("Hey,There Bikash");
});

app.get("/login", (req, res) => {
  res.send("<h1>Hello you are at Login</h1>");
});

app.get("/hello", (req, res) => {
  res.json("Bikash is learning...");
});

app.listen(process.env.PORT, () => {
  console.log(`Application Running at port-${process.env.PORT}`);
});
