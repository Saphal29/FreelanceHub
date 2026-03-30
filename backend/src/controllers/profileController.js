const { pool } = require('../config/database');
const { searchFreelancers: searchFreelancersService } = require('../services/profileService');

/**
 * Search freelancers
 */
const searchFreelancers = async (req, res) => {
  try {
    const searchParams = req.query;
    const freelancers = await searchFreelancersService(searchParams);
    
    res.json({
      success: true,
      freelancers
    });
  } catch (error) {
    console.error('Error searching freelancers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search freelancers'
    });
  }
};

/**
 * Get freelancer public profile with completed projects and reviews
 */
const getFreelancerProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user basic info and freelancer profile
    const userQuery = `
      SELECT 
        u.id, u.full_name, u.email, u.role, u.phone, u.avatar_url,
        fp.title, fp.bio, fp.skills, fp.hourly_rate, 
        fp.location, fp.availability_status, fp.website
      FROM users u
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE u.id = $1 AND u.role = 'FREELANCER'
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Freelancer not found'
      });
    }

    const profile = userResult.rows[0];

    // Get completed projects
    const projectsQuery = `
      SELECT 
        p.id, p.title, p.description, p.category,
        c.agreed_budget as budget,
        c.updated_at as completed_at
      FROM projects p
      INNER JOIN contracts c ON p.id = c.project_id
      WHERE c.freelancer_id = $1 
        AND c.status = 'completed'
      ORDER BY c.updated_at DESC
      LIMIT 10
    `;
    
    const projectsResult = await pool.query(projectsQuery, [userId]);

    // Get reviews
    const reviewsQuery = `
      SELECT 
        r.id, r.overall_rating, r.feedback, r.created_at,
        u.full_name as client_name,
        p.title as project_title
      FROM reviews r
      INNER JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN contracts c ON r.contract_id = c.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC
      LIMIT 20
    `;
    
    const reviewsResult = await pool.query(reviewsQuery, [userId]);

    // Calculate stats
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_jobs_completed,
        COUNT(DISTINCT r.id) as total_reviews,
        COALESCE(AVG(r.overall_rating), 0) as average_rating
      FROM contracts c
      LEFT JOIN reviews r ON r.reviewee_id = c.freelancer_id
      WHERE c.freelancer_id = $1 AND c.status = 'completed'
    `;
    
    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        title: profile.title,
        bio: profile.bio,
        skills: profile.skills,
        hourlyRate: profile.hourly_rate,
        location: profile.location,
        availability: profile.availability_status,
        avatarUrl: profile.avatar_url,
        phone: profile.phone,
        website: profile.website,
        totalJobsCompleted: parseInt(stats.total_jobs_completed) || 0,
        totalReviews: parseInt(stats.total_reviews) || 0,
        averageRating: parseFloat(stats.average_rating) || 0,
        completedProjects: projectsResult.rows,
        reviews: reviewsResult.rows.map(r => ({
          id: r.id,
          rating: r.overall_rating,
          comment: r.feedback,
          createdAt: r.created_at,
          clientName: r.client_name,
          projectTitle: r.project_title
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching freelancer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

module.exports = {
  searchFreelancers,
  getFreelancerProfile
};
