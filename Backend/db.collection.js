const mongoose = require("mongoose");
const Admin = require("./models/Admin");

const seedDefaultAdmin = async () => {
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";

  const existingAdmin = await Admin.findOne({
    $or: [{ username: defaultUsername }, { email: defaultEmail }],
  });

  if (!existingAdmin) {
    await Admin.create({
      username: defaultUsername,
      email: defaultEmail,
      password: defaultPassword,
    });
    console.log("Default admin account created");
  }
};

const connectionPromise = mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/adminbuzingbee")
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedDefaultAdmin();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    throw err;
  });

module.exports = { mongoose, connectionPromise };
