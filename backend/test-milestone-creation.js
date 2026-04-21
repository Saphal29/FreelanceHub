const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const CLIENT_EMAIL = '[email]'; // Replace with your test client email
const CLIENT_PASSWORD = '[password]'; // Replace with your test client password

let authToken = '';
let projectId = '';

async function login() {
  console.log('\n🔐 Logging in as client...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('User:', response.data.user.email, '- Role:', response.data.user.role);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function createProjectWithMilestones() {
  console.log('\n📝 Creating project with milestones...');
  
  const projectData = {
    title: 'Test Project with Milestones',
    description: 'This is a test project to verify milestone creation',
    category: 'Programming & Tech',
    skills: ['JavaScript', 'Node.js', 'React'],
    budgetMin: 1000,
    budgetMax: 5000,
    projectType: 'fixed_price',
    experienceLevel: 'intermediate',
    durationEstimate: '2-3 months',
    isRemote: true,
    visibility: 'public',
    status: 'draft',
    milestones: [
      {
        title: 'Phase 1: Planning',
        description: 'Initial planning and requirements gathering',
        amount: 1000,
        dueDate: '2026-04-01',
        orderIndex: 0
      },
      {
        title: 'Phase 2: Development',
        description: 'Core development work',
        amount: 2500,
        dueDate: '2026-05-01',
        orderIndex: 1
      },
      {
        title: 'Phase 3: Testing',
        description: 'Testing and bug fixes',
        amount: 1000,
        dueDate: '2026-05-15',
        orderIndex: 2
      },
      {
        title: 'Phase 4: Deployment',
        description: 'Final deployment and handover',
        amount: 500,
        dueDate: '2026-06-01',
        orderIndex: 3
      }
    ]
  };
  
  try {
    const response = await axios.post(`${API_URL}/projects`, projectData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      projectId = response.data.project.id;
      console.log('✅ Project created successfully');
      console.log('Project ID:', projectId);
      console.log('Project Title:', response.data.project.title);
      console.log('Milestones in response:', response.data.project.milestones?.length || 0);
      
      if (response.data.project.milestones && response.data.project.milestones.length > 0) {
        console.log('\n📋 Milestones created:');
        response.data.project.milestones.forEach((m, i) => {
          console.log(`  ${i + 1}. ${m.title} - $${m.amount}`);
        });
      } else {
        console.log('⚠️  No milestones in project response!');
      }
      
      return true;
    } else {
      console.log('❌ Project creation failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Project creation error:', error.response?.data || error.message);
    return false;
  }
}

async function fetchMilestones() {
  console.log('\n📥 Fetching milestones for project...');
  
  try {
    const response = await axios.get(`${API_URL}/projects/${projectId}/milestones`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Milestones fetched successfully');
      console.log('Count:', response.data.milestones.length);
      
      if (response.data.milestones.length > 0) {
        console.log('\n📋 Milestones:');
        response.data.milestones.forEach((m, i) => {
          console.log(`  ${i + 1}. ${m.title} - $${m.amount} (${m.status})`);
        });
      } else {
        console.log('⚠️  No milestones found in database!');
      }
      
      return true;
    } else {
      console.log('❌ Failed to fetch milestones:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Fetch milestones error:', error.response?.data || error.message);
    return false;
  }
}

async function runTest() {
  console.log('============================================================');
  console.log('Testing Project Creation with Milestones');
  console.log('============================================================');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Test aborted - login failed');
    return;
  }
  
  const createSuccess = await createProjectWithMilestones();
  if (!createSuccess) {
    console.log('\n❌ Test aborted - project creation failed');
    return;
  }
  
  await fetchMilestones();
  
  console.log('\n============================================================');
  console.log('Test Complete');
  console.log('============================================================');
}

runTest();
