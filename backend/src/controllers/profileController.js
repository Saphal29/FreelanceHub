const { pool } = require('../config/database');
const { searchFreelancers: searchFreelancersService } = require('../services/profileService');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get current user's profile
 */
const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let query;
    if (role === 'FREELANCER') {
      query = `
        SELECT 
          u.id, u.full_name, u.email, u.role, u.phone, u.avatar_url, u.verified,
          fp.title, fp.bio, fp.skills, fp.hourly_rate, fp.experience_years,
          fp.location, fp.availability_status, fp.website
        FROM users u
        LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
        WHERE u.id = $1
      `;
    } else if (role === 'CLIENT') {
      query = `
        SELECT 
          u.id, u.full_name, u.email, u.role, u.phone, u.avatar_url, u.verified,
          cp.company_name, cp.industry, cp.website
        FROM users u
        LEFT JOIN client_profiles cp ON u.id = cp.user_id
        WHERE u.id = $1
      `;
    } else {
      query = `
        SELECT 
          u.id, u.full_name, u.email, u.role, u.phone, u.avatar_url, u.verified
        FROM users u
        WHERE u.id = $1
      `;
    }

    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const profile = result.rows[0];
    
    res.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        avatarUrl: profile.avatar_url,
        verified: profile.verified,
        ...(role === 'FREELANCER' && {
          title: profile.title,
          bio: profile.bio,
          skills: profile.skills,
          hourlyRate: profile.hourly_rate,
          experienceYears: profile.experience_years,
          location: profile.location,
          availability: profile.availability_status,
          website: profile.website
        }),
        ...(role === 'CLIENT' && {
          companyName: profile.company_name,
          industry: profile.industry,
          website: profile.website
        })
      }
    });
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

/**
 * Update current user's profile
 */
const updateCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const updates = req.body;

    // Update user table fields
    const userFields = ['full_name', 'phone'];
    const userUpdates = {};
    
    userFields.forEach(field => {
      if (updates[field] !== undefined) {
        userUpdates[field] = updates[field];
      }
    });

    if (Object.keys(userUpdates).length > 0) {
      const setClause = Object.keys(userUpdates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [userId, ...Object.values(userUpdates)];
      await pool.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1`,
        values
      );
    }

    // Update profile table fields
    if (role === 'FREELANCER') {
      const profileFields = ['title', 'bio', 'skills', 'hourly_rate', 'experience_years', 'location', 'availability_status', 'website'];
      const profileUpdates = {};
      
      profileFields.forEach(field => {
        if (updates[field] !== undefined) {
          profileUpdates[field] = updates[field];
        }
      });

      if (Object.keys(profileUpdates).length > 0) {
        const setClause = Object.keys(profileUpdates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        const values = [userId, ...Object.values(profileUpdates)];
        await pool.query(
          `UPDATE freelancer_profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
          values
        );
      }
    } else if (role === 'CLIENT') {
      const profileFields = ['company_name', 'industry', 'website'];
      const profileUpdates = {};
      
      profileFields.forEach(field => {
        if (updates[field] !== undefined) {
          profileUpdates[field] = updates[field];
        }
      });

      if (Object.keys(profileUpdates).length > 0) {
        const setClause = Object.keys(profileUpdates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        const values = [userId, ...Object.values(profileUpdates)];
        await pool.query(
          `UPDATE client_profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
          values
        );
      }
    }

    // Fetch updated profile
    const updatedProfile = await getCurrentUserProfile(req, res);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

/**
 * Upload profile image
 */
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Get old avatar URL to delete old file
    const oldAvatarResult = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );
    
    const oldAvatarUrl = oldAvatarResult.rows[0]?.avatar_url;

    // Update user's avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, userId]
    );

    // Delete old avatar file if it exists
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      try {
        const oldFilePath = path.join(__dirname, '../../', oldAvatarUrl);
        await fs.unlink(oldFilePath);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
};

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
  getFreelancerProfile,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  uploadProfileImage
};
