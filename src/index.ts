import "dotenv/config";
import express from "express";
import path from "node:path";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public"))); // front-end
app.use("/api", routes);                                     // back-end
app.use("/api", notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Mood Jar berjalan di http://localhost:${PORT}`);
});