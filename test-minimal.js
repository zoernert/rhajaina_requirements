// test-minimal.js - Minimal test to isolate the issue
import dotenv from 'dotenv';

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
  
  console.log('Step 4: Creating a simple agent...');
  const testAgent = new Agent({
    name: 'Test Agent',
    role: 'Tester',
    goal: 'Test the system',
    background: 'Testing agent',
    llmConfig: {
      provider: 'google',
      model: 'gemini-1.5-flash',
      apiKey: process.env.GOOGLE_AI_API_KEY
    }
  });
  
  console.log('✅ Agent created successfully:', testAgent.name);
  
  console.log('Step 5: Creating a simple task...');
  const testTask = new Task({
    description: 'Say hello and confirm the system is working',
    agent: testAgent,
    expectedOutput: 'A simple greeting confirming the system works'
  });
  
  console.log('✅ Task created successfully');
  
  console.log('Step 6: Creating a simple team...');
  const testTeam = new Team({
    name: 'Test Team',
    agents: [testAgent],
    tasks: [testTask],
    env: {
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY
    }
  });
  
  console.log('✅ Team created successfully');
  
  console.log('Step 7: Starting team...');
  const result = await testTeam.start();
  console.log('✅ Team completed successfully!');
  console.log('Result:', result);
  
} catch (error) {
  console.error('❌ Error occurred:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}