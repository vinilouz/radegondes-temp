const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the upload path based on the fieldname
    let uploadPath = path.join(__dirname, '../../uploads/others'); // Default path
    if (file.fieldname === 'avatar') {
      uploadPath = path.join(__dirname, '../../uploads/avatars');
    } else if (file.fieldname === 'logotipo') {
      uploadPath = path.join(__dirname, '../../uploads/logotipos');
    }

    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'avatar' ? 'avatar-' : 'logo-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
