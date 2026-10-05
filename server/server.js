require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const eventRoutes = require("./routes/eventRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Magic Scheduler API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});