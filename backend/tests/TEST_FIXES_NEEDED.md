# Test Fixes Required

## Summary of Issues

### ProjectService Tests
- Missing functions: `searchProjects()` - use `getProjects()` with search filter instead
- `createProject()` needs to mock `getProjectById()` call at the end
- `updateProject()` needs to mock `getProjectById()` call at the end  
- `deleteProject()` needs proper mock for proposals count query
- `getProjects()` returns `{projects: [], pagination: {}}` not just array

### ProposalService Tests
- Missing functions: `acceptProposal()`, `rejectProposal()`, `updateProposal()` - use `updateProposalStatus()` and `withdrawProposal()` instead
- Need to mock contract creation when accepting proposals
- `getProjectProposals()` needs proper client_id in project mock

### ContractService Tests  
- All functions exist, just need better mocking
- `signContract()` returns different structure

### MilestoneService Tests
- Missing functions: `createMilestone()`, `reviewMilestone()`, `getProjectMilestones()`, `updateMilestone()`, `deleteMilestone()`
- Use `submitMilestone()`, `reviewMilestoneSubmission()`, `getMilestones()` from projectService instead
- Milestone CRUD is in projectService, not milestoneService
- milestoneService only has: `submitMilestone()`, `reviewMilestoneSubmission()`, `getMilestoneSubmissions()`, `getMilestoneRevisions()`, `resolveRevision()`

### PaymentService Tests
- `generateOrderId()` is not exported - it's internal
- Need to mock final SELECT queries after UPDATE operations
- Error messages need exact match

## Action Plan

1. Fix projectService tests - update mocks and function calls
2. Fix proposalService tests - use correct function names
3. Fix contractService tests - improve mocking
4. Fix milestoneService tests - use correct service functions
5. Fix paymentService tests - add missing mocks
