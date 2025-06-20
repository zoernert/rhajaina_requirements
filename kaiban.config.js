// Simple kaiban.config.js - Based on working test-minimal.js pattern
import dotenv from 'dotenv';

// Disable telemetry before importing KaibanJS
process.env.KAIBAN_TELEMETRY_DISABLED = 'true';
process.env.TELEMETRY_DISABLED = 'true';
process.env.DO_NOT_TRACK = '1';

// Load environment first
console.log('Step 1: Loading environment...');
dotenv.config();

console.log('Step 2: Checking environment...');
console.log('GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY);

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error('❌ No API key found!');
  process.exit(1);
}

console.log('Step 3: Testing KaibanJS imports...');
try {
  const { Agent, Team, Task } = await import('kaibanjs');
  console.log('✅ KaibanJS imported successfully');
  
  console.log('Step 4: Creating agents...');
  
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

  const technicalWriter = new Agent({
    name: 'Technical Writer',
    role: 'Senior Technical Documentation Specialist',
    goal: 'Create comprehensive, maintainable documentation for Rhajaina AI Chat Application',
    background: `You are a technical writer specializing in software architecture and development documentation. 
    Your expertise includes creating clear, actionable technical specifications and developer-friendly API documentation.`,
    llmConfig: {
      provider: 'google',
      model: 'gemini-1.5-flash',
      apiKey: process.env.GOOGLE_AI_API_KEY
    }
  });

  const projectManager = new Agent({
    name: 'Project Manager',
    role: 'Senior Technical Project Manager',
    goal: 'Coordinate requirements analysis, manage priorities, and ensure project success',
    background: `You are an experienced technical project manager who has successfully delivered 
    complex AI and microservices projects. You understand the challenges of managing evolving requirements.`,
    llmConfig: {
      provider: 'google',
      model: 'gemini-1.5-flash',
      apiKey: process.env.GOOGLE_AI_API_KEY
    }
  });
  
  console.log('✅ Agents created successfully');
  
  console.log('Step 5: Creating tasks...');
  
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
    
    3. Idle Chat Handling:
       - Detection of user activity and idle states
       - Automated session summarization when chats become idle
    
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

  const documentationTask = new Task({
    description: `
    Create comprehensive technical documentation for Rhajaina implementation based on the 
    requirements analysis and architecture design.
    
    Include:
    - Technical specifications
    - API documentation with examples
    - Implementation guides
    - Developer documentation
    `,
    agent: technicalWriter,
    expectedOutput: 'Technical specifications, API documentation, implementation guides, and developer documentation'
  });

  const planningTask = new Task({
    description: `
    Coordinate project planning and create an implementation roadmap for Rhajaina based on 
    all previous analyses.
    
    Provide:
    - Implementation timeline and milestones
    - Resource allocation recommendations
    - Risk mitigation strategies
    - Quality gates and checkpoints
    `,
    agent: projectManager,
    expectedOutput: 'Project plan with implementation timeline, resource allocation, milestones, and risk mitigation strategies'
  });

  console.log('✅ Tasks created successfully');
  
  console.log('Step 6: Creating team...');
  const team = new Team({
    name: 'Rhajaina Requirements Team',
    agents: [requirementsAnalyst, solutionArchitect, technicalWriter, projectManager],
    tasks: [analysisTask, architectureTask, documentationTask, planningTask],
    env: {
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      KAIBAN_TELEMETRY_DISABLED: 'true',
      TELEMETRY_DISABLED: 'true',
      DO_NOT_TRACK: '1'
    }
  });
  
  console.log('✅ Team created successfully');
  
  console.log('Step 7: Starting requirements analysis...');
  console.log('🚀 Starting Rhajaina AI Chat Application Requirements Analysis...');
  
  const result = await team.start();
  console.log('✅ Requirements analysis completed successfully!');
  console.log('📁 Results:', result);
  
} catch (error) {
  console.error('❌ Error occurred:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}