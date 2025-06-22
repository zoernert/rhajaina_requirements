// Simplified use case generation with smaller, focused tasks
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Disable telemetry
process.env.KAIBAN_TELEMETRY_DISABLED = 'true';
process.env.TELEMETRY_DISABLED = 'true';
process.env.DO_NOT_TRACK = '1';

console.log('🎯 Starting Simplified Rhajaina Use Case Generation...');
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
  console.log('📂 Loading all requirements from docs/requirements/ folder...');
  const docsDir = './docs/requirements';
  const requirements = {};
  
  try {
    // Function to recursively read markdown files from subdirectories
    async function readMarkdownFiles(dir, prefix = '') {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          // Recursively read subdirectories
          console.log(`📁 Scanning directory: ${fullPath}`);
          await readMarkdownFiles(fullPath, `${prefix}${item.name}_`);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          // Read markdown files
          const content = await fs.readFile(fullPath, 'utf8');
          const key = `${prefix}${path.basename(item.name, '.md')}`;
          requirements[key] = content;
          console.log(`📄 Loaded: ${fullPath} (${content.length} chars) as key: ${key}`);
        }
      }
    }
    
    // Check if the docs/requirements directory exists
    try {
      await fs.access(docsDir);
      await readMarkdownFiles(docsDir);
    } catch (accessError) {
      console.log(`⚠️ Could not access ${docsDir}, trying ./docs...`);
      
      // Fallback to ./docs directory
      try {
        await readMarkdownFiles('./docs');
      } catch (fallbackError) {
        console.log(`⚠️ Could not access ./docs either, using comprehensive fallback`);
        requirements['comprehensive-requirements'] = `
# Rhajaina AI Chat Application Requirements

## Core Features
- Multi-AI chat application with real-time messaging
- File upload and processing with OCR capabilities
- Vector search using Qdrant for semantic operations
- User authentication and authorization system
- MCP tool integration for extensibility
- Collaboration features for team workspaces

## Technical Requirements
- Frontend: React.js with responsive design
- Backend: Node.js/Express with microservices architecture
- Database: MongoDB for persistence, Qdrant for vector search
- Real-time: WebSocket/Socket.io for live messaging
- AI Models: Multi-provider integration (OpenAI, Claude, Gemini, Mistral, DeepSeek)
- Security: JWT authentication, data encryption, compliance controls

## User Experience
- Intuitive chat interface with modern design
- Fast response times (<2 seconds for AI interactions)
- Mobile-responsive design with accessibility support
- Customizable themes and user preferences
- Comprehensive search and filtering capabilities

## Advanced Features
- Context management and token optimization
- Idle chat detection and summarization
- Automatic conversation clustering
- Tool orchestration and workflow automation
- Performance monitoring and analytics
`;
      }
    }
    
    if (Object.keys(requirements).length === 0) {
      console.log('⚠️ No requirements found, using minimal fallback');
      requirements['minimal-fallback'] = 'AI chat application with basic functionality';
    }
    
    console.log(`✅ Loaded ${Object.keys(requirements).length} requirement documents`);
    console.log(`📋 Requirement keys: ${Object.keys(requirements).join(', ')}`);
    
    // Log total content size for verification
    const totalSize = Object.values(requirements).reduce((sum, content) => sum + content.length, 0);
    console.log(`📊 Total requirements content: ${totalSize} characters`);
    
    return requirements;
  } catch (error) {
    console.error('❌ Error loading requirements:', error);
    return {
      'error-fallback': 'Basic AI chat application requirements due to loading error'
    };
  }
}

async function main() {
  try {
    const { Agent, Team, Task } = await import('kaibanjs');
    
    // Create use-cases output directory
    const useCasesDir = './outputs/use-cases';
    await fs.mkdir(useCasesDir, { recursive: true });
    console.log('✅ Created use-cases output directory');
    
    // Load all requirements
    const requirements = await loadAllRequirements();
    const reqContent = Object.entries(requirements)
      .map(([key, content]) => `## ${key.toUpperCase()}\n${content}`)
      .join('\n\n');
    
    // Ultra-conservative LLM Configuration
    const llmConfig = {
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_AI_API_KEY,
      temperature: 0.1,
      maxTokens: 3000, // Further reduced
      maxRetries: 2,
      retryDelay: 30000
    };

    // Create simple, focused agent with very specific instructions
    const useCaseAnalyst = new Agent({
      name: 'Use Case Analyst',
      role: 'Business Analyst',
      goal: 'Create use case documentation and save it immediately',
      background: `You are a business analyst. Your ONLY job is to:
      1. Create the requested use cases with actual content
      2. Call the documentationGenerator tool with the exact JSON format shown below
      3. Stop after calling the tool successfully
      
      CRITICAL: Always use this EXACT format for the tool call:
      documentationGenerator({"content": "# Authentication Use Cases\n\n## UC-001: User Registration\n**Actor:** End User\n**Goal:** Create new account\n**Steps:**\n1. User navigates to registration page\n2. User fills in required information\n3. System validates information\n4. System creates account\n5. System sends confirmation\n\n## UC-002: User Login\n**Actor:** End User\n**Goal:** Access the application\n**Steps:**\n1. User navigates to login page\n2. User enters credentials\n3. System validates credentials\n4. System grants access\n5. User redirected to dashboard\n\n## UC-003: Password Reset\n**Actor:** End User\n**Goal:** Reset forgotten password\n**Steps:**\n1. User clicks forgot password\n2. User enters email address\n3. System sends reset link\n4. User clicks reset link\n5. User creates new password", "title": "Rhajaina Authentication Use Cases", "type": "use-cases", "format": "markdown"})
      
      DO NOT use variables or placeholders. Provide the actual complete content.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 2, // Reduced even further
      maxRetries: 1
    });

    // Simplified tasks - focus on one category at a time
    const simpleTasks = [
      // Task 1: Authentication use cases (COMPLETED)
      new Task({
        description: `
        Create AUTHENTICATION USE CASES based on the loaded requirements.
        
        Generate exactly 3 authentication use cases:
        1. User Registration (UC-001)
        2. User Login (UC-002)  
        3. Password Reset (UC-003)
        
        MANDATORY: Call documentationGenerator with title "Rhajaina Authentication Use Cases"
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Authentication use cases saved'
      }),

      // Task 2: Core chat functionality
      new Task({
        description: `
        Create CORE CHAT FUNCTIONALITY USE CASES based on the loaded requirements.
        
        Generate exactly 5 core chat use cases:
        1. Start New Chat (UC-004)
        2. Send Message (UC-005)
        3. Receive AI Response (UC-006)
        4. View Chat History (UC-007)
        5. Search Messages (UC-008)
        
        For each use case, include:
        - Use Case ID
        - Title
        - Actor: End User
        - Goal: Brief description
        - Steps: 4-5 numbered steps
        
        MANDATORY: Call documentationGenerator with title "Rhajaina Core Chat Use Cases"
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Core chat use cases saved'
      }),

      // Task 3: AI model interactions
      new Task({
        description: `
        Create AI MODEL INTERACTION USE CASES based on the loaded requirements.
        
        Generate exactly 4 AI interaction use cases:
        1. Select AI Model (UC-009)
        2. Switch AI Model Mid-Conversation (UC-010)
        3. Configure AI Settings (UC-011)
        4. Handle AI Model Errors (UC-012)
        
        MANDATORY: Call documentationGenerator with title "Rhajaina AI Model Interaction Use Cases"
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'AI interaction use cases saved'
      }),

      // Task 4: File management
      new Task({
        description: `
        Create FILE MANAGEMENT USE CASES based on the loaded requirements.
        
        Generate exactly 4 file management use cases:
        1. Upload File (UC-013)
        2. Process Document with OCR (UC-014)
        3. Search File Content (UC-015)
        4. Share File with Team (UC-016)
        
        MANDATORY: Call documentationGenerator with title "Rhajaina File Management Use Cases"
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'File management use cases saved'
      }),

      // Task 5: Vector search and semantic operations
      new Task({
        description: `
        Create VECTOR SEARCH USE CASES based on the loaded requirements.
        
        Generate exactly 4 vector search use cases:
        1. Semantic Search Across Chats (UC-017)
        2. Generate Vector Embeddings (UC-018)
        3. Find Similar Conversations (UC-019)
        4. Filter Search Results (UC-020)
        
        MANDATORY: Call documentationGenerator with title "Rhajaina Vector Search Use Cases"
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Vector search use cases saved'
      }),

      // Task 6: Administration and system management
      new Task({
        description: `
        Create ADMINISTRATION USE CASES based on the loaded requirements.
        
        Generate exactly 4 administration use cases:
        1. Manage User Accounts (UC-021)
        2. Monitor System Performance (UC-022)
        3. Configure System Settings (UC-023)
        4. Backup and Recovery (UC-024)
        
        MANDATORY: Call documentationGenerator with title "Rhajaina Administration Use Cases"
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Administration use cases saved'
      })
    ];

    // Execute ultra-simple tasks
    console.log(`🚀 Starting simplified use case generation with ${simpleTasks.length} tasks...`);

    for (let i = 0; i < simpleTasks.length; i++) {
      const task = simpleTasks[i];
      const taskName = `Simple_UseCase_${i + 1}`;
      
      console.log(`\n🔄 Executing task ${i + 1}/${simpleTasks.length}: ${taskName}`);

      const team = new Team({
        name: taskName,
        agents: [task.agent],
        tasks: [task],
        logLevel: 'info',
        maxTeamIterations: 2, // Very low
        timeout: 120000 // 2 minutes max
      });

      try {
        const result = await team.start();
        console.log(`✅ Task ${taskName} completed successfully`);
        
        // Check files generated
        try {
          const files = await fs.readdir('./outputs/use-cases-documents');
          console.log(`📁 Use case files: ${files.length}`);
        } catch (dirError) {
          console.log(`⚠️ Could not read directory: ${dirError.message}`);
        }
        
        // Short delay between tasks
        if (i < simpleTasks.length - 1) {
          console.log(`⏱️ Waiting 30 seconds before next task...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } catch (error) {
        console.error(`❌ Task ${taskName} failed:`, error.message);
        console.log(`⚠️ Continuing to next task...`);
      }
    }

    console.log('\n🎉 Simplified use case generation completed!');
    console.log('📁 Check ./outputs/use-cases-documents/ for generated files');

  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
