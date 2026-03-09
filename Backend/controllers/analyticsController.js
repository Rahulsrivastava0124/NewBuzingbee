const Analytics = require("../models/Analytics");

const normalizeDevice = (device = "") => {
  const d = String(device).toLowerCase();
  if (["mobile", "tablet", "desktop"].includes(d)) return d;
  return "other";
};

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

const trackAnalyticsEvent = async (req, res) => {
  try {
    const { page, website, device, location } = req.body;

    if (!page || !website) {
      return res.status(400).json({
        success: false,
        message: "page and website are required",
      });
    }

    // Get client IP address
    const ipAddress = getClientIP(req);

    // Check if this IP already visited this page in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingVisit = await Analytics.findOne({
      website,
      page,
      ipAddress,
      eventDate: { $gte: oneHourAgo },
    });

    // If IP already visited in last hour, don't count again
    if (existingVisit) {
      return res.status(200).json({
        success: true,
        message: "Visit already tracked for this IP",
        tracked: false,
      });
    }

    // Create new analytics event
    const event = await Analytics.create({
      page,
      website,
      device: normalizeDevice(device),
      location: location || "",
      ipAddress,
      eventDate: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Analytics event tracked",
      tracked: true,
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to track analytics event",
      error: error.message,
    });
  }
};

const getAnalyticsOverview = async (req, res) => {
  try {
    const { website, page, device, days = 7 } = req.query;

    const daysCount = Math.max(1, Math.min(60, Number(days) || 7));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (daysCount - 1));

    const match = { eventDate: { $gte: start } };
    if (website) match.website = String(website).toLowerCase();
    if (page) match.page = page;
    if (device) match.device = normalizeDevice(device);

    const [totalViews, topPages, deviceStats, rawDaily] = await Promise.all([
      Analytics.countDocuments(match),
      Analytics.aggregate([
        { $match: match },
        { $group: { _id: "$page", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]),
      Analytics.aggregate([
        { $match: match },
        { $group: { _id: "$device", views: { $sum: 1 } } },
      ]),
      Analytics.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$eventDate" },
            },
            views: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const dailyMap = new Map(rawDaily.map((d) => [d._id, d.views]));
    const dailyViews = [];

    for (let i = 0; i < daysCount; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      dailyViews.push({
        date: key,
        views: dailyMap.get(key) || 0,
      });
    }

    return res.status(200).json({
      success: true,
      totalViews,
      dailyViews,
      topPages: topPages.map((p) => ({ page: p._id, views: p.views })),
      devices: deviceStats.map((d) => ({ device: d._id, views: d.views })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics overview",
      error: error.message,
    });
  }
};

const getHourlyAnalytics = async (req, res) => {
  try {
    const { website, hours = 24 } = req.query;

    const hoursCount = Math.max(1, Math.min(168, Number(hours) || 24));
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() - (hoursCount - 1));

    const match = { eventDate: { $gte: start } };
    if (website) match.website = String(website).toLowerCase();

    const [totalViews, rawHourly, deviceStats, topPages] = await Promise.all([
      Analytics.countDocuments(match),
      Analytics.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d-%H", date: "$eventDate" },
            },
            views: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Analytics.aggregate([
        { $match: match },
        { $group: { _id: "$device", views: { $sum: 1 } } },
      ]),
      Analytics.aggregate([
        { $match: match },
        { $group: { _id: "$page", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const hourlyMap = new Map(rawHourly.map((h) => [h._id, h.views]));
    const hourlyViews = [];

    for (let i = 0; i < hoursCount; i += 1) {
      const hour = new Date(start);
      hour.setHours(start.getHours() + i);
      const key = hour.toISOString().slice(0, 13).replace("T", "-");
      const hourDisplay = hour.getHours().toString().padStart(2, "0") + ":00";
      hourlyViews.push({
        hour: hourDisplay,
        time: hour.toISOString(),
        views: hourlyMap.get(key) || 0,
      });
    }

    return res.status(200).json({
      success: true,
      totalViews,
      hourlyViews,
      topPages: topPages.map((p) => ({ page: p._id, views: p.views })),
      devices: deviceStats.map((d) => ({ device: d._id, views: d.views })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hourly analytics",
      error: error.message,
    });
  }
};

const getDetailedAnalytics = async (req, res) => {
  try {
    const {
      website,
      page,
      device,
      days = 7,
      limit = 100,
      skip = 0,
    } = req.query;

    const daysCount = Math.max(1, Math.min(60, Number(days) || 7));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (daysCount - 1));

    const match = { eventDate: { $gte: start } };
    if (website) match.website = String(website).toLowerCase();
    if (page) match.page = page;
    if (device) match.device = normalizeDevice(device);

    const [records, totalCount] = await Promise.all([
      Analytics.find(match)
        .sort({ eventDate: -1 })
        .limit(Number(limit))
        .skip(Number(skip))
        .select("website page device ipAddress location eventDate createdAt")
        .lean(),
      Analytics.countDocuments(match),
    ]);

    return res.status(200).json({
      success: true,
      data: records,
      total: totalCount,
      page: Math.floor(Number(skip) / Number(limit)) + 1,
      limit: Number(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch detailed analytics",
      error: error.message,
    });
  }
};

module.exports = {
  trackAnalyticsEvent,
  getAnalyticsOverview,
  getHourlyAnalytics,
  getDetailedAnalytics,
};
