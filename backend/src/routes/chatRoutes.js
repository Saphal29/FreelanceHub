const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  getOrCreateConversation, getConversations, getMessages,
  markAsRead, deleteMessage, archiveConversation, searchMessages, getUnreadCount,
  uploadChatFile, sendMessage
} = require('../controllers/chatController');

// Configure multer for chat file uploads (memory storage for centralized file service)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (will be validated by file service)
  },
  fileFilter: (req, file, cb) => {
    // Basic validation - detailed validation in file service
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.use(authMiddleware);

router.post('/conversations', getOrCreateConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage); // Send message via REST
router.put('/conversations/:conversationId/read', markAsRead);
router.put('/conversations/:conversationId/archive', archiveConversation);
router.get('/conversations/:conversationId/search', searchMessages);
router.delete('/messages/:messageId', deleteMessage);
router.get('/unread-count', getUnreadCount);
router.post('/upload', upload.single('file'), uploadChatFile);

module.exports = router;
