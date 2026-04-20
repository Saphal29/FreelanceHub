const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

const getAllUsers = async (filters = {}) => {
  try {
    const { role, verified, search, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = filters;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    if (verified !== undefined) {
      whereConditions.push(`u.verified = $${paramIndex}`);
      params.push(verified);
      paramIndex++;
    }
    if (search) {
      whereConditions.push(`(u.email ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countResult = await query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);
    const result = await query(
      `SELECT u.id, u.email, u.role, u.full_name, u.phone, u.avatar_url, u.verified, u.created_at, u.updated_at, u.last_login,
       fp.hourly_rate, fp.experience_years, fp.availability_status, cp.company_name, cp.industry,
       (SELECT COUNT(*) FROM projects WHERE client_id = u.id) as projects_count,
       (SELECT COUNT(*) FROM contracts WHERE freelancer_id = u.id OR client_id = u.id) as contracts_count
       FROM users u
       LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    return { users: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } };
  } catch (error) {
    logger.error('Error getting all users', { error: error.message });
    throw error;
  }
};

const getUserStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'FREELANCER') as freelancers,
        COUNT(*) FILTER (WHERE role = 'CLIENT') as clients,
        COUNT(*) FILTER (WHERE role = 'ADMIN') as admins,
        COUNT(*) FILTER (WHERE verified = true) as verified_users,
        COUNT(*) FILTER (WHERE verified = false) as unverified_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') as active_users_7d
      FROM users
    `);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting user stats', { error: error.message });
    throw error;
  }
};

const suspendUser = async (userId, reason) => {
  try {
    await query(`UPDATE users SET verified = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
    logger.info('User suspended', { userId, reason });
    return { success: true, message: 'User suspended successfully' };
  } catch (error) {
    logger.error('Error suspending user', { userId, error: error.message });
    throw error;
  }
};

const verifyUserAccount = async (userId) => {
  try {
    await query(`UPDATE users SET verified = true, verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
    logger.info('User verified by admin', { userId });
    return { success: true, message: 'User verified successfully' };
  } catch (error) {
    logger.error('Error verifying user', { userId, error: error.message });
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    logger.info('User deleted by admin', { userId });
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    logger.error('Error deleting user', { userId, error: error.message });
    throw error;
  }
};

const getAllProjects = async (filters = {}) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = filters;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    if (status) {
      whereConditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (category) {
      whereConditions.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (search) {
      whereConditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countResult = await query(`SELECT COUNT(*) as total FROM projects p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);
    const result = await query(
      `SELECT p.*, u.full_name as client_name, u.email as client_email,
       (SELECT COUNT(*) FROM project_proposals WHERE project_id = p.id) as proposals_count,
       (SELECT COUNT(*) FROM contracts WHERE project_id = p.id) as contracts_count
       FROM projects p JOIN users u ON p.client_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    return { projects: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } };
  } catch (error) {
    logger.error('Error getting all projects', { error: error.message });
    throw error;
  }
};

const getProjectStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_projects,
        COUNT(*) FILTER (WHERE status = 'active') as active_projects,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_projects,
        COUNT(*) FILTER (WHERE status = 'archived') as archived_projects,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_projects_30d
      FROM projects
    `);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting project stats', { error: error.message });
    throw error;
  }
};

const deleteProject = async (projectId) => {
  try {
    await query(`DELETE FROM projects WHERE id = $1`, [projectId]);
    logger.info('Project deleted by admin', { projectId });
    return { success: true, message: 'Project deleted successfully' };
  } catch (error) {
    logger.error('Error deleting project', { projectId, error: error.message });
    throw error;
  }
};

const getAllDisputes = async (filters = {}) => {
  try {
    const { status, category, page = 1, limit = 20 } = filters;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    if (status) {
      whereConditions.push(`d.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (category) {
      whereConditions.push(`d.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countResult = await query(`SELECT COUNT(*) as total FROM disputes d ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);
    const result = await query(
      `SELECT d.*, p.title as project_title, filer.full_name as filed_by_name, resp.full_name as respondent_name, med.full_name as mediator_name
       FROM disputes d
       JOIN projects p ON d.project_id = p.id
       JOIN users filer ON d.filed_by = filer.id
       JOIN users resp ON d.respondent_id = resp.id
       LEFT JOIN users med ON d.mediator_id = med.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    return { disputes: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } };
  } catch (error) {
    logger.error('Error getting all disputes', { error: error.message });
    throw error;
  }
};

const getDisputeStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_disputes,
        COUNT(*) FILTER (WHERE status = 'open') as open_disputes,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review_disputes,
        COUNT(*) FILTER (WHERE status = 'in_mediation') as in_mediation_disputes,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_disputes,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_disputes,
        COUNT(*) FILTER (WHERE mediator_id IS NULL AND status NOT IN ('resolved', 'closed')) as unassigned_disputes
      FROM disputes
    `);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting dispute stats', { error: error.message });
    throw error;
  }
};

const getAllTransactions = async (filters = {}) => {
  try {
    const { status, page = 1, limit = 20 } = filters;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    if (status) {
      whereConditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countResult = await query(`SELECT COUNT(*) as total FROM payments p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);
    const result = await query(
      `SELECT p.*, c.agreed_budget as contract_budget, proj.title as project_title, client.full_name as client_name, freelancer.full_name as freelancer_name
       FROM payments p
       JOIN contracts c ON p.contract_id = c.id
       JOIN projects proj ON c.project_id = proj.id
       JOIN users client ON c.client_id = client.id
       JOIN users freelancer ON c.freelancer_id = freelancer.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    return { transactions: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } };
  } catch (error) {
    logger.error('Error getting all transactions', { error: error.message });
    throw error;
  }
};

const getFinancialStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
        SUM(platform_fee) FILTER (WHERE status = 'completed') as platform_revenue,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_transactions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
        SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d
      FROM payments
    `);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting financial stats', { error: error.message });
    throw error;
  }
};

const getDashboardStats = async () => {
  try {
    const [userStats, projectStats, disputeStats, financialStats] = await Promise.all([
      getUserStats(),
      getProjectStats(),
      getDisputeStats(),
      getFinancialStats()
    ]);
    return { users: userStats, projects: projectStats, disputes: disputeStats, financial: financialStats };
  } catch (error) {
    logger.error('Error getting dashboard stats', { error: error.message });
    throw error;
  }
};

module.exports = {
  getAllUsers, getUserStats, suspendUser, verifyUserAccount, deleteUser,
  getAllProjects, getProjectStats, deleteProject,
  getAllDisputes, getDisputeStats,
  getAllTransactions, getFinancialStats,
  getDashboardStats
};
