const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'requests');

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);

    callback(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}${extension}`
    );
  }
});

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  },

  fileFilter: (req, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error('Only PDF, JPG and PNG documents are allowed.')
      );
    }

    callback(null, true);
  }
});

module.exports = upload;