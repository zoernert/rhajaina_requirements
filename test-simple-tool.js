import dotenv from 'dotenv';
dotenv.config();

async function testSimpleTool() {
  console.log('🧪 Testing documentation generator tool...');
  
  try {
    const toolModule = await import('./tools/documentation-generator.js');
    const documentationGenerator = toolModule.documentationGeneratorTool || toolModule.default;
    
    console.log('✅ Tool imported successfully');
    console.log('🔧 Tool type:', typeof documentationGenerator);
    console.log('🔧 Has invoke method:', typeof documentationGenerator.invoke === 'function');
    
    // Test with simple content
    const testResult = await documentationGenerator.invoke({
      content: `# Test Use Cases

## UC-001: Test Case
**Actor:** Test User
**Goal:** Test the system
**Steps:**
1. User performs action
2. System responds
3. Result is verified`,
      title: "Test Use Cases",
      type: "use-cases",
      format: "markdown"
    });
    
    console.log('✅ Tool test result:', testResult);
    
    if (testResult.success) {
      console.log('🎉 Tool is working correctly!');
    } else {
      console.error('❌ Tool test failed:', testResult.message);
    }
    
  } catch (error) {
    console.error('❌ Tool test error:', error);
  }
}

testSimpleTool().catch(console.error);
