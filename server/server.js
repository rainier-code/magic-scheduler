require("dotenv").config();

const pushSubscriptionRoutes = require("./routes/pushSubscriptionRoutes");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const eventRoutes = require("./routes/eventRoutes");

const app = express();

const configuredOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"];

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Cron-Secret", "X-Test-Secret"],
  maxAge: 600,
}));
app.use(express.json({ limit: "32kb", strict: true }));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/push", pushSubscriptionRoutes);
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.get("/", (req, res) => {
  res.json({
    message: "Magic Scheduler API is running",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large." });
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Request body must contain valid JSON." });
  }
  console.error("Unhandled API error:", error?.name || "UnknownError");
  return res.status(500).json({ message: "The server could not complete the request." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.error("Server startup stopped because the database is unavailable.");
    process.exitCode = 1;
  });
