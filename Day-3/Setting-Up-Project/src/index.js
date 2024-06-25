// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
dotenv.config({ path: "./env" });

// Second Approach :-
import app from "./app.js";
import connectDB from "./db/index.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("App not able to communicate with DB!!!");
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`App running at URL : http:\\localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB Connection Failed : ${err}`);
  });

// First Approach :-
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
// const app = express();
// ;(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

//     // well what if DB is connected but our app is not able to communicate with it so to check that we use the code below :
//     app.on("error", (error) => {
//       console.log("App not able to communicate with DB!!!");
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App running at URL : http:\\localhost:${process.env.PORT}`);
//     });
//   } catch (err) {
//     console.error("ERROR : ", err);
//     throw err;
//   }
// })();
