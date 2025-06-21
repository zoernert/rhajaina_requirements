// Simple kaiban.config.js - Based on working test-minimal.js pattern
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { documentationGenerator } from './tools/documentation-generator.js';

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
    console.log('Step 3.1: Cleaning output directories...');
    const outputDir = './output';
    const outputsDir = './outputs';
    
    // Remove existing directories if they exist
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(outputsDir, { recursive: true, force: true });
      console.log('✅ Cleaned existing output directories');
    } catch (cleanError) {
      console.log('ℹ️ No existing directories to clean');
    }
    
    // Create fresh directories
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(outputsDir, { recursive: true });
    console.log('✅ Created fresh output directories');
    
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
      // PLANNING TASK - Analyze requirements and create artifact plan
      {
        name: 'requirementsPlanning',
        createTask: () => new Task({
          description: `
          Analyze all Rhajaina AI Chat Application requirements and create a comprehensive artifact plan.
          
          Requirements to analyze for planning:
          
          Core Chat Requirements:
          ${coreReqs}
          
          Vector Search Requirements:
          ${vectorReqs}
          
          Idle Chat Requirements:
          ${idleReqs}
          
          Agent Workflow Requirements:
          ${agentReqs}
          
          Architecture Requirements:
          ${archReqs}
          
          Feature Requirements:
          ${featureReqs}
          
          UX/UI Requirements:
          ${uxReqs}
          
          Based on the complexity and scope of these requirements, create a detailed artifact plan that includes:
          
          1. REQUIREMENTS COMPLEXITY ANALYSIS (1500+ words):
             - Assess the complexity and scope of each requirement area
             - Identify interdependencies between different components
             - Determine the level of detail needed for each area
             - Assess technical complexity and implementation challenges
             - Identify areas that need multiple artifacts vs single artifacts
          
          2. RECOMMENDED ARTIFACT STRUCTURE (2000+ words):
             - Propose specific artifacts needed for comprehensive coverage
             - Define the scope and focus of each recommended artifact
             - Specify word count targets for each artifact (aim for 8000 words each)
             - Identify which requirements should be combined vs separated
             - Plan the logical flow and dependencies between artifacts
             - Suggest consolidation and integration strategies
          
          3. PRIORITIZATION AND SEQUENCING (1500+ words):
             - Recommend the order of artifact creation based on dependencies
             - Identify critical path artifacts that block other work
             - Suggest parallel development opportunities
             - Plan for consolidation and integration phases
             - Identify potential risks and mitigation strategies
          
          4. QUALITY AND COMPLETENESS FRAMEWORK (1500+ words):
             - Define quality criteria for each artifact
             - Specify completeness checklists and validation criteria
             - Plan for consistency across artifacts
             - Define integration and consolidation standards
             - Recommend review and validation processes
          
          5. DYNAMIC TASK SUGGESTIONS (1500+ words):
             - Suggest specific tasks using the NEW_TASK format for any additional artifacts needed
             - Recommend specialized analysis tasks if complexity warrants it
             - Suggest integration and consolidation tasks
             - Identify potential gaps that need dedicated artifacts
          
          For any additional artifacts you recommend, use this format:
          NEW_TASK: {"name": "artifact_name", "description": "detailed_description_of_scope_and_focus", "agent": "requirementsAnalyst", "priority": "P0-P3", "dependencies": ["prerequisite_tasks"]}
          
          IMPORTANT: Create comprehensive planning document of 8000+ words. Use documentation-generator tool:
          {"content": "your_markdown_content", "title": "Requirements Analysis Artifact Plan", "type": "planning", "format": "markdown"}
          `,
          agent: requirementsAnalyst,
          expectedOutput: 'Comprehensive artifact plan with recommended structure and sequencing'
        })
      },
      
      // CORE CHAT ANALYSIS - PART 1: Executive Summary and Business Analysis
      {
        name: 'coreChat_ExecutiveSummary',
        createTask: () => new Task({
          description: `
          Create Part 1 of Core Chat Analysis: Executive Summary and Business Analysis for Rhajaina AI Chat Application.
          
          Requirements to analyze:
          ${coreReqs}
          
          Focus ONLY on:
          
          1. EXECUTIVE SUMMARY (2500+ words):
             - Detailed business context and market positioning
             - Strategic value proposition and competitive advantages
             - ROI projections and business impact analysis
             - Stakeholder analysis and user personas
             - Market research and competitive landscape
             - Success metrics and KPIs
             - Business objectives and strategic alignment
          
          2. BUSINESS ANALYSIS (2500+ words):
             - Market opportunity and competitive analysis
             - Business model and revenue implications
             - Cost-benefit analysis and financial projections
             - Risk assessment from business perspective
             - Stakeholder impact analysis
             - Success criteria and measurement framework
          
          3. USER PERSONAS AND JOURNEY MAPPING (3000+ words):
             - Detailed user personas with demographics and needs
             - Complete user journey mapping for each persona
             - User experience goals and pain points
             - Accessibility and inclusive design requirements
             - Cross-platform and mobile considerations
             - User engagement and retention strategies
          
          IMPORTANT: Create comprehensive Part 1 artifact of 8000 words. Use documentation-generator tool:
          {"content": "your_markdown_content", "title": "Core Chat Analysis Part 1 - Executive Summary and Business Analysis", "type": "requirements", "format": "markdown"}
          `,
          agent: requirementsAnalyst,
          expectedOutput: 'Core Chat Analysis Part 1 - Executive Summary and Business Analysis'
        })
      },

      // ...existing code for other tasks...
    ];

    // Enhanced task filtering with planning-based dynamic task addition
    const tasks = [];
    let planningCompleted = await isTaskCompleted('requirementsPlanning');
    
    // Always run planning first if not completed
    if (!planningCompleted) {
      const planningTask = allTaskDefinitions.find(def => def.name === 'requirementsPlanning');
      if (planningTask) {
        tasks.push(planningTask.createTask());
        console.log(`➕ Added planning task: requirementsPlanning`);
      }
    } else {
      console.log(`⏭️ Planning already completed - loading dynamic tasks from backlog`);
      
      // Load and process any dynamic tasks from the backlog
      const backlog = await loadTaskBacklog();
      const pendingDynamicTasks = backlog.filter(task => task.status === 'pending');
      
      if (pendingDynamicTasks.length > 0) {
        console.log(`📋 Found ${pendingDynamicTasks.length} pending dynamic tasks from planning phase`);
        
        // Add dynamic tasks to the execution queue
        for (const dynamicTask of pendingDynamicTasks) {
          const dynamicTaskDef = {
            name: dynamicTask.id,
            createTask: () => new Task({
              description: dynamicTask.description,
              agent: requirementsAnalyst, // Default to requirements analyst
              expectedOutput: `Dynamic task: ${dynamicTask.name}`
            })
          };
          
          if (!(await isTaskCompleted(dynamicTask.id))) {
            tasks.push(dynamicTaskDef.createTask());
            console.log(`➕ Added dynamic task: ${dynamicTask.name}`);
          }
        }
      }
      
      // Add regular tasks that aren't completed
      for (const taskDef of allTaskDefinitions) {
        if (taskDef.name !== 'requirementsPlanning' && !(await isTaskCompleted(taskDef.name))) {
          tasks.push(taskDef.createTask());
          console.log(`➕ Added task: ${taskDef.name}`);
        } else if (taskDef.name !== 'requirementsPlanning') {
          console.log(`⏭️ Skipping ${taskDef.name} - already completed`);
        }
      }
    }

    console.log(`📊 Total tasks to run: ${tasks.length} of ${allTaskDefinitions.length}`);
    
    if (tasks.length === 0) {
      console.log('🎉 All tasks already completed! Check ./outputs/ for results.');
      process.exit(0);
    }

    // Add delay between task execution to handle rate limits
    console.log('⏱️ Adding delays between tasks to prevent rate limits...');
    
    // Define team environment configuration
    const teamEnv = {
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
      KAIBAN_TELEMETRY_DISABLED: 'true',
      TELEMETRY_DISABLED: 'true',
      DO_NOT_TRACK: '1'
    };
    
    console.log('Step 7: Starting requirements analysis with dynamic task detection...');
    console.log('🚀 Starting Rhajaina AI Chat Application Requirements Analysis...');
    
    // Declare variables outside try block for proper scope
    let completedCount = 0;
    let dynamicTasksFound = [];
    
    try {
      // Execute tasks one by one with delay and error handling
      
      for (let i = 0; i < tasks.length; i++) {
        const taskName = allTaskDefinitions.find(def => 
          tasks[i].description.includes(def.createTask().description.split('\n')[1])
        )?.name || `task_${i}`;
        
        console.log(`\n🔄 Executing task ${i + 1}/${tasks.length}: ${taskName}`);
        
        try {
          // Create a mini team for single task execution with enhanced config
          const singleTaskTeam = new Team({
            name: `Task ${taskName}`,
            agents: [tasks[i].agent],
            tasks: [tasks[i]],
            env: teamEnv,
            logLevel: 'info',
            maxTeamIterations: 5,
            timeout: 300000
          });
          
          // Use retry with backoff and model fallback
          const taskResult = await retryWithBackoffAndFallback(
            async (agent) => {
              // Update the task's agent if fallback is being used
              const updatedTask = new Task({
                description: tasks[i].description,
                agent: agent,
                expectedOutput: tasks[i].expectedOutput
              });
              
              const fallbackTeam = new Team({
                name: `Task ${taskName}`,
                agents: [agent],
                tasks: [updatedTask],
                env: teamEnv,
                logLevel: 'info',
                maxTeamIterations: 5,
                timeout: 300000
              });
              
              return await fallbackTeam.start();
            },
            tasks[i].agent,
            hasMistralFallback ? mistralConfig : null,
            3,
            90000
          );
          
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
          
          // Mark task as completed
          await saveCompletedTask(taskName);
          completedCount++;
          
          console.log(`✅ Task ${taskName} completed successfully (${completedCount}/${tasks.length})`);
          
          // Adaptive delay based on which model was used
          const delay = tasks[i].agent.llmConfig?.provider === 'mistral' ? 30000 : 60000;
          if (i < tasks.length - 1) {
            console.log(`⏱️ Waiting ${delay/1000} seconds before next task...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (taskError) {
          console.error(`❌ Task ${taskName} failed:`, taskError.message);
          
          if (isRateLimitError(taskError)) {
            console.log(`⏸️ Rate limit hit on task ${taskName} (both models exhausted). Waiting 5 minutes before exit...`);
            await new Promise(resolve => setTimeout(resolve, 300000)); // Wait 5 minutes
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
        
        // Create prioritization report
        console.log('🎯 Creating dynamic task prioritization analysis...');
        
        // You could optionally execute the prioritization task here
        // or save it for the next run depending on your preference
        
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
      const summaryPath = path.join(outputDir, 'complete-results.json');
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
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});