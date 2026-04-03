const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getFreelancerProfile, searchFreelancers, getCurrentUserProfile, updateCurrentUserProfile, uploadProfileImage } = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get current user's profile
router.get('/', authMiddleware, getCurrentUserProfile);

// Update current user's profile
router.put('/', authMiddleware, updateCurrentUserProfile);
router.patch('/', authMiddleware, updateCurrentUserProfile);

// Upload profile image
router.post('/image', authMiddleware, upload.single('image'), uploadProfileImage);

// Search freelancers
router.get('/search/freelancers', authMiddleware, searchFreelancers);

// Get freelancer public profile
router.get('/:userId', authMiddleware, getFreelancerProfile);

module.exports = router;
