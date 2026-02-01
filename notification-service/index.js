import amqplib from "amqplib";

async function consumeMessages() {
  try {
    const connection = await amqplib.connect("amqp://rabbitmq:5672");
    const channel = await connection.createChannel();
    const queue = "task_notifications";
    await channel.assertQueue(queue, { durable: true });
    console.log("Waiting for messages in %s. To exit press CTRL+C", queue);
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString();
        console.log("Received message:", messageContent);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.log("Error in consuming messages:", error);
  }
}

consumeMessages();
