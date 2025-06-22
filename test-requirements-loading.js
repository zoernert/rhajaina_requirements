import fs from 'fs/promises';
import path from 'path';

async function testRequirementsLoading() {
  console.log('🧪 Testing requirements loading...');
  
  const docsDir = './docs/requirements';
  const requirements = {};
  
  // Function to recursively read markdown files from subdirectories
  async function readMarkdownFiles(dir, prefix = '') {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        console.log(`📁 Scanning directory: ${fullPath}`);
        await readMarkdownFiles(fullPath, `${prefix}${item.name}_`);
      } else if (item.isFile() && item.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf8');
        const key = `${prefix}${path.basename(item.name, '.md')}`;
        requirements[key] = content;
        console.log(`📄 Loaded: ${fullPath} (${content.length} chars) as key: ${key}`);
      }
    }
  }
  
  try {
    await readMarkdownFiles(docsDir);
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Loaded ${Object.keys(requirements).length} requirement documents`);
    console.log(`📋 Requirement keys: ${Object.keys(requirements).join(', ')}`);
    
    const totalSize = Object.values(requirements).reduce((sum, content) => sum + content.length, 0);
    console.log(`📊 Total content: ${totalSize} characters`);
    
    // Show first 200 chars of each document
    console.log(`\n📝 Content preview:`);
    Object.entries(requirements).forEach(([key, content]) => {
      console.log(`${key}: ${content.substring(0, 200)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRequirementsLoading().catch(console.error);
