const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const { isProduction } = require("./config");

// Creates the first admin from DEFAULT_ADMIN_* when no admin exists yet.
// Production never falls back to well-known credentials.
const seedDefaultAdmin = async () => {
  const username = process.env.DEFAULT_ADMIN_USERNAME;
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    if (!isProduction && (await Admin.countDocuments()) === 0) {
      await Admin.create({
        username: "admin",
        email: "admin@example.com",
        password: "admin12345",
      });
      console.warn("Development admin created: admin / admin12345");
    }
    return;
  }

  const existingAdmin = await Admin.findOne({
    $or: [{ username }, { email: email.toLowerCase() }],
  });

  if (!existingAdmin) {
    await Admin.create({ username, email, password });
    console.log("Initial admin account created");
  }
};

const connectionPromise = mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/adminbuzingbee", {
    serverSelectionTimeoutMS: 15000,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedDefaultAdmin();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    throw err;
  });

module.exports = { mongoose, connectionPromise };
