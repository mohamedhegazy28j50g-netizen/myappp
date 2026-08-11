const mongoose = require("mongoose");

// إحصائية واحدة في صفحة "من أنا" (زي "8 سنين خبرة" أو "+1200 طالب")
const statSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// الموقع لأستاذ واحد بس، فالإعدادات دي عبارة عن مستند وحيد (singleton)
// بيتقرا/يتحدّث دايماً بنفس الطريقة، مش مرتبط بأي مستخدم أو حصة
const siteSettingsSchema = new mongoose.Schema(
  {
    about: {
      photoUrl: { type: String, default: "", trim: true },
      bio: { type: String, default: "" },
      stats: { type: [statSchema], default: [] },
    },

    contact: {
      whatsapp: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      facebook: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
      youtube: { type: String, default: "", trim: true },
      tiktok: { type: String, default: "", trim: true },
    },
  },
  {
    timestamps: true,
  }
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

module.exports = SiteSettings;
