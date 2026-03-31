const fileService = require('../services/fileService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload file
 * @route POST /api/files/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        code: 'NO_FILE'
      });
    }

    const userId = req.user.userId;
    const metadata = {
      category: req.body.category || 'other',
      projectId: req.body.projectId || null,
      contractId: req.body.contractId || null,
      milestoneId: req.body.milestoneId || null,
      proposalId: req.body.proposalId || null,
      disputeId: req.body.disputeId || null,
      description: req.body.description || null,
      isPublic: req.body.isPublic === 'true',
      expiresIn: req.body.expiresIn ? parseInt(req.body.expiresIn) : null
    };

    const file = await fileService.uploadFile(req.file, userId, metadata);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file
    });
  } catch (error) {
    logger.error('Error uploading file', { error: error.message });

    if (error.message.includes('exceeds limit') || error.message.includes('not allowed')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get user's files
 * @route GET /api/files
 */
const getUserFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await fileService.getUserFiles(userId, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting user files', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve files',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get file by ID
 * @route GET /api/files/:id
 */
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const file = await fileService.getFileById(id, userId, userRole);

    res.json({
      success: true,
      file
    });
  } catch (error) {
    logger.error('Error getting file', { error: error.message });

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete file
 * @route DELETE /api/files/:id
 */
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const result = await fileService.deleteFile(id, userId, userRole);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting file', { error: error.message });

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Download file
 * @route GET /api/files/download/:id
 */
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const { query } = require('../utils/dbQueries');
    const fileService = require('../services/fileService');
    
    // Get file from database
    let fileResult;
    
    if (token) {
      // Token-based access
      fileResult = await query(
        `SELECT * FROM files 
         WHERE id = $1 AND access_token = $2 
         AND (token_expires_at IS NULL OR token_expires_at > CURRENT_TIMESTAMP)
         AND status = 'active'`,
        [id, token]
      );
      
      if (fileResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired download token',
          code: 'INVALID_TOKEN'
        });
      }
    } else if (userId) {
      // Authenticated access - use the service's access control logic
      try {
        await fileService.getFileById(id, userId, userRole);
        // If no error thrown, user has access
        fileResult = await query(
          'SELECT * FROM files WHERE id = $1 AND status = $2',
          [id, 'active']
        );
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'File not found or access denied',
          code: 'NOT_FOUND'
        });
      }
    } else {
      // No authentication and no token
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const file = fileResult.rows[0];
    const filePath = path.join(process.cwd(), file.file_path);
    
    logger.info('Attempting to download file', { 
      fileId: id, 
      filePath, 
      originalName: file.original_name,
      mimeType: file.mime_type 
    });
    
    // Check if file exists on disk
    try {
      await fs.access(filePath);
    } catch (err) {
      logger.error('File not found on disk', { fileId: id, filePath });
      return res.status(404).json({
        success: false,
        error: 'File not found on server',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set headers to force download
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    
    // Send file
    res.download(filePath, file.original_name, (err) => {
      if (err) {
        logger.error('Error sending file', { fileId: id, error: err.message });
      } else {
        logger.info('File downloaded successfully', { fileId: id, originalName: file.original_name });
      }
    });
  } catch (error) {
    logger.error('Error downloading file', { error: error.message, stack: error.stack });

    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

/**
 * Get storage usage
 * @route GET /api/files/storage-usage
 */
const getStorageUsage = async (req, res) => {
  try {
    const userId = req.user.userId;

    const usage = await fileService.getUserStorageUsage(userId);

    res.json({
      success: true,
      usage
    });
  } catch (error) {
    logger.error('Error getting storage usage', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve storage usage',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Generate download link
 * @route POST /api/files/:id/link
 */
const generateDownloadLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { expiresIn = 1 } = req.body;

    const link = await fileService.generateDownloadLink(id, userId, expiresIn);

    res.json({
      success: true,
      ...link
    });
  } catch (error) {
    logger.error('Error generating download link', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to generate download link',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get files by proposal ID
 * @route GET /api/files/proposal/:proposalId
 */
const getProposalFiles = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { query } = require('../utils/dbQueries');

    const result = await query(
      `SELECT * FROM files 
       WHERE proposal_id = $1 AND status = 'active' 
       ORDER BY created_at DESC`,
      [proposalId]
    );

    const files = result.rows.map(file => ({
      id: file.id,
      originalName: file.original_name,
      storedName: file.stored_name,
      filePath: file.file_path,
      fileUrl: file.file_url,
      mimeType: file.mime_type,
      fileSize: parseInt(file.file_size),
      fileSizeMB: (parseInt(file.file_size) / 1024 / 1024).toFixed(2),
      fileExtension: file.file_extension,
      category: file.category,
      createdAt: file.created_at
    }));

    res.json({
      success: true,
      files
    });
  } catch (error) {
    logger.error('Error getting proposal files', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve proposal files',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get files by dispute ID (evidence)
 * @route GET /api/files/dispute/:disputeId
 */
const getDisputeFiles = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { query } = require('../utils/dbQueries');

    // Check if user has access to this dispute
    const disputeCheck = await query(
      `SELECT filed_by, respondent_id, mediator_id 
       FROM disputes 
       WHERE id = $1`,
      [disputeId]
    );

    if (disputeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found',
        code: 'NOT_FOUND'
      });
    }

    const dispute = disputeCheck.rows[0];
    const isParty = dispute.filed_by === userId || dispute.respondent_id === userId;
    const isMediator = dispute.mediator_id === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isParty && !isMediator && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access dispute evidence',
        code: 'UNAUTHORIZED'
      });
    }

    // Get all files for this dispute
    const result = await query(
      `SELECT f.*, u.full_name as uploader_name 
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.dispute_id = $1 AND f.status = 'active' 
       ORDER BY f.created_at DESC`,
      [disputeId]
    );

    const files = result.rows.map(file => ({
      id: file.id,
      original_name: file.original_name,
      stored_name: file.stored_name,
      file_path: file.file_path,
      file_url: file.file_url,
      mime_type: file.mime_type,
      file_size: parseInt(file.file_size),
      file_extension: file.file_extension,
      category: file.category,
      description: file.description,
      uploaded_by: file.uploaded_by,
      uploader_name: file.uploader_name,
      created_at: file.created_at
    }));

    res.json({
      success: true,
      files
    });
  } catch (error) {
    logger.error('Error getting dispute files', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dispute evidence',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  uploadFile,
  getUserFiles,
  getFileById,
  deleteFile,
  downloadFile,
  getStorageUsage,
  generateDownloadLink,
  getProposalFiles,
  getDisputeFiles
};
