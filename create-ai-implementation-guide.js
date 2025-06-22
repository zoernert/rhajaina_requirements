// Generate AI Implementation Guide for coding assistants
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

    const aiGuideArchitect = new Agent({
      name: 'AI Guide Architect',
      role: 'AI Implementation Guide Specialist',
      goal: 'Create comprehensive guides for AI coding assistants',
      background: `You are an expert implementation architect who creates detailed technical blueprints.

CRITICAL: You MUST complete each task by calling the documentationGenerator tool exactly once.

STEP 1: Generate your blueprint content (minimum 6000 words)
STEP 2: Call documentationGenerator tool with these exact parameters:
- title: [the exact title from the task]
- content: [your generated content] 
- type: "document"
- format: "markdown"

You MUST call the tool to complete the task. Do not end without calling documentationGenerator.`,
      tools: [documentationGenerator],
      llmConfig: llmConfig,
      maxAgentIterations: 15,
      maxRetries: 3
    });

    const task = new Task({
      description: `
      Generate a comprehensive AI Implementation Guide for the Rhajaina project.
      
      STEP 1: Create content covering:
      - AI prompting strategies for different implementation phases
      - Step-by-step implementation workflows
      - Code generation best practices and templates
      - Quality assurance and testing approaches
      
      STEP 2: Call documentationGenerator tool with:
      title: "Rhajaina AI Implementation Guide"
      content: [your generated guide content]
      type: "document"
      format: "markdown"
      
      You MUST call the documentationGenerator tool to complete this task.
      `,
      agent: aiGuideArchitect,
      expectedOutput: 'AI Implementation Guide saved via documentationGenerator tool'
    });

    console.log('🤖 Generating AI Implementation Guide...');
    
    const team = new Team({
      name: 'AI_Implementation_Guide',
      agents: [aiGuideArchitect],
      tasks: [task],
      logLevel: 'debug',
      maxTeamIterations: 5,
      timeout: 600000
    });
    
    await team.start();
    console.log('✅ AI Implementation Guide completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);
