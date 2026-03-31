const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Send project invitation to freelancer
 * POST /api/invites/send
 */
const sendInvitation = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const { freelancerId, projectId, message } = req.body;

    // Validate input
    if (!freelancerId || !projectId) {
      return res.status(400).json({
        success: false,
        error: 'Freelancer ID and Project ID are required'
      });
    }

    // Verify the project belongs to the client
    const projectQuery = `
      SELECT id, title, client_id 
      FROM projects 
      WHERE id = $1 AND client_id = $2
    `;
    const projectResult = await pool.query(projectQuery, [projectId, clientId]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or you do not have permission'
      });
    }

    const project = projectResult.rows[0];

    // Verify the freelancer exists
    const freelancerQuery = `
      SELECT id, full_name, email 
      FROM users 
      WHERE id = $1 AND role = 'FREELANCER'
    `;
    const freelancerResult = await pool.query(freelancerQuery, [freelancerId]);

    if (freelancerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Freelancer not found'
      });
    }

    const freelancer = freelancerResult.rows[0];

    // Create notification for the freelancer
    const notificationQuery = `
      INSERT INTO notifications (
        user_id, type, title, message, project_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const notificationTitle = 'Project Invitation';
    const notificationMessage = message 
      ? `You've been invited to "${project.title}". ${message}`
      : `You've been invited to work on "${project.title}". Click to view details and submit a proposal.`;

    const notificationResult = await pool.query(notificationQuery, [
      freelancerId,
      'project_invitation',
      notificationTitle,
      notificationMessage,
      projectId
    ]);

    logger.info('Project invitation sent', {
      clientId,
      freelancerId,
      projectId,
      notificationId: notificationResult.rows[0].id
    });

    res.json({
      success: true,
      message: `Invitation sent to ${freelancer.full_name}`,
      notification: notificationResult.rows[0]
    });

  } catch (error) {
    logger.error('Error sending invitation', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation'
    });
  }
};

/**
 * Get client's projects for invitation
 * GET /api/invites/my-projects
 */
const getClientProjectsForInvite = async (req, res) => {
  try {
    const clientId = req.user.userId;

    // Get active projects (not completed or cancelled)
    const query = `
      SELECT 
        id, title, description, category, 
        budget_min, budget_max, project_type,
        status, created_at
      FROM projects
      WHERE client_id = $1 
        AND status IN ('active', 'in_progress')
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [clientId]);

    res.json({
      success: true,
      projects: result.rows
    });

  } catch (error) {
    logger.error('Error fetching client projects', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
};

module.exports = {
  sendInvitation,
  getClientProjectsForInvite
};
