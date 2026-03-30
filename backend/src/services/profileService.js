const { query, transaction } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Get complete user profile with all related data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Complete profile data
 */
const getCompleteProfile = async (userId) => {
  try {
    logger.info('Getting complete profile', { userId });
    
    const result = await query(
      `SELECT 
        u.id, u.email, u.full_name, u.phone, u.avatar_url, u.verified, u.role, u.created_at,
        -- Freelancer profile data
        fp.id as freelancer_profile_id, fp.bio, fp.skills, fp.hourly_rate, fp.experience_years,
        fp.availability_status, fp.title, fp.location, fp.website, fp.languages, fp.timezone,
        fp.profile_completion_percentage, fp.total_earnings, fp.total_jobs_completed,
        fp.average_rating, fp.response_time_hours, fp.is_featured,
        -- Client profile data
        cp.id as client_profile_id, cp.company_name, cp.industry, cp.company_size,
        cp.company_description, cp.location as client_location, cp.founded_year,
        cp.employee_count, cp.annual_revenue, cp.company_logo_url, cp.linkedin_url,
        cp.twitter_url, cp.facebook_url, cp.total_projects_posted, cp.total_amount_spent,
        cp.average_rating as client_rating, cp.preferred_communication
       FROM users u
       LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      logger.warn('User not found for profile', { userId });
      return null;
    }
    
    // Format response based on role
    const profile = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      verified: user.verified,
      role: user.role,
      createdAt: user.created_at
    };
    
    if (user.role === 'FREELANCER' && user.freelancer_profile_id) {
      profile.freelancerProfile = {
        id: user.freelancer_profile_id,
        title: user.title,
        bio: user.bio,
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || '',
        hourlyRate: user.hourly_rate,
        experienceYears: user.experience_years,
        availabilityStatus: user.availability_status,
        location: user.location,
        website: user.website,
        languages: user.languages || [],
        timezone: user.timezone,
        profileCompletionPercentage: user.profile_completion_percentage || 0,
        totalEarnings: user.total_earnings || 0,
        totalJobsCompleted: user.total_jobs_completed || 0,
        averageRating: user.average_rating || 0,
        responseTimeHours: user.response_time_hours || 24,
        isFeatured: user.is_featured || false
      };
    }
    
    if (user.role === 'CLIENT' && user.client_profile_id) {
      profile.clientProfile = {
        id: user.client_profile_id,
        companyName: user.company_name,
        industry: user.industry,
        companySize: user.company_size,
        companyDescription: user.company_description,
        location: user.client_location,
        foundedYear: user.founded_year,
        employeeCount: user.employee_count,
        annualRevenue: user.annual_revenue,
        companyLogoUrl: user.company_logo_url,
        linkedinUrl: user.linkedin_url,
        twitterUrl: user.twitter_url,
        facebookUrl: user.facebook_url,
        totalProjectsPosted: user.total_projects_posted || 0,
        totalAmountSpent: user.total_amount_spent || 0,
        averageRating: user.client_rating || 0,
        preferredCommunication: user.preferred_communication || 'email'
      };
    }
    
    logger.info('Profile retrieved successfully', { userId, role: user.role });
    return profile;
  } catch (error) {
    logger.error('Error getting complete profile', { userId, error: error.message });
    throw error;
  }
};

/**
 * Update user profile with role-specific data
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile data
 */
const updateProfile = async (userId, role, profileData) => {
  try {
    logger.info('Updating profile', { userId, role, fields: Object.keys(profileData) });
    
    const result = await transaction(async (client) => {
      // Update base user fields
      const userFields = ['fullName', 'phone', 'website'];
      const userUpdates = {};
      
      userFields.forEach(field => {
        if (profileData[field] !== undefined) {
          userUpdates[field] = profileData[field];
        }
      });
      
      if (Object.keys(userUpdates).length > 0) {
        const userSetClause = Object.keys(userUpdates).map((key, index) => {
          const dbField = key === 'fullName' ? 'full_name' : key;
          return `${dbField} = $${index + 2}`;
        }).join(', ');
        
        const userValues = [userId, ...Object.values(userUpdates)];
        
        await client.query(
          `UPDATE users SET ${userSetClause} WHERE id = $1`,
          userValues
        );
        
        logger.info('User base fields updated', { userId, fields: Object.keys(userUpdates) });
      }
      
      // Update role-specific profile
      if (role === 'FREELANCER') {
        const freelancerFields = {
          title: 'title',
          bio: 'bio',
          skills: 'skills',
          hourlyRate: 'hourly_rate',
          availabilityStatus: 'availability_status',
          location: 'location',
          website: 'website',
          languages: 'languages',
          timezone: 'timezone'
        };
        
        const freelancerUpdates = {};
        Object.keys(freelancerFields).forEach(field => {
          if (profileData[field] !== undefined) {
            let value = profileData[field];
            
            // Handle skills field - convert string to array for PostgreSQL
            if (field === 'skills' && typeof value === 'string') {
              value = value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
            }
            
            // Handle languages field - ensure it's an array
            if (field === 'languages' && typeof value === 'string') {
              value = value.split(',').map(lang => lang.trim()).filter(lang => lang.length > 0);
            }
            
            freelancerUpdates[freelancerFields[field]] = value;
          }
        });
        
        if (Object.keys(freelancerUpdates).length > 0) {
          const setClause = Object.keys(freelancerUpdates).map((key, index) => 
            `${key} = $${index + 2}`
          ).join(', ');
          
          const values = [userId, ...Object.values(freelancerUpdates)];
          
          await client.query(
            `UPDATE freelancer_profiles SET ${setClause} WHERE user_id = $1`,
            values
          );
          
          logger.info('Freelancer profile updated', { userId, fields: Object.keys(freelancerUpdates) });
        }
      } else if (role === 'CLIENT') {
        const clientFields = {
          companyName: 'company_name',
          industry: 'industry',
          companySize: 'company_size',
          companyDescription: 'company_description',
          location: 'location',
          foundedYear: 'founded_year',
          employeeCount: 'employee_count',
          annualRevenue: 'annual_revenue',
          companyLogoUrl: 'company_logo_url',
          linkedinUrl: 'linkedin_url',
          twitterUrl: 'twitter_url',
          facebookUrl: 'facebook_url',
          preferredCommunication: 'preferred_communication'
        };
        
        const clientUpdates = {};
        Object.keys(clientFields).forEach(field => {
          if (profileData[field] !== undefined) {
            clientUpdates[clientFields[field]] = profileData[field];
          }
        });
        
        if (Object.keys(clientUpdates).length > 0) {
          const setClause = Object.keys(clientUpdates).map((key, index) => 
            `${key} = $${index + 2}`
          ).join(', ');
          
          const values = [userId, ...Object.values(clientUpdates)];
          
          await client.query(
            `UPDATE client_profiles SET ${setClause} WHERE user_id = $1`,
            values
          );
          
          logger.info('Client profile updated', { userId, fields: Object.keys(clientUpdates) });
        }
      }
      
      // Return updated profile
      return await getCompleteProfile(userId);
    });
    
    logger.info('Profile update completed', { userId, role });
    return result;
  } catch (error) {
    logger.error('Error updating profile', { userId, role, error: error.message });
    throw error;
  }
};

/**
 * Update user avatar URL
 * @param {string} userId - User ID
 * @param {string} avatarUrl - New avatar URL
 * @returns {Promise<void>}
 */
const updateAvatar = async (userId, avatarUrl) => {
  try {
    logger.info('Updating avatar', { userId });
    
    await query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2`,
      [avatarUrl, userId]
    );
    
    logger.info('Avatar updated successfully', { userId });
  } catch (error) {
    logger.error('Error updating avatar', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get freelancer skills
 * @param {string} freelancerId - Freelancer profile ID
 * @returns {Promise<Array>} Array of skills
 */
const getFreelancerSkills = async (freelancerId) => {
  try {
    logger.info('Getting freelancer skills', { freelancerId });
    
    const result = await query(
      `SELECT id, skill_name, proficiency_level, years_experience, is_primary, created_at
       FROM freelancer_skills
       WHERE freelancer_id = $1
       ORDER BY is_primary DESC, proficiency_level DESC, skill_name ASC`,
      [freelancerId]
    );
    
    const skills = result.rows.map(skill => ({
      id: skill.id,
      skillName: skill.skill_name,
      proficiencyLevel: skill.proficiency_level,
      yearsExperience: skill.years_experience,
      isPrimary: skill.is_primary,
      createdAt: skill.created_at
    }));
    
    logger.info('Skills retrieved', { freelancerId, count: skills.length });
    return skills;
  } catch (error) {
    logger.error('Error getting freelancer skills', { freelancerId, error: error.message });
    throw error;
  }
};

/**
 * Add or update freelancer skill
 * @param {string} freelancerId - Freelancer profile ID
 * @param {Object} skillData - Skill data
 * @returns {Promise<Object>} Created/updated skill
 */
const upsertFreelancerSkill = async (freelancerId, skillData) => {
  try {
    logger.info('Upserting freelancer skill', { freelancerId, skill: skillData.skillName });
    
    const result = await query(
      `INSERT INTO freelancer_skills (freelancer_id, skill_name, proficiency_level, years_experience, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, skill_name, proficiency_level, years_experience, is_primary, created_at`,
      [
        freelancerId,
        skillData.skillName,
        skillData.proficiencyLevel || 1,
        skillData.yearsExperience || 0,
        skillData.isPrimary || false
      ]
    );
    
    const skill = result.rows[0];
    
    logger.info('Skill upserted successfully', { freelancerId, skillId: skill.id });
    
    return {
      id: skill.id,
      skillName: skill.skill_name,
      proficiencyLevel: skill.proficiency_level,
      yearsExperience: skill.years_experience,
      isPrimary: skill.is_primary,
      createdAt: skill.created_at
    };
  } catch (error) {
    logger.error('Error upserting freelancer skill', { freelancerId, error: error.message });
    throw error;
  }
};

/**
 * Delete freelancer skill
 * @param {string} freelancerId - Freelancer profile ID
 * @param {string} skillId - Skill ID
 * @returns {Promise<boolean>} Success status
 */
const deleteFreelancerSkill = async (freelancerId, skillId) => {
  try {
    logger.info('Deleting freelancer skill', { freelancerId, skillId });
    
    const result = await query(
      `DELETE FROM freelancer_skills 
       WHERE id = $1 AND freelancer_id = $2`,
      [skillId, freelancerId]
    );
    
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      logger.info('Skill deleted successfully', { freelancerId, skillId });
    } else {
      logger.warn('Skill not found or not owned by freelancer', { freelancerId, skillId });
    }
    
    return deleted;
  } catch (error) {
    logger.error('Error deleting freelancer skill', { freelancerId, skillId, error: error.message });
    throw error;
  }
};

/**
 * Search freelancers by skills and location
 * @param {Object} searchQuery - Search parameters
 * @returns {Promise<Array>} Array of matching freelancers
 */
const searchFreelancers = async (searchQuery) => {
  try {
    const { skills, location, minRating, maxRate, availability, search } = searchQuery;

    logger.info('Searching freelancers', { searchQuery });

    let whereConditions = ['u.role = $1', 'u.verified = true'];
    let params = ['FREELANCER'];
    let paramIndex = 2;

    // Add general search filter (searches name, title, bio, skills)
    if (search && search.trim()) {
      whereConditions.push(`(
        u.full_name ILIKE $${paramIndex} OR
        fp.title ILIKE $${paramIndex} OR
        fp.bio ILIKE $${paramIndex} OR
        fp.skills::text ILIKE $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM freelancer_skills fs
          WHERE fs.freelancer_id = fp.id
          AND fs.skill_name ILIKE $${paramIndex}
        )
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Add skills filter
    if (skills && skills.length > 0) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      whereConditions.push(`(
        fp.skills::text ILIKE ANY($${paramIndex}) OR
        EXISTS (
          SELECT 1 FROM freelancer_skills fs
          WHERE fs.freelancer_id = fp.id
          AND fs.skill_name ILIKE ANY($${paramIndex})
        )
      )`);
      params.push(skillsArray.map(skill => `%${skill}%`));
      paramIndex++;
    }

    // Add location filter
    if (location) {
      whereConditions.push(`fp.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    // Add rating filter
    if (minRating) {
      whereConditions.push(`fp.average_rating >= $${paramIndex}`);
      params.push(minRating);
      paramIndex++;
    }

    // Add rate filter
    if (maxRate) {
      whereConditions.push(`fp.hourly_rate <= $${paramIndex}`);
      params.push(maxRate);
      paramIndex++;
    }

    // Add availability filter
    if (availability) {
      whereConditions.push(`fp.availability_status = $${paramIndex}`);
      params.push(availability);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(
      `SELECT
        u.id, u.full_name, u.avatar_url,
        fp.title, fp.bio, fp.skills, fp.hourly_rate, fp.location,
        fp.average_rating, fp.total_jobs_completed, fp.availability_status,
        fp.is_featured, fp.response_time_hours
       FROM users u
       JOIN freelancer_profiles fp ON u.id = fp.user_id
       WHERE ${whereClause}
       ORDER BY fp.is_featured DESC, fp.average_rating DESC, fp.total_jobs_completed DESC
       LIMIT 50`,
      params
    );

    const freelancers = result.rows.map(freelancer => ({
      id: freelancer.id,
      fullName: freelancer.full_name,
      avatarUrl: freelancer.avatar_url,
      title: freelancer.title,
      bio: freelancer.bio,
      skills: freelancer.skills,
      hourlyRate: freelancer.hourly_rate,
      location: freelancer.location,
      averageRating: freelancer.average_rating,
      totalJobsCompleted: freelancer.total_jobs_completed,
      availabilityStatus: freelancer.availability_status,
      isFeatured: freelancer.is_featured,
      responseTimeHours: freelancer.response_time_hours
    }));

    logger.info('Freelancer search completed', {
      searchQuery,
      resultsCount: freelancers.length
    });

    return freelancers;
  } catch (error) {
    logger.error('Error searching freelancers', { searchQuery, error: error.message });
    throw error;
  }
}

module.exports = {
  getCompleteProfile,
  updateProfile,
  updateAvatar,
  getFreelancerSkills,
  upsertFreelancerSkill,
  deleteFreelancerSkill,
  searchFreelancers
};