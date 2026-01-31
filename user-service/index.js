import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongodb:27017/users";

app.use(bodyParser.json());

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
