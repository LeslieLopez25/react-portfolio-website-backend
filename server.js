import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";
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

// Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/send-email", limiter, async (req, res) => {
  const { name, email, subject, message, time } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject,
      text: `
    You've received a new message from your portfolio contact form
    
    Name: ${name}
    Email: ${email}
    Sent at: ${time}

    ----------------------------------

    ${message}
    `,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.get("/health", (_req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Email backend running on port ${PORT}`));
