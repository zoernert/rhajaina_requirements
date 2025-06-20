// kaiban-no-telemetry.config.js - Disable telemetry for corporate environments
import dotenv from 'dotenv';
dotenv.config();

// Disable telemetry before importing KaibanJS
process.env.KAIBAN_TELEMETRY_DISABLED = 'true';
process.env.TELEMETRY_DISABLED = 'true';
process.env.DO_NOT_TRACK = '1';

import { Agent, Team, Task } from 'kaibanjs';

console.log('🚀 Starting Rhajaina Requirements Analysis (telemetry disabled)...');
console.log('Environment check - GOOGLE_AI_API_KEY:', !!process.env.GOOGLE_AI_API_KEY);

const requirementsAnalyst = new Agent({
  name: 'Requirements Analyst',
  role: 'Senior Business Analyst',
  goal: 'Analyze and validate requirements for Rhajaina AI Chat Application',
  background: `You are a seasoned business analyst with 10+ years experience in AI/ML projects. 
  You specialize in breaking down complex requirements into manageable pieces, identifying hidden 
  dependencies and edge cases, validating requirements for completeness and feasibility, and 
  managing requirement changes and their impact.`,
  llmConfig: {
    provider: 'google',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_AI_API_KEY
  }
});

const solutionArchitect = new Agent({
  name: 'Solution Architect',
  role: 'Senior Solution Architect',
  goal: 'Design robust, scalable architecture for Rhajaina AI Chat Application',
  background: `You are a senior solution architect with expertise in microservices architecture, 
  AI/ML system design, vector databases, real-time communication systems, and scalable Node.js applications.`,
  llmConfig: {
    provider: 'google',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_AI_API_KEY
  }
});

const analysisTask = new Task({
  description: `
  Analyze the following requirements for Rhajaina AI Chat Application:
  
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
  
  4. Agent Workflow System:
     - Iterative answer generation with multiple processing steps
     - Tool orchestration for complex queries
     - Multi-step reasoning and result refinement
  
  5. Architecture Requirements:
     - Microservices architecture with clear separation of duties
     - Integration with existing infrastructure (Redis, NATS, Qdrant, MongoDB, n8n)
     - Docker containerization for deployment
  
  Please provide:
  - Breakdown of each requirement into user stories
  - Priority assessment (P0-P3 where P0 is critical)
  - Complexity estimates (Simple/Medium/Complex)
  - Dependencies between requirements
  - Risk assessment and mitigation strategies
  `,
  agent: requirementsAnalyst,
  expectedOutput: 'Detailed requirements analysis with user stories, priorities, complexity estimates, dependencies, and risk assessment'
});

const architectureTask = new Task({
  description: `
  Based on the requirements analysis, design a comprehensive solution architecture for Rhajaina.
  
  Focus on:
  - Microservices design with Moleculer framework
  - Integration with existing infrastructure (Redis, NATS, Qdrant, MongoDB, n8n)
  - Technology stack recommendations
  - API specifications and service boundaries
  - Deployment strategy with Docker
  - Monitoring and observability
  
  Ensure the architecture can handle evolving requirements and avoid the complexity issues 
  that led to the previous project restart.
  `,
  agent: solutionArchitect,
  expectedOutput: 'Complete solution architecture with service design, technology choices, and implementation strategy'
});

const team = new Team({
  name: 'Rhajaina Requirements Team',
  agents: [requirementsAnalyst, solutionArchitect],
  tasks: [analysisTask, architectureTask],
  env: {
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    KAIBAN_TELEMETRY_DISABLED: 'true'
  }
});

console.log('Starting team execution...');
team.start()
  .then((result) => {
    console.log('✅ Requirements analysis completed successfully!');
    console.log('\n📊 Results Summary:');
    console.log('=====================================');
    
    if (result && result.tasks) {
      result.tasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.description.substring(0, 50)}...`);
        console.log(`   Agent: ${task.agent}`);
        console.log(`   Status: ${task.status}`);
        if (task.result) {
          console.log(`   Result: ${task.result.substring(0, 200)}...`);
        }
      });
    }
    
    console.log('\n📁 Check the outputs/ directory for detailed documentation');
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  });

export default team;