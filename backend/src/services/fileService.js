const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  profile_avatar: 5 * 1024 * 1024, // 5MB
  profile_document: 10 * 1024 * 1024, // 10MB
  project_attachment: 25 * 1024 * 1024, // 25MB
  milestone_attachment: 50 * 1024 * 1024, // 50MB
  proposal_attachment: 25 * 1024 * 1024, // 25MB
  dispute_evidence: 50 * 1024 * 1024, // 50MB
  chat_attachment: 25 * 1024 * 1024, // 25MB
  contract_document: 25 * 1024 * 1024, // 25MB
  other: 25 * 1024 * 1024 // 25MB
};

// Allowed MIME types by category
const ALLOWED_MIME_TYPES = {
  profile_avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  profile_document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  project_attachment: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'application/x-zip-compressed'],
  milestone_attachment: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', // Images
    'application/pdf', // PDF
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/zip', 'application/x-zip-compressed', // ZIP files
    'application/x-rar-compressed', // RAR files
    'video/mp4', 'video/quicktime', 'video/x-msvideo', // Videos
    'text/plain', 'text/csv' // Text files
  ],
  proposal_attachment: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', // Images for portfolio
    'application/pdf', // PDF documents
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint' // .ppt
  ],
  dispute_evidence: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'],
  chat_attachment: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  contract_document: ['application/pdf'],
  other: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
};

/**
 * Upload a file
 */
const uploadFile = async (file, userId, metadata = {}) => {
  try {
    const {
      category = 'other',
      projectId = null,
      contractId = null,
      milestoneId = null,
      proposalId = null,
      disputeId = null,
      description = null,
      isPublic = false,
      expiresIn = null // in hours
    } = metadata;

    logger.info('Uploading file', { userId, category, originalName: file.originalname });

    // Validate file size
    const sizeLimit = FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.other;
    if (file.size > sizeLimit) {
      throw new Error(`File size exceeds limit of ${(sizeLimit / 1024 / 1024).toFixed(0)}MB for ${category}`);
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[category] || ALLOWED_MIME_TYPES.other;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed for ${category}`);
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const storedName = `${crypto.randomUUID()}${fileExtension}`;
    const categoryFolder = category.replace('_', '-');
    const filePath = `uploads/${categoryFolder}/${storedName}`;
    const fullPath = path.join(process.cwd(), filePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    // Move file to destination
    await fs.writeFile(fullPath, file.buffer);

    // Generate file URL
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/${filePath}`;

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    // Generate access token for non-public files
    let accessToken = null;
    let tokenExpiresAt = null;
    if (!isPublic) {
      accessToken = crypto.randomBytes(32).toString('hex');
      tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // Token valid for 24 hours
    }

    // Save to database
    const result = await query(
      `INSERT INTO files (
        original_name, stored_name, file_path, file_url,
        mime_type, file_size, file_extension,
        category, uploaded_by,
        project_id, contract_id, milestone_id, proposal_id, dispute_id,
        description,
        is_public, access_token, token_expires_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        file.originalname,
        storedName,
        filePath,
        fileUrl,
        file.mimetype,
        file.size,
        fileExtension,
        category,
        userId,
        projectId,
        contractId,
        milestoneId,
        proposalId,
        disputeId,
        description,
        isPublic,
        accessToken,
        tokenExpiresAt,
        expiresAt
      ]
    );

    logger.info('File uploaded successfully', { fileId: result.rows[0].id, storedName });

    return formatFileResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error uploading file', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get file by ID
 */
const getFileById = async (fileId, userId, userRole) => {
  try {
    const result = await query(
      'SELECT * FROM files WHERE id = $1 AND status = $2',
      [fileId, 'active']
    );

    if (result.rows.length === 0) {
      throw new Error('File not found');
    }

    const file = result.rows[0];

    // Check access permissions
    let hasAccess = false;

    // Admin has access to all files
    if (userRole === 'ADMIN') {
      hasAccess = true;
    }
    // File owner has access
    else if (file.uploaded_by === userId) {
      hasAccess = true;
    }
    // Public files are accessible
    else if (file.is_public) {
      hasAccess = true;
    }
    // Check if user is the client who owns the project (for proposal/project attachments)
    else if (file.project_id) {
      const projectResult = await query(
        'SELECT client_id FROM projects WHERE id = $1',
        [file.project_id]
      );
      
      if (projectResult.rows.length > 0 && projectResult.rows[0].client_id === userId) {
        hasAccess = true;
      }
    }
    // Check if user is part of the contract (for milestone attachments)
    else if (file.milestone_id) {
      const milestoneResult = await query(
        `SELECT m.project_id, p.client_id, c.freelancer_id
         FROM project_milestones m
         JOIN projects p ON m.project_id = p.id
         LEFT JOIN contracts c ON c.project_id = p.id
         WHERE m.id = $1`,
        [file.milestone_id]
      );
      
      if (milestoneResult.rows.length > 0) {
        const milestone = milestoneResult.rows[0];
        if (milestone.client_id === userId || milestone.freelancer_id === userId) {
          hasAccess = true;
        }
      }
    }
    // Check if user is part of the contract (for contract files)
    else if (file.contract_id) {
      const contractResult = await query(
        `SELECT c.client_id, c.freelancer_id
         FROM contracts c
         WHERE c.id = $1`,
        [file.contract_id]
      );
      
      if (contractResult.rows.length > 0) {
        const contract = contractResult.rows[0];
        if (contract.client_id === userId || contract.freelancer_id === userId) {
          hasAccess = true;
        }
      }
    }
    // Check if user is involved in the dispute (for dispute evidence)
    else if (file.dispute_id) {
      const disputeResult = await query(
        `SELECT filed_by, respondent_id
         FROM disputes
         WHERE id = $1`,
        [file.dispute_id]
      );
      
      if (disputeResult.rows.length > 0) {
        const dispute = disputeResult.rows[0];
        if (dispute.filed_by === userId || dispute.respondent_id === userId) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this file');
    }

    return formatFileResponse(file);
  } catch (error) {
    logger.error('Error getting file', { fileId, error: error.message });
    throw error;
  }
};

/**
 * Get user's files
 */
const getUserFiles = async (userId, filters = {}) => {
  try {
    const { category, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'uploaded_by = $1 AND status = $2';
    const params = [userId, 'active'];

    if (category) {
      whereClause += ' AND category = $3';
      params.push(category);
    }

    const result = await query(
      `SELECT * FROM files
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM files WHERE ${whereClause}`,
      params
    );

    return {
      files: result.rows.map(formatFileResponse),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting user files', { userId, error: error.message });
    throw error;
  }
};

/**
 * Delete file (soft delete)
 */
const deleteFile = async (fileId, userId, userRole) => {
  try {
    // Get file first
    const fileResult = await query(
      'SELECT * FROM files WHERE id = $1 AND status = $2',
      [fileId, 'active']
    );

    if (fileResult.rows.length === 0) {
      throw new Error('File not found');
    }

    const file = fileResult.rows[0];

    // Check permissions
    if (file.uploaded_by !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized: You can only delete your own files');
    }

    // Soft delete
    await query('SELECT soft_delete_file($1)', [fileId]);

    logger.info('File deleted', { fileId, userId });

    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    logger.error('Error deleting file', { fileId, error: error.message });
    throw error;
  }
};

/**
 * Get user storage usage
 */
const getUserStorageUsage = async (userId) => {
  try {
    const result = await query(
      'SELECT * FROM get_user_storage_usage($1)',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        sizeByCategory: {}
      };
    }

    const stats = result.rows[0];

    return {
      totalFiles: parseInt(stats.total_files || 0),
      totalSize: parseInt(stats.total_size || 0),
      totalSizeMB: (parseInt(stats.total_size || 0) / 1024 / 1024).toFixed(2),
      sizeByCategory: stats.size_by_category || {}
    };
  } catch (error) {
    logger.error('Error getting storage usage', { userId, error: error.message });
    throw error;
  }
};

/**
 * Generate temporary download link
 */
const generateDownloadLink = async (fileId, userId, expiresIn = 1) => {
  try {
    const file = await getFileById(fileId, userId, null);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);

    await query(
      `UPDATE files
       SET access_token = $1, token_expires_at = $2
       WHERE id = $3`,
      [token, expiresAt, fileId]
    );

    const downloadUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/files/download/${fileId}?token=${token}`;

    return {
      downloadUrl,
      expiresAt
    };
  } catch (error) {
    logger.error('Error generating download link', { fileId, error: error.message });
    throw error;
  }
};

/**
 * Cleanup expired files
 */
const cleanupExpiredFiles = async () => {
  try {
    const result = await query('SELECT cleanup_expired_files()');
    const deletedCount = result.rows[0].cleanup_expired_files;

    logger.info('Cleaned up expired files', { deletedCount });

    return { deletedCount };
  } catch (error) {
    logger.error('Error cleaning up expired files', { error: error.message });
    throw error;
  }
};

// Format response
const formatFileResponse = (file) => {
  return {
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
    status: file.status,
    uploadedBy: file.uploaded_by,
    projectId: file.project_id,
    contractId: file.contract_id,
    milestoneId: file.milestone_id,
    proposalId: file.proposal_id,
    disputeId: file.dispute_id,
    isPublic: file.is_public,
    isScanned: file.is_scanned,
    scanStatus: file.scan_status,
    createdAt: file.created_at,
    expiresAt: file.expires_at
  };
};

module.exports = {
  uploadFile,
  getFileById,
  getUserFiles,
  deleteFile,
  getUserStorageUsage,
  generateDownloadLink,
  cleanupExpiredFiles,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES
};
