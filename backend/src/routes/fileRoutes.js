const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max (will be validated per category in service)
  },
  fileFilter: (req, file, cb) => {
    // Basic validation - detailed validation in service
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/zip',
      'application/x-zip-compressed',
      'video/mp4',
      'video/quicktime',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

// ============================================
// FILE ROUTES
// ============================================

/**
 * @route   POST /api/files/upload
 * @desc    Upload a file
 * @access  Private
 */
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  fileController.uploadFile
);

/**
 * @route   GET /api/files
 * @desc    Get user's files
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  fileController.getUserFiles
);

/**
 * @route   GET /api/files/storage-usage
 * @desc    Get user's storage usage
 * @access  Private
 */
router.get(
  '/storage-usage',
  authMiddleware,
  fileController.getStorageUsage
);

/**
 * @route   GET /api/files/download/:id
 * @desc    Download a file
 * @access  Private (or public with token)
 */
router.get(
  '/download/:id',
  optionalAuthMiddleware,
  fileController.downloadFile
);

/**
 * @route   GET /api/files/:id
 * @desc    Get file details
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware,
  fileController.getFileById
);

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file
 * @access  Private
 */
router.delete(
  '/:id',
  authMiddleware,
  fileController.deleteFile
);

/**
 * @route   POST /api/files/:id/link
 * @desc    Generate temporary download link
 * @access  Private
 */
router.post(
  '/:id/link',
  authMiddleware,
  fileController.generateDownloadLink
);

/**
 * @route   GET /api/files/proposal/:proposalId
 * @desc    Get files for a proposal
 * @access  Private
 */
router.get(
  '/proposal/:proposalId',
  authMiddleware,
  fileController.getProposalFiles
);

/**
 * @route   GET /api/files/dispute/:disputeId
 * @desc    Get files for a dispute (evidence)
 * @access  Private
 */
router.get(
  '/dispute/:disputeId',
  authMiddleware,
  fileController.getDisputeFiles
);

module.exports = router;
