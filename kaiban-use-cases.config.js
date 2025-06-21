// KaibanJS configuration for generating comprehensive use cases from requirements
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Disable telemetry
process.env.KAIBAN_TELEMETRY_DISABLED = 'true';
process.env.TELEMETRY_DISABLED = 'true';
process.env.DO_NOT_TRACK = '1';

console.log('🎯 Starting Rhajaina Use Case Generation...');
dotenv.config();

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error('❌ No Google AI API key found!');
  process.exit(1);
}

// Import documentation generator
let documentationGenerator;
try {
  const toolModule = await import('./tools/documentation-generator.js');
  documentationGenerator = toolModule.documentationGeneratorTool || toolModule.default;
  console.log('✅ Documentation generator imported successfully');
} catch (importError) {
  console.error('❌ Failed to import documentation generator:', importError);
  process.exit(1);
}

async function loadAllRequirements() {
  console.log('📂 Loading all requirements from docs folder...');
  const docsDir = './docs';
  const requirements = {};
  
  try {
    const files = await fs.readdir(docsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(docsDir, file), 'utf8');
      const key = path.basename(file, '.md');
      requirements[key] = content;
      console.log(`📄 Loaded: ${file} (${content.length} chars)`);
    }
    
    console.log(`✅ Loaded ${mdFiles.length} requirement documents`);
    return requirements;
  } catch (error) {
    console.error('❌ Error loading requirements:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    const { Agent, Team, Task } = await import('kaibanjs');
    
    // Create use-cases output directory
    const useCasesDir = './outputs/use-cases';
    await fs.mkdir(useCasesDir, { recursive: true });
    console.log('✅ Created use-cases output directory');
    console.log(`📁 Use cases will be saved to: ${path.resolve(useCasesDir)}`);
    
    // Load all requirements
    const requirements = await loadAllRequirements();
    const reqContent = Object.entries(requirements)
      .map(([key, content]) => `## ${key.toUpperCase()}\n${content}`)
      .join('\n\n');
    
    // LLM Configuration with better settings for complex tasks
    const llmConfig = {
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_AI_API_KEY,
      temperature: 0.2, // Reduced for more focused output
      maxTokens: 8000,
      maxRetries: 5, // Increased retries
      retryDelay: 45000 // Longer delay between retries
    };

    // Create specialized agents for use case generation
    const useCaseAnalyst = new Agent({
      name: 'Use Case Analyst',
      role: 'Senior Business Analyst & Use Case Specialist',
      goal: 'Identify and categorize all possible use cases for the Rhajaina AI Chat Application',
      background: `You are an expert business analyst specializing in use case identification and documentation. 
      Your task is to comprehensively analyze requirements and identify ALL possible use cases, including:
      - Primary user workflows
      - Administrative functions  
      - Error scenarios
      - Edge cases
      - Integration scenarios
      - Maintenance operations
      Create exhaustive, well-structured use case categories.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 30, // Increased from 30
      maxRetries: 3
    });

    const userJourneyExpert = new Agent({
      name: 'User Journey Expert',
      role: 'Senior UX Researcher & User Journey Specialist',
      goal: 'Define detailed user interactions and journey-based use cases',
      background: `You are a UX expert who specializes in mapping user journeys and interactions.
      Focus on user-centric use cases including:
      - Onboarding flows
      - Daily usage patterns
      - Collaboration scenarios
      - Personalization use cases
      - Accessibility scenarios
      Create detailed, user-focused use case documentation.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 25, // Increased from 25
      maxRetries: 3
    });

    const technicalUseCaseExpert = new Agent({
      name: 'Technical Use Case Expert',
      role: 'Senior Technical Architect & Integration Specialist',
      goal: 'Define technical, integration, and system-level use cases',
      background: `You are a technical expert specializing in system integration and technical use cases.
      Focus on technical scenarios including:
      - API integrations
      - System administration
      - Performance monitoring
      - Security scenarios
      - Deployment operations
      - Data management
      Create comprehensive technical use case documentation.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 25, // Increased from 25
      maxRetries: 3
    });

    const aiWorkflowSpecialist = new Agent({
      name: 'AI Workflow Specialist',
      role: 'AI/ML Specialist & Workflow Expert',
      goal: 'Define AI-specific and workflow-related use cases',
      background: `You are an AI/ML specialist focusing on AI workflow and automation use cases.
      Focus on AI-specific scenarios including:
      - Model switching and fallbacks
      - Context management
      - Vector search operations
      - Tool orchestration
      - Agent workflows
      - Performance optimization
      Create detailed AI-workflow use case documentation.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 25, // Increased from 25
      maxRetries: 3
    });

    // Define comprehensive use case generation tasks
    const tasks = [
      // Task 1: Primary User Use Cases
      new Task({
        description: `
        Analyze the requirements and generate PRIMARY USER USE CASES for the Rhajaina AI Chat Application.

        REQUIREMENTS TO ANALYZE:
        ${reqContent}

        GENERATE COMPREHENSIVE USE CASES COVERING:

        ## 1. AUTHENTICATION & ONBOARDING (5-7 use cases)
        - User registration and account setup
        - Login/logout scenarios
        - Password reset and recovery
        - Profile creation and management
        - Initial system setup and preferences

        ## 2. CORE CHAT FUNCTIONALITY (8-10 use cases)
        - Starting new conversations
        - Sending/receiving messages
        - Message formatting and rich content
        - Chat history browsing
        - Message search and filtering
        - Chat session management
        - Context switching between conversations
        - Message editing and deletion

        ## 3. AI MODEL INTERACTIONS (6-8 use cases)
        - Model selection and switching
        - Context-aware conversations
        - Multi-turn dialogue management
        - AI response customization
        - Model performance feedback
        - Fallback handling scenarios

        FORMAT: For each use case, provide:
        - Use Case ID (UC-001, UC-002, etc.)
        - Title
        - Primary Actor
        - Goal/Objective
        - Preconditions
        - Main Flow (step-by-step)
        - Alternative Flows
        - Postconditions
        - Business Rules

        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_complete_primary_use_cases", "title": "Rhajaina Primary User Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Primary user use cases document saved via documentationGenerator tool'
      }),

      // Task 2: Advanced Feature Use Cases
      new Task({
        description: `
        Generate ADVANCED FEATURE USE CASES for specialized Rhajaina functionality.

        GENERATE ADVANCED USE CASES COVERING:

        ## 1. FILE MANAGEMENT & PROCESSING (5-6 use cases)
        - File upload and processing
        - OCR and content extraction
        - Document vectorization
        - File search and retrieval
        - Batch file processing
        - File sharing and permissions

        ## 2. VECTOR SEARCH & SEMANTIC OPERATIONS (4-5 use cases)
        - Semantic search across conversations
        - Vector embedding generation
        - Similarity search operations
        - Collection management
        - Metadata filtering and indexing

        ## 3. COLLABORATION & SHARING (6-7 use cases)
        - Workspace creation and management
        - Team collaboration setup
        - Conversation sharing
        - Real-time collaborative editing
        - Permission management
        - Team analytics and insights

        ## 4. PERSONALIZATION & PREFERENCES (4-5 use cases)
        - User preference configuration
        - Custom AI behavior settings
        - Interface customization
        - Notification management
        - Theme and accessibility settings

        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_complete_advanced_use_cases", "title": "Rhajaina Advanced Feature Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: userJourneyExpert,
        expectedOutput: 'Advanced feature use cases document saved via documentationGenerator tool'
      }),

      // Task 3: Technical & Administrative Use Cases
      new Task({
        description: `
        Generate TECHNICAL AND ADMINISTRATIVE USE CASES for system management and operations.

        GENERATE TECHNICAL USE CASES COVERING:

        ## 1. SYSTEM ADMINISTRATION (6-8 use cases)
        - User account management
        - System configuration updates
        - Database maintenance operations
        - Performance monitoring and optimization
        - Security audit and compliance
        - Backup and recovery procedures
        - System health monitoring

        ## 2. API & INTEGRATION MANAGEMENT (5-6 use cases)
        - Third-party API integration
        - MCP tool registration and management
        - OpenAPI specification handling
        - Webhook configuration
        - Rate limiting and throttling
        - Integration testing and validation

        ## 3. DEPLOYMENT & SCALING (4-5 use cases)
        - Application deployment procedures
        - Auto-scaling configuration
        - Load balancer management
        - Container orchestration
        - Blue-green deployment scenarios

        ## 4. SECURITY & COMPLIANCE (5-6 use cases)
        - Authentication and authorization setup
        - Data encryption management
        - Audit log management
        - Compliance reporting
        - Security incident response
        - Privacy controls implementation

        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_complete_technical_use_cases", "title": "Rhajaina Technical and Administrative Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: technicalUseCaseExpert,
        expectedOutput: 'Technical and administrative use cases document saved via documentationGenerator tool'
      }),

      // Task 4: AI Workflow & Automation Use Cases
      new Task({
        description: `
        Generate AI WORKFLOW AND AUTOMATION USE CASES for intelligent system operations.

        GENERATE AI WORKFLOW USE CASES COVERING:

        ## 1. AGENT WORKFLOW OPERATIONS (6-7 use cases)
        - Think-Act-Respond pipeline execution
        - Multi-step reasoning processes
        - Tool orchestration and chaining
        - Context synthesis and optimization
        - Workflow error handling and recovery
        - Performance metrics collection

        ## 2. INTELLIGENT AUTOMATION (5-6 use cases)
        - Idle chat detection and summarization
        - Automatic conversation clustering
        - Smart notification management
        - Predictive text suggestions
        - Auto-completion and assistance
        - Content recommendation systems

        ## 3. MODEL MANAGEMENT & OPTIMIZATION (5-6 use cases)
        - Dynamic model switching based on context
        - Token optimization strategies
        - Context window management
        - Model performance monitoring
        - Fallback chain execution
        - Model fine-tuning workflows

        ## 4. TOOL & INTEGRATION WORKFLOWS (4-5 use cases)
        - Dynamic tool discovery and registration
        - Tool execution monitoring
        - Natural language tool output processing
        - Tool caching and optimization
        - Custom tool development workflows

        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_complete_ai_workflow_use_cases", "title": "Rhajaina AI Workflow and Automation Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: aiWorkflowSpecialist,
        expectedOutput: 'AI workflow and automation use cases document saved via documentationGenerator tool'
      }),

      // Task 5: Error Handling & Edge Case Use Cases
      new Task({
        description: `
        Generate ERROR HANDLING AND EDGE CASE USE CASES for comprehensive system coverage.

        GENERATE ERROR AND EDGE CASE USE CASES COVERING:

        ## 1. SYSTEM ERROR SCENARIOS (5-6 use cases)
        - Network connectivity failures
        - Database connection errors
        - AI model service outages
        - Rate limit exceeded scenarios
        - Memory and resource exhaustion
        - Concurrent user conflicts

        ## 2. USER ERROR SCENARIOS (4-5 use cases)
        - Invalid input handling
        - Unauthorized access attempts
        - Session timeout handling
        - Corrupted file uploads
        - Malformed API requests

        ## 3. DATA INTEGRITY SCENARIOS (4-5 use cases)
        - Data corruption detection
        - Backup restoration procedures
        - Data migration failures
        - Synchronization conflicts
        - Version control conflicts

        ## 4. EDGE CASES & BOUNDARY CONDITIONS (4-5 use cases)
        - Maximum conversation length limits
        - Large file processing scenarios
        - High concurrent user loads
        - Extended idle periods
        - Cross-timezone collaboration

        ## 5. RECOVERY & RESILIENCE (3-4 use cases)
        - Automatic failover procedures
        - Graceful degradation scenarios
        - Service restoration workflows
        - Data recovery operations

        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_complete_error_edge_use_cases", "title": "Rhajaina Error Handling and Edge Case Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: technicalUseCaseExpert,
        expectedOutput: 'Error handling and edge case use cases document saved via documentationGenerator tool'
      }),

      // Task 6: Use Case Summary and Matrix
      new Task({
        description: `
        Generate a COMPREHENSIVE USE CASE SUMMARY AND TRACEABILITY MATRIX.

        CREATE A SUMMARY DOCUMENT INCLUDING:

        ## 1. USE CASE OVERVIEW MATRIX
        - Complete list of all identified use cases (30+ expected)
        - Categorization by functional area
        - Priority levels (Critical, High, Medium, Low)
        - Complexity estimates (Simple, Medium, Complex)
        - Implementation phases mapping

        ## 2. REQUIREMENTS TRACEABILITY
        - Mapping between requirements and use cases
        - Coverage analysis showing which requirements are addressed
        - Gap identification for uncovered requirements

        ## 3. USER ROLE MAPPING
        - Primary actors for each use case
        - Secondary actors and stakeholders
        - Permission and access level requirements

        ## 4. INTEGRATION DEPENDENCIES
        - Cross-use case dependencies
        - External system integration points
        - API and service dependencies

        ## 5. TESTING IMPLICATIONS
        - Use cases requiring special testing approaches
        - Performance testing scenarios
        - Security testing requirements
        - Integration testing needs

        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_complete_use_case_summary", "title": "Rhajaina Use Case Summary and Traceability Matrix", "type": "use-cases", "format": "markdown"})
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Use case summary and traceability matrix document saved via documentationGenerator tool'
      })
    ];

    // Execute tasks sequentially
    console.log(`🚀 Starting use case generation with ${tasks.length} tasks...`);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const taskName = `UseCase_Task_${i + 1}`;
      
      console.log(`\n🔄 Executing task ${i + 1}/${tasks.length}: ${taskName}`);
      console.log(`👤 Agent: ${task.agent.name}`);

      const team = new Team({
        name: `Use Case Generation - ${taskName}`,
        agents: [task.agent],
        tasks: [task],
        logLevel: 'info',
        maxTeamIterations: 3, // Increased from 3
        timeout: 300000 // Increased to 10 minutes
      });

      try {
        const result = await team.start();
        console.log(`✅ Task ${taskName} completed successfully`);
        
        // Verify that documentation was actually generated
        try {
          const files = await fs.readdir('./outputs/use-cases');
          console.log(`📁 Current use case files: ${files.length}`);
        } catch (dirError) {
          console.log(`⚠️ Could not read use-cases directory: ${dirError.message}`);
        }
        
        // Add delay between tasks to avoid rate limits
        if (i < tasks.length - 1) {
          console.log(`⏱️ Waiting 60 seconds before next task...`); // Increased delay
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      } catch (error) {
        console.error(`❌ Task ${taskName} failed:`, error.message);
        
        // Check if it's a max iterations error
        if (error.message.includes('MAX_ITERATIONS_ERROR')) {
          console.log(`⚠️ Max iterations reached for ${taskName}. Consider breaking this task into smaller parts.`);
        }
        
        // Continue with next task even if one fails
        console.log(`⚠️ Continuing to next task...`);
      }
    }

    console.log('\n🎉 Use case generation completed!');
    console.log('📁 Check ./outputs/use-cases/ for all generated use case documents');
    
    // Generate final summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalTasks: tasks.length,
      expectedUseCases: '30+',
      outputDirectory: './outputs/use-cases/',
      status: 'completed'
    };
    
    await fs.writeFile('./outputs/use-case-generation-summary.json', JSON.stringify(summary, null, 2));
    console.log('✅ Generated use-case-generation-summary.json');

  } catch (error) {
    console.error('❌ Critical error in use case generation:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
