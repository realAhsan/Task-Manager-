import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import amqplib from "amqplib";
let connection = null;
let channel = null;

dotenv.config();

const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongodb:27017/tasks";
const app = express();
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
async function connectRabbitMQ(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqplib.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      const queue = "task_notifications";
      console.log("Connected to RabbitMQ");
      break;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ", error);
      retries -= 1;
      await new Promise((res) => setTimeout(res, delay));
      console.log(`Retries left: ${retries}`);
    }
  }
}
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: { type: Date, default: Date.now },
  completed: {
    type: Boolean,
    default: false,
  },
});

const Task = mongoose.model("Task", taskSchema);

app.use(bodyParser.json());
app.post("/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);

    await task.save();

    if (channel) {
      const queue = "task_notifications";
      const msg = JSON.stringify({
        taskId: task._id,
        userId: task.userId,
        title: task.title,
      });
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
      console.log("Sent message to queue:", msg);
    }

    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).send(tasks);
  } catch (error) {
    res.status.status(500).send(error);
  }
});

app.get("/", (req, res) => {
  res.send("task Service is running");
});

app.listen(PORT, () => {
  console.log(`task service running on port ${PORT}`);
  connectRabbitMQ();
});
