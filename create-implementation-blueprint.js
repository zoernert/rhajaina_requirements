// Generate detailed implementation blueprints for AI code generation
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function main() {
  try {
    const { Agent, Team, Task } = await import('kaibanjs');
    
    // Import documentation generator
    const toolModule = await import('./tools/documentation-generator.js');
    const documentationGenerator = toolModule.documentationGeneratorTool;
    
    const llmConfig = {
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_AI_API_KEY,
      temperature: 0.1,
      maxTokens: 8000,
      maxRetries: 3,
      retryDelay: 30000
    };

    const implementationArchitect = new Agent({
      name: 'Implementation Architect',
      role: 'Senior Implementation Specialist for AI Code Generation',
      goal: 'Create step-by-step implementation blueprints that AI coding assistants can follow',
      background: `You are an expert implementation architect who creates detailed technical blueprints.

CRITICAL: You MUST complete each task by calling the documentationGenerator tool exactly once.

STEP 1: Generate your blueprint content (minimum 6000 words)
STEP 2: Call documentationGenerator tool with these exact parameters:
- title: [the exact title from the task]
- content: [your generated content] 
- type: "document"
- format: "markdown"

Example: documentationGenerator({title: "Rhajaina Implementation Blueprint - Project Setup", content: "# My Blueprint Content...", type: "document", format: "markdown"})

You MUST call the tool to complete the task. Do not end without calling documentationGenerator.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 15,
      maxRetries: 3
    });

    const tasks = [
      // Blueprint 1: Project Structure and Setup
      new Task({
        description: `
        Generate a comprehensive Moleculer microservices project setup blueprint.
        
        STEP 1: Create content covering:
        - Complete Moleculer project folder structure
        - Service templates and patterns  
        - Configuration files and environment setup
        - Docker and deployment configurations
        - Development workflow and commands
        
        STEP 2: Call documentationGenerator tool with:
        title: "Rhajaina Implementation Blueprint - Project Setup"
        content: [your generated blueprint content]
        type: "document"
        format: "markdown"
        
        You MUST call the documentationGenerator tool to complete this task.
        `,
        agent: implementationArchitect,
        expectedOutput: 'Moleculer project setup blueprint saved via documentationGenerator tool'
      }),

      // Blueprint 2: AI Model Integration Implementation  
      new Task({
        description: `
        Generate a comprehensive AI model integration blueprint for Moleculer services.
        
        STEP 1: Create content covering:
        - AI provider service implementations (OpenAI, Claude, Gemini, etc.)
        - Context management and token optimization
        - Model switching and performance monitoring
        - Configuration and error handling
        
        STEP 2: Call documentationGenerator tool with:
        title: "Rhajaina Implementation Blueprint - AI Integration"
        content: [your generated blueprint content]
        type: "document"
        format: "markdown"
        
        You MUST call the documentationGenerator tool to complete this task.
        `,
        agent: implementationArchitect,
        expectedOutput: 'AI integration blueprint saved via documentationGenerator tool'
      }),

      // Blueprint 3: Vector Search and Database Implementation
      new Task({
        description: `
        Generate a comprehensive vector search and database blueprint for Moleculer.
        
        STEP 1: Create content covering:
        - Qdrant vector database Moleculer service
        - MongoDB integration with schemas  
        - Embedding generation pipeline
        - Search and retrieval algorithms
        
        STEP 2: Call documentationGenerator tool with:
        title: "Rhajaina Implementation Blueprint - Vector Search"
        content: [your generated blueprint content]
        type: "document"
        format: "markdown"
        
        You MUST call the documentationGenerator tool to complete this task.
        `,
        agent: implementationArchitect,
        expectedOutput: 'Vector search blueprint saved via documentationGenerator tool'
      }),

      // Blueprint 4: Frontend Implementation Guide
      new Task({
        description: `
        Generate a comprehensive React frontend implementation blueprint.
        
        STEP 1: Create content covering:
        - React component architecture and TypeScript interfaces
        - Chat interface implementation with real-time features
        - Styling, theming, and responsive design
        - Testing, optimization, and accessibility
        
        STEP 2: Call documentationGenerator tool with:
        title: "Rhajaina Implementation Blueprint - Frontend"
        content: [your generated blueprint content]
        type: "document"
        format: "markdown"
        
        You MUST call the documentationGenerator tool to complete this task.
        `,
        agent: implementationArchitect,
        expectedOutput: 'Frontend blueprint saved via documentationGenerator tool'
      }),

      // Blueprint 5: Backend API Implementation
      new Task({
        description: `
        Generate a comprehensive Moleculer backend API implementation blueprint.
        
        STEP 1: Create content covering:
        - Moleculer API Gateway setup and configuration
        - Service implementations with actions and events
        - Microservice architecture patterns
        - Monitoring, logging, and distributed tracing
        
        STEP 2: Call documentationGenerator tool with:
        title: "Rhajaina Implementation Blueprint - Backend"
        content: [your generated blueprint content]
        type: "document"
        format: "markdown"
        
        You MUST call the documentationGenerator tool to complete this task.
        `,
        agent: implementationArchitect,
        expectedOutput: 'Backend blueprint saved via documentationGenerator tool'
      })
    ];

    console.log('🏗️ Generating implementation blueprints for AI code generation...');
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const taskName = `Blueprint_${i + 1}`;
      
      console.log(`\n🔄 Generating ${taskName}...`);
      
      const team = new Team({
        name: taskName,
        agents: [task.agent],
        tasks: [task],
        logLevel: 'debug',
        maxTeamIterations: 5,
        timeout: 600000
      });
      
      try {
        await team.start();
        console.log(`✅ ${taskName} completed`);
        
        if (i < tasks.length - 1) {
          console.log('⏱️ Waiting 45 seconds...');
          await new Promise(resolve => setTimeout(resolve, 45000));
        }
      } catch (error) {
        console.error(`❌ ${taskName} failed:`, error.message);
        console.error('Full error:', error);
      }
    }
    
    console.log('\n🎉 Implementation blueprints generated!');
    console.log('📁 Check ./outputs/implementation-documents/ for blueprints');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);
