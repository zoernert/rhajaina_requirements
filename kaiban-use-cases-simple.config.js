// Simplified use case generation with smaller, focused tasks
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// ...existing code for setup...

async function main() {
  try {
    const { Agent, Team, Task } = await import('kaibanjs');
    
    // ...existing setup code...

    // Simplified tasks - focus on one category at a time
    const simpleTasks = [
      // Just authentication use cases
      new Task({
        description: `
        Generate AUTHENTICATION AND ONBOARDING USE CASES ONLY.
        
        Create 5-7 detailed use cases covering:
        - User registration
        - Login/logout
        - Password reset
        - Profile setup
        - Initial configuration
        
        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_auth_use_cases", "title": "Rhajaina Authentication Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Authentication use cases document saved'
      }),
      
      // Just core chat functionality
      new Task({
        description: `
        Generate CORE CHAT FUNCTIONALITY USE CASES ONLY.
        
        Create 8-10 detailed use cases covering:
        - Starting conversations
        - Sending messages
        - Chat history
        - Message search
        - Session management
        
        MANDATORY ACTION:
        You MUST call: documentationGenerator({"content": "your_chat_use_cases", "title": "Rhajaina Core Chat Use Cases", "type": "use-cases", "format": "markdown"})
        `,
        agent: useCaseAnalyst,
        expectedOutput: 'Core chat use cases document saved'
      })
      // Add more simplified tasks as needed
    ];

    // Execute simplified tasks
    for (let i = 0; i < simpleTasks.length; i++) {
      // ...existing execution code...
    }

  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
