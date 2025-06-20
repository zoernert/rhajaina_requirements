import { Team, Task } from 'kaibanjs';
import { requirementsAnalyst } from './agents/requirements-analyst.js';
import { solutionArchitect } from './agents/solution-architect.js';
import { technicalWriter } from './agents/technical-writer.js';
import { projectManager } from './agents/project-manager.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
const team = new Team({
  name: 'Rhajaina Requirements Team',
  agents: [
    requirementsAnalyst,
    solutionArchitect,
    technicalWriter,
    projectManager
  ],
  tasks: [
    new Task({
      description: 'Analyze and validate the initial requirements for Rhajaina AI Chat Application. Break down each requirement into specific, testable user stories with clear acceptance criteria, priorities (P0-P3), and complexity estimates.',
      agent: requirementsAnalyst,
      expectedOutput: 'Detailed requirements analysis document with validated user stories, priorities, complexity estimates, dependencies, and risk assessments for each requirement.'
    }),
    new Task({
      description: 'Design a comprehensive solution architecture based on the validated requirements for Rhajaina. Focus on microservices design, technology choices, and integration strategies.',
      agent: solutionArchitect,
      expectedOutput: 'Complete solution architecture document including service decomposition, technology stack recommendations, API specifications, deployment strategy, and monitoring plans.'
    }),
    new Task({
      description: 'Create comprehensive technical documentation for Rhajaina implementation based on the requirements analysis and architecture design.',
      agent: technicalWriter,
      expectedOutput: 'Technical specifications, API documentation, implementation guides, and developer documentation with clear examples and use cases.'
    }),
    new Task({
      description: 'Coordinate project planning and create an implementation roadmap for Rhajaina based on all previous analyses.',
      agent: projectManager,
      expectedOutput: 'Project plan with implementation timeline, resource allocation, milestones, risk mitigation strategies, and quality gates.'
    })
  ],
  inputs: {
    requirements: initialRequirements,
    constraints: 'Existing infrastructure: Redis, NATS, Qdrant, MongoDB, n8n. Must integrate seamlessly with current systems.',
    context: 'Previous chat application was restarted due to complexity and requirement evolution issues. Rhajaina must be designed to handle evolving requirements systematically and avoid the same pitfalls.'
  },
  env: {
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  }
});

export default team;