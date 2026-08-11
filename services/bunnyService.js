const crypto = require("crypto");



function generateBunnySignedEmbedUrl(videoId, expiresInSeconds = 3600) {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const securityKey = process.env.BUNNY_EMBED_TOKEN_KEY;

  if (!libraryId || !securityKey) {
    throw new Error(
      "BUNNY_LIBRARY_ID and BUNNY_EMBED_TOKEN_KEY must be set in environment variables"
    );
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // الترتيب مهم جداً: securityKey + videoId + expires
  const hashableBase = securityKey + videoId + expires;

  const token = crypto
    .createHash("sha256")
    .update(hashableBase)
    .digest("hex");

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}

/**
 * بيعمل "video object" فاضي على Bunny ويرجّع بيانات كافية للفرونت اند
 * عشان يرفع الفيديو مباشرة (TUS) من غير ما يمر على سيرفرنا
 * @param {string} title - عنوان الفيديو
 * @returns {Promise<object>} بيانات الرفع الجاهزة للفرونت اند
 */
async function createBunnyUploadCredentials(title) {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;

  if (!libraryId || !apiKey) {
    throw new Error(
      "BUNNY_LIBRARY_ID and BUNNY_STREAM_API_KEY must be set in environment variables"
    );
  }

  // الخطوة 1: إنشاء video object فاضي على Bunny
  const createResponse = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: apiKey,
      },
      body: JSON.stringify({ title: title || "Untitled Video" }),
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create Bunny video: ${errorText}`);
  }

  const video = await createResponse.json();
  const videoId = video.guid;

  // الخطوة 2: توليد توقيع TUS صالح لمدة 24 ساعة
  const expirationTime = Math.floor(Date.now() / 1000) + 86400;

  const signature = crypto
    .createHash("sha256")
    .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
    .digest("hex");

  return {
    videoId,
    libraryId,
    expirationTime,
    signature,
    // بيانات لازمة للفرونت اند عشان يبني كائن الـ tus.Upload
    tusEndpoint: "https://video.bunnycdn.com/tusupload",
  };
}

/**
 * بيمسح فيديو من Bunny نهائياً (الملف الفعلي، مش الـ reference بس)
 * @param {string} videoId - الـ videoId بتاع الفيديو على Bunny
 * @returns {Promise<void>}
 */
async function deleteBunnyVideo(videoId) {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;

  if (!libraryId || !apiKey) {
    throw new Error(
      "BUNNY_LIBRARY_ID and BUNNY_STREAM_API_KEY must be set in environment variables"
    );
  }

  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        AccessKey: apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete Bunny video: ${errorText}`);
  }
}

module.exports = {
  generateBunnySignedEmbedUrl,
  createBunnyUploadCredentials,
  deleteBunnyVideo,
};