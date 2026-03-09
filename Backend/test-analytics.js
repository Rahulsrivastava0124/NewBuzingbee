// Test script to populate analytics data
const fetch = require("node-fetch");

const API_URL = "http://localhost:3001/api/analytics/track";

// Generate sample data for the last 24 hours
async function generateSampleData() {
  const now = new Date();
  const promises = [];

  // Generate data for last 24 hours
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now);
    hour.setHours(now.getHours() - i);

    // Random number of views per hour (0-20)
    const viewsCount = Math.floor(Math.random() * 20) + 1;

    for (let j = 0; j < viewsCount; j++) {
      const eventTime = new Date(hour);
      eventTime.setMinutes(Math.floor(Math.random() * 60));

      const devices = ["mobile", "desktop", "tablet"];
      const pages = ["/", "/blog", "/about", "/contact", "/services"];

      const data = {
        website: "buzingbee",
        page: pages[Math.floor(Math.random() * pages.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        location: null,
      };

      promises.push(
        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      );
    }
  }

  console.log(`Generating ${promises.length} analytics events...`);
  await Promise.all(promises);
  console.log("✅ Sample analytics data created successfully!");
}

generateSampleData().catch(console.error);
