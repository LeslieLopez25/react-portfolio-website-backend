import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
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

// SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

app.post("/send-email", limiter, async (req, res) => {
  const { name, email, subject, message, time } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: subject,
      text: `You've received a new message from your portfolio contact form.
      
      Name: ${name}
      Email: ${email}
      Sent at: ${time}

      ----------------------------------

      ${message}
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email error: ", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.get("/health", (_req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Email backend running on port ${PORT}`));
