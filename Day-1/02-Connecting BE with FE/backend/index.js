import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.json({ msg: "Hello" });
});

app.get("/api/v1/jokes", (req, res) => {
  const jokes = [
    {
      id: 1,
      title: "Why don't scientists trust atoms?",
      content: "Because they make up everything!",
    },
    {
      id: 2,
      title: "Why did the scarecrow win an award?",
      content: "Because he was outstanding in his field!",
    },
    {
      id: 3,
      title: "What do you call fake spaghetti?",
      content: "An impasta!",
    },
    {
      id: 4,
      title: "Why was the math book sad?",
      content: "Because it had too many problems.",
    },
    {
      id: 5,
      title: "Why don't skeletons fight each other?",
      content: "They don't have the guts.",
    },
    {
      id: 6,
      title: "What do you call cheese that isn't yours?",
      content: "Nacho cheese.",
    },
    {
      id: 7,
      title: "How does a penguin build its house?",
      content: "Igloos it together.",
    },
    {
      id: 8,
      title: "Why did the bicycle fall over?",
      content: "Because it was two-tired.",
    },
    {
      id: 9,
      title: "What do you get when you cross a snowman and a vampire?",
      content: "Frostbite.",
    },
    {
      id: 10,
      title: "Why did the golfer bring two pairs of pants?",
      content: "In case he got a hole in one.",
    },
  ];
  res.send(jokes);
});

app.listen(port, () => {
  console.log(`Application Running at ${port}`);
});
