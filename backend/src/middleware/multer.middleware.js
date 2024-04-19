import multer from "multer";

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./public/temp");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

// Set up multer to handle any file without limit constraint with storage configuration
export const upload = multer({ storage: storage });

// Set up multer to handle video file uploads with storage configuration
export const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Set up multer to handle PDF file uploads with storage configuration
export const uploadPDF = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit
  },
});