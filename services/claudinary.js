const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// بيحوّل الـ buffer (من multer memoryStorage) لـ stream عشان
// upload_stream بتاع Cloudinary يقدر ياخده، من غير ما نكتب الملف
// على الديسك ولا نحتاج مكتبة زيادة (streamifier)
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * رفع صورة على Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder - اسم الفولدر على Cloudinary (اختياري)
 * @returns {Promise<{publicUrl: string, publicId: string}>}
 */
function uploadImageToCloudinary(fileBuffer, folder = "images") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          publicUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    bufferToStream(fileBuffer).pipe(uploadStream);
  });
}

/**
 * رفع ملف PDF على Cloudinary. لازم resource_type: "raw" عشان
 * الملفات اللي مش صور (Cloudinary مش بيتعامل مع PDF كـ "image")
 * @param {Buffer} fileBuffer
 * @param {string} originalName - اسم الملف الأصلي (عشان الامتداد يتحفظ)
 * @param {string} folder
 * @returns {Promise<{publicUrl: string, publicId: string}>}
 */
function uploadPdfToCloudinary(fileBuffer, originalName, folder = "pdfs") {
  return new Promise((resolve, reject) => {
    const cleanName = (originalName || "file.pdf")
      .replace(/\.[^/.]+$/, "") // نشيل الامتداد، Cloudinary بيضيفه لوحده
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        public_id: `${Date.now()}-${cleanName}`,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          publicUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    bufferToStream(fileBuffer).pipe(uploadStream);
  });
}

module.exports = {
  cloudinary,
  uploadImageToCloudinary,
  uploadPdfToCloudinary,
};