const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Atomically increments and returns the next value. `floor` lifts the counter to
// at least that value first (used to seed from numbers that already exist).
const nextSequence = async (key, floor = 0) => {
  if (floor > 0) {
    await Counter.updateOne(
      { key },
      { $max: { seq: floor } },
      { upsert: true },
    ).catch((err) => {
      // A concurrent upsert can race on the unique key; the doc then exists.
      if (err.code !== 11000) throw err;
    });
  }
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true },
  );
  return doc.seq;
};

module.exports = Counter;
module.exports.nextSequence = nextSequence;
