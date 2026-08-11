const express = require("express");
const SiteSettings = require("../models/siteSettings");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const CONTACT_FIELDS = [
  "whatsapp",
  "phone",
  "email",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
];

// المستند واحد بس دايماً — لو مش موجود لسه (أول تشغيل) بننشئه فاضي
async function getOrCreateSettings() {
  let settings = await SiteSettings.findOne();

  if (!settings) {
    settings = await SiteSettings.create({});
  }

  return settings;
}

// =========================
// GET SETTINGS
// عام بالكامل — صفحتَي "من أنا" و"تواصل معنا" بتتفتح من غير تسجيل دخول
// =========================

router.get("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// UPDATE SETTINGS (مدرّس بس)
// =========================

router.put(
  "/settings",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { about, contact } = req.body;
      const settings = await getOrCreateSettings();

      if (about !== undefined) {
        if (about.photoUrl !== undefined) {
          settings.about.photoUrl = about.photoUrl;
        }

        if (about.bio !== undefined) {
          settings.about.bio = about.bio;
        }

        if (about.stats !== undefined) {
          if (!Array.isArray(about.stats)) {
            return res.status(400).json({
              message: "stats must be an array",
            });
          }

          for (const stat of about.stats) {
            if (!stat.label || !stat.value) {
              return res.status(400).json({
                message: "Each stat needs a label and a value",
              });
            }
          }

          settings.about.stats = about.stats;
        }
      }

      if (contact !== undefined) {
        for (const field of CONTACT_FIELDS) {
          if (contact[field] !== undefined) {
            settings.contact[field] = contact[field];
          }
        }
      }

      await settings.save();

      res.status(200).json({
        message: "Settings updated successfully",
        settings,
      });
    } catch (error) {
      console.error("Update settings error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;
