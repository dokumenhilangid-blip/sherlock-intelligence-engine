import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";

dotenv.config();

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use("/", routes);

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  app.listen(PORT, "0.0.0.0", () => {
    console.log("PORT ENV =", process.env.PORT);
    console.log(`Sherlock Intelligence Engine running on port ${PORT}`);
  });
}

startServer();
