import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["POST", "GET"],
  }),
);

// Rate limit: 5 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/send-email", limiter, async (req, res) => {
  const { name, email, subject, message, time } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        name,
        email,
        subject,
        message,
        time,
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      },
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("EmailJS error:", {
      message: err.message,
      status: err.status,
      text: err.text,
      response: err.response,
    });

    res.status(500).json({ error: "Failed to send email" });
  }
});

app.get("/health", (_req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Email backend running on port ${PORT}`));
