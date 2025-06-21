// Simple kaiban.config.js - Based on working test-minimal.js pattern
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

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

// Import and test documentation generator
console.log('Step 2.5: Testing documentation generator import...');
let documentationGenerator;
try {
  const toolModule = await import('./tools/documentation-generator.js');
  // Use the tool instance instead of the function
  documentationGenerator = toolModule.documentationGeneratorTool || toolModule.default;
  console.log('✅ Documentation generator imported successfully');
  console.log('🔧 Documentation generator type:', typeof documentationGenerator);
  console.log('🔧 Documentation generator has invoke method:', typeof documentationGenerator.invoke === 'function');
} catch (importError) {
  console.error('❌ Failed to import documentation generator:', importError);
  console.error('Import error stack:', importError.stack);
  process.exit(1);
}

// Add state tracking
const COMPLETED_TASKS_FILE = './outputs/completed-tasks.json';
const TASK_BACKLOG_FILE = './outputs/task-backlog.json';
const DYNAMIC_TASKS_FILE = './outputs/dynamic-tasks.json';

async function loadCompletedTasks() {
  try {
    const data = await fs.readFile(COMPLETED_TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveCompletedTask(taskName) {
  const completed = await loadCompletedTasks();
  if (!completed.includes(taskName)) {
    completed.push(taskName);
    await fs.writeFile(COMPLETED_TASKS_FILE, JSON.stringify(completed, null, 2));
  }
}

async function isTaskCompleted(taskName) {
  const completed = await loadCompletedTasks();
  return completed.includes(taskName);
}

async function loadTaskBacklog() {
  try {
    const data = await fs.readFile(TASK_BACKLOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveDynamicTask(taskDefinition) {
  const backlog = await loadTaskBacklog();
  const taskWithId = {
    ...taskDefinition,
    id: `dynamic_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    priority: taskDefinition.priority || 'P2'
  };
  backlog.push(taskWithId);
  await fs.writeFile(TASK_BACKLOG_FILE, JSON.stringify(backlog, null, 2));
  console.log(`📝 Added dynamic task to backlog: ${taskWithId.name}`);
  return taskWithId.id;
}

async function loadDynamicTasks() {
  try {
    const data = await fs.readFile(DYNAMIC_TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function processDynamicTaskSuggestions(taskOutput) {
  // Simple pattern matching to detect task suggestions in agent output
  const taskPattern = /NEW_TASK:\s*\{([^}]+)\}/gi;
  const matches = [...taskOutput.matchAll(taskPattern)];
  
  const dynamicTasks = [];
  for (const match of matches) {
    try {
      const taskData = JSON.parse(`{${match[1]}}`);
      if (taskData.name && taskData.description) {
        dynamicTasks.push(taskData);
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse dynamic task suggestion:', match[0]);
    }
  }
  
  return dynamicTasks;
}

// Enhanced error handling function
function isRateLimitError(error) {
  const errorMessage = error.message.toLowerCase();
  return errorMessage.includes('rate limit') || 
         errorMessage.includes('429') || 
         errorMessage.includes('quota exceeded') ||
         errorMessage.includes('too many requests') ||
         errorMessage.includes('quotafailure');
}

// Add model fallback logic
async function createAgentWithFallback(agentConfig, primaryConfig, fallbackConfig) {
  try {
    return new Agent({
      ...agentConfig,
      llmConfig: primaryConfig
    });
  } catch (error) {
    console.log(`⚠️ Primary model failed for ${agentConfig.name}, using fallback`);
    return new Agent({
      ...agentConfig,
      llmConfig: fallbackConfig
    });
  }
}

// Enhanced retry function with model fallback
async function retryWithBackoffAndFallback(fn, primaryAgent, fallbackConfig, maxRetries = 3, baseDelay = 60000) {
  let currentAgent = primaryAgent;
  let usingFallback = false;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(currentAgent);
    } catch (error) {
      if (isRateLimitError(error) && !usingFallback && fallbackConfig) {
        console.log(`🔄 Switching to Mistral fallback model for better rate limits...`);
        // Create new agent with fallback config
        currentAgent = new Agent({
          name: currentAgent.name,
          role: currentAgent.role,
          goal: currentAgent.goal,
          background: currentAgent.background,
          tools: currentAgent.tools,
          llmConfig: fallbackConfig,
          maxAgentIterations: currentAgent.maxAgentIterations || 20,
          maxRetries: 3
        });
        usingFallback = true;
        // Try again immediately with fallback
        continue;
      } else if (isRateLimitError(error) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏱️ Rate limit hit. Waiting ${delay / 1000} seconds before retry ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

console.log('Step 3: Testing KaibanJS imports...');

async function main() {
  try {
    const { Agent, Team, Task } = await import('kaibanjs');
    console.log('✅ KaibanJS imported successfully');
    
    // Clean and create output directories
    console.log('Step 3.1: Checking output directories...');
    const outputDir = './output';
    const outputsDir = './outputs';
    
    // Only clean ./output directory, preserve ./outputs
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      console.log('✅ Cleaned ./output directory');
    } catch (cleanError) {
      console.log('ℹ️ No existing ./output directory to clean');
    }
    
    // Create directories without removing ./outputs
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(outputsDir, { recursive: true });
    console.log('✅ Ensured output directories exist (preserving existing content)');
    
    console.log('Step 3.5: Loading requirements from input files...');
    const inputDir = './input';
    
    // Read all requirement files
    const coreReqs = await fs.readFile(path.join(inputDir, 'core-chat-requirements.md'), 'utf8');
    const vectorReqs = await fs.readFile(path.join(inputDir, 'vector-search-requirements.md'), 'utf8');
    const idleReqs = await fs.readFile(path.join(inputDir, 'idle-chat-requirements.md'), 'utf8');
    const agentReqs = await fs.readFile(path.join(inputDir, 'agent-workflow-requirements.md'), 'utf8');
    const archReqs = await fs.readFile(path.join(inputDir, 'architecture-requirements.md'), 'utf8');
    const featureReqs = await fs.readFile(path.join(inputDir, 'feature-requirements.md'), 'utf8');
    const uxReqs = await fs.readFile(path.join(inputDir, 'ux-ui-requirements.md'), 'utf8');
    
    console.log('✅ Requirements loaded from input files');
    
    console.log('Step 4: Creating agents...');
    
    // Test the documentation generator tool
    console.log('🔧 Testing documentation generator tool...');
    try {
      if (documentationGenerator && typeof documentationGenerator.invoke === 'function') {
        const testResult = await documentationGenerator.invoke({
          content: "# Test Document\n\nThis is a test to verify the documentation generator is working.\n\n## Test Section\n\nThe tool should create a file with this content.",
          title: "Tool Validation Test",
          type: "test",
          format: "markdown"
        });
        console.log('✅ Documentation generator test result:', testResult);
        
        if (!testResult.success) {
          console.error('❌ Documentation generator test failed:', testResult.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Documentation generator is not a proper tool, type:', typeof documentationGenerator);
        console.error('❌ Has invoke method:', typeof documentationGenerator?.invoke === 'function');
        process.exit(1);
      }
    } catch (toolError) {
      console.error('❌ Documentation generator test failed:', toolError);
      console.error('Tool error stack:', toolError.stack);
      process.exit(1);
    }

    // Enhanced LLM configs with better rate limiting and iterations
    const llmConfig = {
      provider: 'google',
      model: 'gemini-2.0-flash-exp', // Keep exp for now, or change to 'gemini-2.0-flash' when available
      apiKey: process.env.GOOGLE_AI_API_KEY,
      temperature: 0.5,
      maxTokens: 8000, // Increased to near maximum output limit for Gemini 2.0
      maxRetries: 2,
      retryDelay: 30000
    };

    const mistralConfig = {
      provider: 'mistral',
      model: 'mistral-large-latest',
      apiKey: process.env.MISTRAL_API_KEY,
      temperature: 0.5,
      maxTokens: 8000, // Increased to match Gemini
      maxRetries: 5,
      retryDelay: 20000
    };

    // Check if Mistral API key is available for fallback
    const hasMistralFallback = !!process.env.MISTRAL_API_KEY;
    if (hasMistralFallback) {
      console.log('✅ Mistral fallback available');
    } else {
      console.log('⚠️ No Mistral API key - running without fallback');
    }

    const requirementsAnalyst = new Agent({
      name: 'Requirements Analyst',
      role: 'Senior Business Analyst',
      goal: 'Analyze and validate requirements for Rhajaina AI Chat Application',
      background: `You are a seasoned business analyst with 10+ years experience in AI/ML projects. 
      Create extremely comprehensive, detailed analysis that covers every aspect of the requirements. 
      Provide specific implementation details, concrete examples, detailed user scenarios, and thorough technical specifications.
      Your analysis should be exhaustive and cover all edge cases, integration points, and technical considerations.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 25, // Increased for more thorough analysis
      maxRetries: 3
    });

    const solutionArchitect = new Agent({
      name: 'Solution Architect',
      role: 'Senior Solution Architect',
      goal: 'Design robust, scalable architecture for Rhajaina AI Chat Application',
      background: `You are a senior solution architect with expertise in microservices architecture. 
      Create concise, implementable designs. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 20,
      maxRetries: 3
    });

    const technicalWriter = new Agent({
      name: 'Technical Writer',
      role: 'Senior Technical Documentation Specialist',
      goal: 'Create comprehensive, maintainable documentation for Rhajaina AI Chat Application',
      background: `You are a technical writer specializing in software architecture documentation. 
      Create clear, concise documentation. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 20,
      maxRetries: 3
    });

    const projectManager = new Agent({
      name: 'Project Manager',
      role: 'Senior Technical Project Manager',
      goal: 'Coordinate requirements analysis, manage priorities, and ensure project success',
      background: `You are an experienced technical project manager. 
      Focus on actionable coordination and clear priorities. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 20,
      maxRetries: 3
    });

    const documentationStandardsAgent = new Agent({
      name: 'Documentation Standards Agent',
      role: 'Senior Documentation Standards Specialist',
      goal: 'Ensure consistent naming conventions, terminology, and style across all Rhajaina documentation',
      background: `You are a documentation standards specialist. 
      Focus on consistency and clarity. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 20,
      maxRetries: 3
    });

    const chiefDeveloper = new Agent({
      name: 'Chief Developer',
      role: 'Senior Chief Technology Developer',
      goal: 'Create detailed technical development plans with implementation steps, milestones, and development workflows',
      background: `You are a chief developer with 15+ years of experience. 
      Create practical, achievable development plans. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: mistralConfig, // Start with Mistral for complex technical tasks
      maxAgentIterations: 25,
      maxRetries: 3
    });

    const dataArchitect = new Agent({
      name: 'Data Architect',
      role: 'Senior Data Architect & Database Designer',
      goal: 'Design comprehensive MongoDB data models and persistence strategies for Rhajaina AI Chat Application',
      background: `You are a senior data architect with MongoDB expertise. 
      Create efficient, scalable data models. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 20,
      maxRetries: 3
    });

    const uxuiDesigner = new Agent({
      name: 'UX/UI Designer',
      role: 'Senior UX/UI Designer & User Experience Specialist',
      goal: 'Design intuitive, accessible, and engaging user interfaces for Rhajaina AI Chat Application',
      background: `You are a senior UX/UI designer with chat application experience. 
      Create user-centered, accessible designs. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 20,
      maxRetries: 3
    });

    const workflowCoordinator = new Agent({
      name: 'Workflow Coordinator',
      role: 'Senior Workflow & Task Management Specialist',
      goal: 'Coordinate dynamic task discovery, prioritization, and workflow optimization for Rhajaina project',
      background: `You are a workflow coordination specialist. 
      Focus on essential tasks and clear priorities. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 15,
      maxRetries: 3
    });

    const taskPrioritizer = new Agent({
      name: 'Task Prioritizer',
      role: 'Senior Project Priority & Risk Assessment Specialist',
      goal: 'Evaluate and prioritize dynamic tasks based on business value, risk, and dependencies',
      background: `You are a task prioritization specialist. 
      Provide clear, actionable priorities. Keep responses under 1500 words.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 15,
      maxRetries: 3
    });

    console.log('✅ Agents created successfully');
    
    console.log('Step 5: Creating tasks...');
    
    // Create all tasks first, then filter based on completion
    const allTaskDefinitions = [
      // PHASE 1: Complete Requirements Analysis - Single Comprehensive Task
      {
        name: 'completeRequirementsAnalysis',
        createTask: () => new Task({
          description: `
          CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

          1. YOU MUST CALL THE documentationGenerator TOOL - This is mandatory, not optional
          2. DO NOT provide analysis in your final answer - ONLY call the tool
          3. The tool call is your deliverable, not a text response

          TASK: Create a comprehensive requirements analysis document for the Rhajaina AI Chat Application.

          REQUIREMENTS TO ANALYZE:
          Core Chat Requirements: ${coreReqs}
          Vector Search: ${vectorReqs}
          Idle Chat: ${idleReqs}  
          Agent Workflow: ${agentReqs}
          Architecture: ${archReqs}
          Features: ${featureReqs}
          UX/UI: ${uxReqs}

          CREATE A COMPREHENSIVE ANALYSIS COVERING:

          ## 1. EXECUTIVE SUMMARY (1500+ words)
          - Project overview and business context
          - Strategic objectives and value proposition
          - Key stakeholders and success criteria
          - Implementation scope and timeline overview

          ## 2. FUNCTIONAL REQUIREMENTS ANALYSIS (2500+ words)
          - Real-time messaging capabilities and WebSocket implementation
          - Multi-AI model integration (OpenAI, Claude, Gemini, Mistral, DeepSeek)
          - Context management and token optimization
          - Chat persistence and session management
          - Search and retrieval functionality
          - User interface and experience requirements

          ## 3. TECHNICAL ARCHITECTURE REQUIREMENTS (2000+ words)
          - System architecture and component design
          - Database design and data models (MongoDB)
          - API design and integration patterns
          - Security and authentication requirements
          - Performance and scalability specifications
          - Deployment and infrastructure needs

          ## 4. NON-FUNCTIONAL REQUIREMENTS (1500+ words)
          - Performance benchmarks and response times
          - Scalability targets and load handling
          - Security protocols and data protection
          - Availability and reliability standards
          - Monitoring and observability requirements

          ## 5. IMPLEMENTATION ROADMAP (1500+ words)
          - Development phases and milestones
          - Dependencies and critical path analysis
          - Resource allocation and team structure
          - Risk assessment and mitigation strategies
          - Testing and quality assurance plan

          ## 6. INTEGRATION SPECIFICATIONS (1000+ words)
          - External AI service integrations
          - Database integration patterns
          - Frontend-backend communication
          - Third-party service dependencies

          TOTAL TARGET: 10,000+ words of comprehensive analysis

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_10000_word_analysis", "title": "Rhajaina AI Chat Application - Complete Requirements Analysis", "type": "requirements", "format": "markdown"})

          DO NOT provide the analysis in your response - ONLY make the tool call.
          `,
          agent: requirementsAnalyst,
          expectedOutput: 'Complete requirements analysis document saved via documentationGenerator tool'
        })
      },

      // PHASE 2: Implementation Planning
      {
        name: 'implementationPlanning',
        createTask: () => new Task({
          description: `
          Based on the requirements analysis, create a detailed implementation plan.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your plan.

          CREATE AN IMPLEMENTATION PLAN COVERING:

          ## 1. DEVELOPMENT PHASES (2000+ words)
          - Phase 1: Core Infrastructure Setup
          - Phase 2: AI Model Integration
          - Phase 3: Chat Interface Development  
          - Phase 4: Advanced Features
          - Phase 5: Testing and Deployment

          ## 2. TECHNICAL SPECIFICATIONS (2500+ words)
          - Database schemas and models
          - API endpoint specifications
          - Component architecture diagrams
          - Configuration management
          - Error handling strategies

          ## 3. DEVELOPMENT WORKFLOW (1500+ words)
          - Git workflow and branching strategy
          - Code review processes
          - Testing methodologies
          - Deployment pipelines
          - Documentation standards

          ## 4. RESOURCE PLANNING (1000+ words)
          - Team roles and responsibilities
          - Timeline and milestones
          - Budget considerations
          - Tool and technology stack

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_implementation_plan", "title": "Rhajaina Implementation Plan and Technical Specifications", "type": "implementation", "format": "markdown"})
          `,
          agent: solutionArchitect,
          expectedOutput: 'Implementation plan document saved via documentationGenerator tool'
        })
      },

      // PHASE 3: API and Database Design
      {
        name: 'apiDatabaseDesign',
        createTask: () => new Task({
          description: `
          Create detailed API and database designs for the Rhajaina AI Chat Application.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your designs.

          CREATE DETAILED DESIGNS COVERING:

          ## 1. DATABASE DESIGN (2000+ words)
          - MongoDB collection schemas
          - Data relationships and indexing
          - Data migration strategies
          - Backup and recovery plans

          ## 2. REST API SPECIFICATION (2000+ words)
          - Endpoint definitions and methods
          - Request/response schemas
          - Authentication and authorization
          - Rate limiting and error handling

          ## 3. WEBSOCKET API DESIGN (1000+ words)
          - Real-time messaging protocols
          - Connection management
          - Event handling and broadcasting

          ## 4. INTEGRATION APIS (1000+ words)
          - AI model service integrations
          - Third-party service connections
          - Webhook implementations

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_api_database_design", "title": "Rhajaina API and Database Design Specifications", "type": "technical", "format": "markdown"})
          `,
          agent: dataArchitect,
          expectedOutput: 'API and database design document saved via documentationGenerator tool'
        })
      },

      // PHASE 4: UI/UX Design Specifications
      {
        name: 'uxuiDesignSpecs',
        createTask: () => new Task({
          description: `
          Create comprehensive UI/UX design specifications for the Rhajaina AI Chat Application.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your designs.

          CREATE DESIGN SPECIFICATIONS COVERING:

          ## 1. USER INTERFACE DESIGN (2000+ words)
          - Chat interface layout and components
          - Navigation and user flows
          - Responsive design specifications
          - Accessibility requirements

          ## 2. USER EXPERIENCE DESIGN (1500+ words)
          - User journey mapping
          - Interaction patterns
          - Feedback mechanisms
          - Performance expectations

          ## 3. DESIGN SYSTEM (1000+ words)
          - Color palette and typography
          - Component library specifications
          - Icon and imagery guidelines
          - Brand consistency rules

          ## 4. MOBILE AND RESPONSIVE DESIGN (1000+ words)
          - Mobile-first approach
          - Breakpoint specifications
          - Touch interaction design
          - Progressive web app features

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_uxui_design_specs", "title": "Rhajaina UI/UX Design Specifications", "type": "design", "format": "markdown"})
          `,
          agent: uxuiDesigner,
          expectedOutput: 'UI/UX design specifications document saved via documentationGenerator tool'
        })
      },

      // PHASE 5: Quality Assurance and Testing Plan
      {
        name: 'qaTestingPlan',
        createTask: () => new Task({
          description: `
          Create a comprehensive quality assurance and testing plan for the Rhajaina AI Chat Application.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your plan.

          CREATE A TESTING PLAN COVERING:

          ## 1. TESTING STRATEGY (1500+ words)
          - Unit testing approach
          - Integration testing methods
          - End-to-end testing scenarios
          - Performance testing requirements

          ## 2. TEST CASES AND SCENARIOS (2000+ words)
          - Functional test cases
          - AI model integration tests
          - User interface testing
          - Security testing protocols

          ## 3. QUALITY ASSURANCE PROCESSES (1000+ words)
          - Code review standards
          - Continuous integration setup
          - Bug tracking and resolution
          - Release quality gates

          ## 4. MONITORING AND MAINTENANCE (1000+ words)
          - Production monitoring setup
          - Error tracking and alerting
          - Performance monitoring
          - Maintenance procedures

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_qa_testing_plan", "title": "Rhajaina Quality Assurance and Testing Plan", "type": "testing", "format": "markdown"})
          `,
          agent: technicalWriter,
          expectedOutput: 'QA and testing plan document saved via documentationGenerator tool'
        })
      },

      // NEW PHASE 6: Vector Search and AI Integration Deep Dive
      {
        name: 'vectorSearchDeepDive',
        createTask: () => new Task({
          description: `
          Create detailed technical specifications for vector search and advanced AI integration.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your specifications.

          CREATE DETAILED SPECIFICATIONS COVERING:

          ## 1. QDRANT VECTOR DATABASE INTEGRATION (1500+ words)
          - Collection setup and management
          - Vector embedding strategies
          - Similarity search optimization
          - Metadata filtering and indexing
          - Performance tuning parameters

          ## 2. AI MODEL INTEGRATION ARCHITECTURE (2000+ words)
          - Multi-provider fallback implementation
          - Context window management per model
          - Token optimization strategies
          - Response quality assessment
          - Model switching during conversations

          ## 3. AGENT WORKFLOW IMPLEMENTATION (1500+ words)
          - Think → Act → Respond pipeline details
          - Tool orchestration mechanisms
          - Multi-step reasoning processes
          - Context synthesis optimization
          - Performance metrics collection

          ## 4. FILE PROCESSING SYSTEM (1000+ words)
          - PDF/Office document ingestion
          - OCR implementation for images
          - Markdown conversion processes
          - Binary file indexing strategies
          - Content vectorization workflows

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_vector_ai_specs", "title": "Rhajaina Vector Search and AI Integration Specifications", "type": "technical", "format": "markdown"})
          `,
          agent: dataArchitect,
          expectedOutput: 'Vector search and AI integration specifications document saved via documentationGenerator tool'
        })
      },

      // NEW PHASE 7: Advanced Features Implementation Guide
      {
        name: 'advancedFeaturesGuide',
        createTask: () => new Task({
          description: `
          Create comprehensive implementation guide for advanced Rhajaina features.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your guide.

          CREATE IMPLEMENTATION GUIDE COVERING:

          ## 1. MCP TOOL INTEGRATION (1500+ words)
          - Tool discovery and registration processes
          - OpenAPI specification integration
          - Natural language tool output processing
          - Tool execution metrics and caching
          - Custom tool development guidelines

          ## 2. IDLE CHAT MANAGEMENT SYSTEM (1500+ words)
          - Activity detection implementation
          - Session state management
          - Automated summarization processes
          - Timeline and milestone tracking
          - Context preservation strategies

          ## 3. CLUSTERING AND SEARCH FEATURES (1000+ words)
          - Automatic conversation clustering
          - Named cluster creation algorithms
          - Full-text search implementation
          - Binary file content indexing
          - Search result ranking optimization

          ## 4. COLLABORATION AND SHARING (1000+ words)
          - Multi-user workspace implementation
          - Conversation sharing mechanisms
          - Team analytics and insights
          - Role-based access control
          - Real-time collaboration features

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_advanced_features_guide", "title": "Rhajaina Advanced Features Implementation Guide", "type": "implementation", "format": "markdown"})
          `,
          agent: chiefDeveloper,
          expectedOutput: 'Advanced features implementation guide document saved via documentationGenerator tool'
        })
      },

      // NEW PHASE 8: Enhanced API Specifications
      {
        name: 'enhancedApiSpecs',
        createTask: () => new Task({
          description: `
          Create enhanced API specifications addressing gaps in the initial design.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your specifications.

          CREATE ENHANCED API SPECIFICATIONS COVERING:

          ## 1. AI MODEL MANAGEMENT APIS (1500+ words)
          - Model selection and switching endpoints
          - Context management APIs
          - Token usage tracking endpoints
          - Model health monitoring APIs
          - Fallback chain configuration

          ## 2. VECTOR SEARCH APIS (1500+ words)
          - Embedding generation endpoints
          - Similarity search APIs
          - Collection management endpoints
          - Metadata filtering APIs
          - Performance optimization settings

          ## 3. FILE MANAGEMENT APIS (1000+ words)
          - File upload and processing endpoints
          - OCR and content extraction APIs
          - Vectorization pipeline APIs
          - File metadata management
          - Content search and retrieval

          ## 4. COLLABORATION APIS (1000+ words)
          - Workspace management endpoints
          - User and team management APIs
          - Sharing and permissions APIs
          - Real-time collaboration endpoints
          - Analytics and reporting APIs

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_enhanced_api_specs", "title": "Rhajaina Enhanced API Specifications", "type": "technical", "format": "markdown"})
          `,
          agent: solutionArchitect,
          expectedOutput: 'Enhanced API specifications document saved via documentationGenerator tool'
        })
      },

      // NEW PHASE 9: Security and Performance Specifications
      {
        name: 'securityPerformanceSpecs',
        createTask: () => new Task({
          description: `
          Create detailed security and performance specifications.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your specifications.

          CREATE SECURITY AND PERFORMANCE SPECIFICATIONS COVERING:

          ## 1. SECURITY ARCHITECTURE (1500+ words)
          - Authentication and authorization implementation
          - Data encryption strategies
          - API security measures
          - Vector database security
          - Privacy and compliance requirements

          ## 2. PERFORMANCE OPTIMIZATION (1500+ words)
          - AI model response time optimization
          - Vector search performance tuning
          - Database query optimization
          - Caching strategies implementation
          - Load balancing and scaling

          ## 3. MONITORING AND OBSERVABILITY (1000+ words)
          - Performance metrics collection
          - Error tracking and alerting
          - AI model performance monitoring
          - User experience monitoring
          - System health dashboards

          ## 4. DEPLOYMENT AND SCALING (1000+ words)
          - Containerization strategies
          - Kubernetes deployment configurations
          - Auto-scaling implementations
          - Disaster recovery procedures
          - Blue-green deployment processes

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_security_performance_specs", "title": "Rhajaina Security and Performance Specifications", "type": "technical", "format": "markdown"})
          `,
          agent: technicalWriter,
          expectedOutput: 'Security and performance specifications document saved via documentationGenerator tool'
        })
      },

      // NEW PHASE 10: Integration Testing and Validation
      {
        name: 'integrationTestingValidation',
        createTask: () => new Task({
          description: `
          Create comprehensive integration testing and validation specifications.

          MANDATORY TOOL USAGE:
          You MUST call the documentationGenerator tool to save your specifications.

          CREATE TESTING AND VALIDATION SPECIFICATIONS COVERING:

          ## 1. AI MODEL INTEGRATION TESTING (1500+ words)
          - Multi-model conversation testing
          - Context switching validation
          - Response quality assessment
          - Performance benchmarking
          - Fallback mechanism testing

          ## 2. VECTOR SEARCH TESTING (1500+ words)
          - Embedding quality validation
          - Search relevance testing
          - Performance load testing
          - Accuracy benchmarking
          - Scalability testing

          ## 3. END-TO-END USER SCENARIOS (1000+ words)
          - Complete user journey testing
          - Multi-user collaboration testing
          - File processing validation
          - Search and retrieval testing
          - Performance under load

          ## 4. INTEGRATION VALIDATION (1000+ words)
          - Third-party service integration testing
          - API endpoint validation
          - Data consistency testing
          - Error handling validation
          - Recovery procedure testing

          MANDATORY ACTION:
          You MUST call: documentationGenerator({"content": "your_complete_integration_testing_specs", "title": "Rhajaina Integration Testing and Validation Specifications", "type": "testing", "format": "markdown"})
          `,
          agent: technicalWriter,
          expectedOutput: 'Integration testing and validation specifications document saved via documentationGenerator tool'
        })
      }
    ];

    console.log('📊 Checking task completion status...');
    
    // Check which tasks are completed and add incomplete ones
    const tasks = [];
    for (const taskDef of allTaskDefinitions) {
      const isCompleted = await isTaskCompleted(taskDef.name);
      if (!isCompleted) {
        tasks.push(taskDef.createTask());
        console.log(`➕ Added task: ${taskDef.name}`);
      } else {
        console.log(`✅ Task already completed: ${taskDef.name}`);
      }
    }

    console.log(`📊 Total tasks to run: ${tasks.length}`);
    if (tasks.length > 0) {
      console.log(`📝 Tasks queued for execution:`);
      tasks.forEach((task, index) => {
        console.log(`   ${index + 1}. Agent: ${task.agent.name}, Expected: ${task.expectedOutput}`);
      });
    }

    if (tasks.length === 0) {
      console.log('🎉 All tasks already completed! Check ./outputs/ for results.');
      process.exit(0);
    }

    console.log('Step 7: Starting requirements analysis with dynamic task detection...');
    console.log('🚀 Starting Rhajaina AI Chat Application Requirements Analysis...');
    
    // Define team environment configuration
    const teamEnv = {
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
      KAIBAN_TELEMETRY_DISABLED: 'true',
      TELEMETRY_DISABLED: 'true',
      DO_NOT_TRACK: '1'
    };
    
    // Declare variables outside try block for proper scope
    let completedCount = 0;
    let dynamicTasksFound = [];
    
    try {
      // Execute tasks one by one with delay and error handling
      for (let i = 0; i < tasks.length; i++) {
        // Improved task name detection
        const taskName = allTaskDefinitions.find(def => {
          const task = def.createTask();
          return task.description === tasks[i].description;
        })?.name || `dynamic_task_${i}`;
        
        console.log(`\n🔄 Executing task ${i + 1}/${tasks.length}: ${taskName}`);
        console.log(`📝 Task agent: ${tasks[i].agent.name}`);
        
        try {
          // Create a mini team for single task execution with enhanced config
          const singleTaskTeam = new Team({
            name: `Task ${taskName}`,
            agents: [tasks[i].agent],
            tasks: [tasks[i]],
            env: teamEnv,
            logLevel: 'debug',
            maxTeamIterations: 5,
            timeout: 300000
          });
          
          console.log(`🚀 Starting team execution for task: ${taskName}`);
          
          const taskResult = await singleTaskTeam.start();
          
          console.log(`📄 Task result received for ${taskName}`);
          console.log(`📊 Result type: ${typeof taskResult}`);
          
          if (taskResult) {
            console.log(`📊 Result keys: ${Object.keys(taskResult)}`);
            
            // Look for tool usage in the result
            if (taskResult.tasks && taskResult.tasks[0]) {
              const taskData = taskResult.tasks[0];
              console.log(`📋 Task status: ${taskData.status}`);
              console.log(`📋 Task output length: ${taskData.output ? taskData.output.length : 0} characters`);
              
              if (taskData.toolCalls) {
                console.log(`🔧 Tool calls made: ${taskData.toolCalls.length}`);
                taskData.toolCalls.forEach((call, index) => {
                  console.log(`   ${index + 1}. Tool: ${call.toolName}, Status: ${call.status}`);
                });
              } else {
                console.log(`⚠️ No tool calls found in task result`);
              }
            }
          }
          
          // Check for dynamic task suggestions in the output
          const taskOutput = JSON.stringify(taskResult);
          const suggestedTasks = await processDynamicTaskSuggestions(taskOutput);
          
          if (suggestedTasks.length > 0) {
            console.log(`🔍 Found ${suggestedTasks.length} dynamic task suggestions from ${taskName}`);
            for (const suggTask of suggestedTasks) {
              const taskId = await saveDynamicTask(suggTask);
              dynamicTasksFound.push({ ...suggTask, id: taskId, sourceTask: taskName });
            }
          }
          
          // Check if documentation was generated
          try {
            const outputFiles = await fs.readdir('./outputs', { recursive: true });
            console.log(`📁 Output files after task ${taskName}: ${outputFiles.length > 0 ? outputFiles.join(', ') : 'None'}`);
            
            // Check for markdown files specifically
            const markdownFiles = outputFiles.filter(f => f.endsWith('.md') || f.endsWith('.markdown'));
            if (markdownFiles.length > 0) {
              console.log(`📝 Markdown files found: ${markdownFiles.join(', ')}`);
              
              // Check the size of the most recent file
              const newestFile = markdownFiles[markdownFiles.length - 1];
              try {
                const filePath = path.join('./outputs', newestFile);
                const stats = await fs.stat(filePath);
                console.log(`📏 File ${newestFile} size: ${stats.size} bytes`);
                
                if (stats.size < 1000) {
                  console.log(`⚠️ Warning: File seems very small, checking content...`);
                  const content = await fs.readFile(filePath, 'utf8');
                  console.log(`📄 File content preview: ${content.substring(0, 200)}...`);
                }
              } catch (fileError) {
                console.log(`❌ Could not check file details: ${fileError.message}`);
              }
            }
          } catch (dirError) {
            console.log(`📁 Could not read outputs directory: ${dirError.message}`);
          }
          
          // Mark task as completed
          await saveCompletedTask(taskName);
          completedCount++;
          
          console.log(`✅ Task ${taskName} completed successfully (${completedCount}/${tasks.length})`);
          
          // Add delay between tasks
          if (i < tasks.length - 1) {
            console.log(`⏱️ Waiting 60 seconds before next task...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
          }
          
        } catch (taskError) {
          console.error(`❌ Task ${taskName} failed:`, taskError.message);
          console.error(`❌ Error stack:`, taskError.stack);
          
          if (isRateLimitError(taskError)) {
            console.log(`⏸️ Rate limit hit on task ${taskName}. Waiting 5 minutes before exit...`);
            await new Promise(resolve => setTimeout(resolve, 300000));
            console.log(`📊 Progress: ${completedCount}/${tasks.length} tasks completed`);
            console.log('🔄 Restart the script to resume from the next incomplete task.');
            process.exit(1);
          } else {
            console.log(`⚠️ Non-rate-limit error, continuing to next task...`);
          }
        }
      }
      
      // Process dynamic tasks if any were found
      if (dynamicTasksFound.length > 0) {
        console.log(`\n📋 Processing ${dynamicTasksFound.length} dynamic tasks found during execution`);
        
        // Save dynamic tasks summary
        await fs.writeFile(DYNAMIC_TASKS_FILE, JSON.stringify(dynamicTasksFound, null, 2));
        
        console.log('📝 Dynamic tasks saved to backlog for future processing');
        console.log('🔄 Run the script again to process prioritized dynamic tasks');
      }
      
      console.log('✅ All initial tasks completed successfully!');
      
    } catch (error) {
      console.error('❌ Critical error in team execution:', error);
      
      if (isRateLimitError(error)) {
        console.log('⏸️ Rate limit hit. Restart the script to resume.');
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log('Step 8: Analysis complete - documents saved by agents using documentation-generator tool');
    console.log('📁 Check ./outputs/ directories for generated documents');
    
    // Enhanced completion summary
    try {
      const summaryPath = path.join('./output', 'complete-results.json');
      const summary = {
        timestamp: new Date().toISOString(),
        completedTasks: await loadCompletedTasks(),
        totalTasksRun: tasks.length,
        dynamicTasksFound: dynamicTasksFound.length,
        taskBacklog: await loadTaskBacklog(),
        status: 'completed'
      };
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
      console.log('✅ Saved complete-results.json for debugging');
    } catch (saveError) {
      console.error('❌ Error saving debug file:', saveError);
    }
  } catch (error) {
    console.error('❌ Error occurred:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});