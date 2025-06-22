import fs from 'fs/promises';
import path from 'path';

async function testDocsStructure() {
  console.log('🔍 Testing docs folder structure...');
  
  const pathsToCheck = [
    './docs',
    './docs/requirements',
    './docs/requirements/core',
    './docs/requirements/technical',
    './docs/requirements/features'
  ];
  
  for (const testPath of pathsToCheck) {
    try {
      const stats = await fs.stat(testPath);
      if (stats.isDirectory()) {
        console.log(`✅ Found directory: ${testPath}`);
        const files = await fs.readdir(testPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        console.log(`   📄 Markdown files: ${mdFiles.length > 0 ? mdFiles.join(', ') : 'None'}`);
      }
    } catch (error) {
      console.log(`❌ Not found: ${testPath}`);
    }
  }
  
  // Try to recursively scan from docs
  try {
    console.log('\n🔍 Recursive scan of ./docs:');
    await scanRecursively('./docs');
  } catch (error) {
    console.log('❌ Could not scan ./docs:', error.message);
  }
}

async function scanRecursively(dir, depth = 0) {
  const indent = '  '.repeat(depth);
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        console.log(`${indent}📁 ${item.name}/`);
        if (depth < 3) { // Limit recursion depth
          await scanRecursively(fullPath, depth + 1);
        }
      } else if (item.name.endsWith('.md')) {
        console.log(`${indent}📄 ${item.name}`);
      }
    }
  } catch (error) {
    console.log(`${indent}❌ Error reading ${dir}: ${error.message}`);
  }
}

testDocsStructure().catch(console.error);
