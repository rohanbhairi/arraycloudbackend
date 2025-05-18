require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// Ensure uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Error handlers for uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

// Debug environment variables (remove or comment in production)
console.log("EMAIL:", process.env.EMAIL);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
console.log("RECEIVER_EMAIL:", process.env.RECEIVER_EMAIL);
console.log("EMAIL_TO:", process.env.EMAIL_TO);

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// ============================
// 1. Consultation Email Route
// ============================
app.post("/send-email", async (req, res) => {
  const { firstName, lastName, company, email,countryCode, phone, service, others, message } = req.body;

  // const transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: process.env.EMAIL,
  //     pass: process.env.EMAIL_PASS,
  //   },
  // });
  const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});


  const mailOptions = {
    from: email,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Consultation Request from ${company}`,
    text: `
Name: ${firstName} ${lastName}
Company: ${company}
Email: ${email}
Contact No.:${countryCode} ${phone}
Service: ${service}
Additional Info: ${others}
Message: ${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending consultation email:", error);
    res.status(500).json({ success: false, message: "Email could not be sent!" });
  }
});

// ============================
// 2. Solutions Contact Route
// ============================
app.post("/send-email-solutions", async (req, res) => {
  const { fullName, phone, email, jobTitle, company, country, service, message } = req.body;

  const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});


  const mailOptions = {
    from: email,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Contact Submission from ${fullName}`,
    text: `
Full Name: ${fullName}
Email: ${email}
Phone: ${phone}
Job Title: ${jobTitle}
Company: ${company}
Country: ${country}
Service Interested: ${service}
Message: ${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending solution email:", error);
    res.status(500).json({ success: false, message: "Email could not be sent!" });
  }
});

// ============================
// 3. Career Form with Resume
// ============================
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

app.post("/api/apply", upload.single("resume"), async (req, res) => {
  const { name, email,countryCode, phone, coverLetter, message } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) return res.status(400).send("Resume is required");

  try {
    const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});


    const mailOptions = {
      from: `"Career Form" <${process.env.EMAIL}>`,
      to: process.env.EMAIL_TO,
      subject: `New Career Application from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${countryCode} ${phone}
Cover Letter: ${coverLetter}
Message: ${message}
      `,
      attachments: [
        {
          filename: resumeFile.originalname,
          path: resumeFile.path,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Delete the uploaded file after sending email
    fs.unlink(resumeFile.path, (err) => {
      if (err) {
        console.error("Failed to delete resume:", err);
      } else {
        console.log("Resume deleted:", resumeFile.path);
      }
    });

    res.status(200).send("Application submitted and email sent!");
  } catch (err) {
    console.error("Failed to send email:", err);
    res.status(500).send("Server error.");
  }
});


// ============================
// Start the server
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
