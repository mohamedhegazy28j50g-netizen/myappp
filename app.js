const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const classRoutes = require("./routes/class");
const userRoutes = require("./routes/user");
 const authRoutes = require("./routes/auth");
const lessonRoutes = require("./routes/lesson");
const sessionRoutes = require("./routes/session");
const orderRoutes = require("./routes/order");
const settingsRoutes = require("./routes/settings");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");
const directCodeRoutes = require("./routes/directcode");

const User = require("./models/user");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;



const app = express();


const path = require("path");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));




mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    if (require.main === module) {
      app.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on port ${process.env.PORT || 5000}`);
        console.log (process.env.GMAIL_USER);
        console.log (process.env.GMAIL_APP_PASSWORD);
      });
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

  app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),

    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);

 
  app.use("/classes", classRoutes);

  app.use("/auth", authRoutes);
  app.use("/", lessonRoutes);
  app.use("/", sessionRoutes);
  app.use("/", orderRoutes);
  app.use("/", settingsRoutes);
  app.use("/", directCodeRoutes);
  app.use("/", userRoutes);
  app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
  });
  app.get('/dashboard.html', authMiddleware,
    roleMiddleware(["teacher"]), (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'dashboard.html'));});

  module.exports = app;