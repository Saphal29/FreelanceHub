const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_CLIENT = {
  email: 'client@test.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as client...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_CLIENT);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function createProjectWithMilestones() {
  try {
    console.log('\n➕ Creating project with milestones...');
    
    const projectData = {
      title: 'Test Project with Milestones',
      description: 'This is a test project to verify milestone creation during project posting',
      category: 'Web Development',
      skills: ['React', 'Node.js'],
      budgetMin: 5000,
      budgetMax: 10000,
      projectType: 'fixed_price',
      experienceLevel: 'intermediate',
      durationEstimate: '2-3 months',
      isRemote: true,
      visibility: 'public',
      status: 'active',
      milestones: [
        {
          title: 'Phase 1: Planning',
          description: 'Project planning and requirements gathering',
          amount: 2000,
          dueDate: '2026-04-15',
          orderIndex: 0
        },
        {
          title: 'Phase 2: Development',
          description: 'Core development work',
          amount: 5000,
          dueDate: '2026-05-15',
          orderIndex: 1
        },
        {
          title: 'Phase 3: Testing',
          description: 'Testing and bug fixes',
          amount: 2000,
          dueDate: '2026-06-01',
          orderIndex: 2
        }
      ]
    };
    
    console.log('📦 Project data:', JSON.stringify(projectData, null, 2));
    
    const response = await axios.post(
      `${API_URL}/projects`,
      projectData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      const project = response.data.project;
      console.log('✅ Project created:', project.id);
      console.log('   Title:', project.title);
      console.log('   Milestones in response:', project.milestones?.length || 0);
      
      if (project.milestones && project.milestones.length > 0) {
        console.log('\n📋 Milestones:');
        project.milestones.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title} - $${m.amount}`);
        });
      } else {
        console.log('⚠️  No milestones in response!');
      }
      
      // Now fetch the project again to verify milestones are saved
      console.log('\n🔍 Fetching project to verify milestones...');
      const fetchResponse = await axios.get(
        `${API_URL}/projects/${project.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (fetchResponse.data.success) {
        const fetchedProject = fetchResponse.data.project;
        console.log('✅ Project fetched');
        console.log('   Milestones:', fetchedProject.milestones?.length || 0);
        
        if (fetchedProject.milestones && fetchedProject.milestones.length > 0) {
          console.log('\n📋 Fetched Milestones:');
          fetchedProject.milestones.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.title} - $${m.amount}`);
          });
        } else {
          console.log('❌ No milestones found in database!');
        }
      }
      
      return true;
    } else {
      console.error('❌ Failed to create project:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating project:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function runTest() {
  console.log('🚀 Testing Project Creation with Milestones\n');
  console.log('='.repeat(60));
  
  if (!await login()) {
    console.log('\n❌ Test aborted - login failed');
    return;
  }
  
  await createProjectWithMilestones();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!');
}

runTest().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
