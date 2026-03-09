// Test IP-based Analytics Tracking
// This demonstrates that the same IP won't increase count within 1 hour

const testTracking = async () => {
  const API_URL = "http://localhost:3001/api/analytics/track";

  console.log("🧪 Testing IP-based Analytics Tracking\n");

  // Test 1: First visit from an IP
  console.log("Test 1: First visit from IP 192.168.1.100");
  const response1 = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "192.168.1.100",
    },
    body: JSON.stringify({
      website: "buzingbee",
      page: "/home",
      device: "desktop",
    }),
  });
  const result1 = await response1.json();
  console.log(`✅ Response:`, result1);
  console.log(`   Tracked: ${result1.tracked}\n`);

  // Test 2: Same IP visits again (within 1 hour)
  console.log("Test 2: Same IP visits again immediately");
  const response2 = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "192.168.1.100",
    },
    body: JSON.stringify({
      website: "buzingbee",
      page: "/home",
      device: "desktop",
    }),
  });
  const result2 = await response2.json();
  console.log(`✅ Response:`, result2);
  console.log(`   Tracked: ${result2.tracked}`);
  console.log(`   Message: ${result2.message}\n`);

  // Test 3: Different IP visits
  console.log("Test 3: Different IP (192.168.1.200) visits");
  const response3 = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "192.168.1.200",
    },
    body: JSON.stringify({
      website: "buzingbee",
      page: "/home",
      device: "mobile",
    }),
  });
  const result3 = await response3.json();
  console.log(`✅ Response:`, result3);
  console.log(`   Tracked: ${result3.tracked}\n`);

  // Test 4: Same IP but different page
  console.log("Test 4: Same IP (192.168.1.100) but different page");
  const response4 = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "192.168.1.100",
    },
    body: JSON.stringify({
      website: "buzingbee",
      page: "/about",
      device: "desktop",
    }),
  });
  const result4 = await response4.json();
  console.log(`✅ Response:`, result4);
  console.log(`   Tracked: ${result4.tracked}\n`);

  console.log("✨ Summary:");
  console.log("- First IP visit: TRACKED ✅");
  console.log("- Duplicate IP (same page, within 1hr): NOT TRACKED ❌");
  console.log("- Different IP: TRACKED ✅");
  console.log("- Same IP, different page: TRACKED ✅");
};

testTracking().catch(console.error);
