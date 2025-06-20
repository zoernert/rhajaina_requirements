import { Team, Task } from 'kaibanjs';
import { requirementsAnalyst } from './agents/requirements-analyst';
import { solutionArchitect } from './agents/solution-architect';
import { technicalWriter } from './agents/technical-writer';
import { projectManager } from './agents/project-manager';
import { readFileSync, writeFileSync, ensureDirSync } from 'fs-extra';
import dotenv from 'dotenv'; 

dotenv.config();  // Load environment variables from .env file import { join } from 'path';


// Initial requirements input
const initialRequirements = `
Rhajaina AI Chat Application Requirements:

1. Core Chat Functionality:
   - Real-time messaging between users and AI
   - Support for multiple AI models (OpenAI, Claude, Gemini, Mistral, DeepSeek)
   - Dynamic context management within LLM token limits
   - Intelligent chat history summarization

2. Semantic Search & Vector Store:
   - Qdrant vector database integration for semantic search
   - Embedding generation and storage for chat history
   - Retrieval of relevant context based on semantic similarity
   - Rich metadata management for filtering and organization

3. Idle Chat Handling:
   - Detection of user activity and idle states
   - Automated session summarization when chats become idle
   - Summary should answer: Where did we leave off? What milestones were achieved?
   - What are the AI and user roles? What are the next steps?
   - What information would be helpful for continuation?

4. Agent Workflow System:
   - Iterative answer generation with multiple processing steps
   - Tool orchestration for complex queries
   - Multi-step reasoning and result refinement
   - Quality validation and improvement loops

5. Architecture Requirements:
   - Microservices architecture with clear separation of duties
   - Integration with existing infrastructure (Redis, NATS, Qdrant, MongoDB, n8n)
   - Docker containerization for deployment
   - High maintainability and code quality
   - Scalable and fault-tolerant design

6. Technology Constraints:
   - Node.js/TypeScript implementation
   - Moleculer framework for microservices
   - Mastra framework for AI agent workflows
   - Integration with existing infrastructure services
   - Development using VS Code
   - Deployment on integration servers as Docker containers
`;

// Create the requirements analysis team
const requirementsTeam = new Team({
  name: 'Rhajaina Requirements Team',
  agents: [
    requirementsAnalyst,
    solutionArchitect,
    technicalWriter,
    projectManager
  ],
  tasks: [
    new Task({
      description: 'Analyze and validate the initial requirements for Rhajaina AI Chat Application',
      agent: requirementsAnalyst,
      expectedOutput: 'Detailed requirements analysis with validated user stories, priorities, and risk assessment'
    }),
    new Task({
      description: 'Design solution architecture based on validated requirements for Rhajaina',
      agent: solutionArchitect,
      expectedOutput: 'Complete solution architecture with service design, technology choices, and implementation strategy'
    }),
    new Task({
      description: 'Create comprehensive technical documentation for Rhajaina implementation',
      agent: technicalWriter,
      expectedOutput: 'Technical specifications, API documentation, and implementation guides'
    }),
    new Task({
      description: 'Coordinate project planning and create implementation roadmap for Rhajaina',
      agent: projectManager,
      expectedOutput: 'Project plan with priorities, timelines, milestones, and risk mitigation strategies'
    })
  ],
  inputs: {
    requirements: initialRequirements,
    constraints: 'Existing infrastructure: Redis, NATS, Qdrant, MongoDB, n8n',
    context: 'Previous chat application was restarted due to complexity and requirement evolution issues. Rhajaina must be designed to handle evolving requirements systematically.'
  }
});

// Execute the requirements analysis
async function runRequirementsAnalysis() {
  console.log('🚀 Starting Rhajaina AI Chat Application Requirements Analysis...');
  
  // Ensure output directories exist
  ensureDirSync('./outputs/requirements-documents');
  ensureDirSync('./outputs/architecture-diagrams');
  ensureDirSync('./outputs/implementation-specs');
  
  try {
    const result = await requirementsTeam.start();
    
    // Save results to files
    writeFileSync(
      './outputs/rhajaina-requirements-analysis-results.json',
      JSON.stringify(result, null, 2)
    );
    
    console.log('✅ Requirements analysis completed!');
    console.log('📁 Results saved to: ./outputs/');
    console.log('🎯 Next steps: Review outputs and refine requirements as needed');
    
    return result;
  } catch (error) {
    console.error('❌ Error during requirements analysis:', error);
    throw error;
  }
}

// Handle command line arguments
const workflow = process.argv.find(arg => arg.startsWith('--workflow='))?.split('=')[1];

switch (workflow) {
  case 'requirements-analysis':
    runRequirementsAnalysis();
    break;
  default:
    runRequirementsAnalysis();
}