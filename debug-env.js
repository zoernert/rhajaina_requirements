import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== Environment Variables Debug ===');
console.log('GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY);
console.log('MISTRAL_API_KEY exists:', !!process.env.MISTRAL_API_KEY);
console.log('DEEPSEEK_API_KEY exists:', !!process.env.DEEPSEEK_API_KEY);
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Show first few characters to confirm they're loaded (without exposing full keys)
if (process.env.GOOGLE_AI_API_KEY) {
  console.log('GOOGLE_AI_API_KEY starts with:', process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...');
}
if (process.env.MISTRAL_API_KEY) {
  console.log('MISTRAL_API_KEY starts with:', process.env.MISTRAL_API_KEY.substring(0, 10) + '...');
}
if (process.env.DEEPSEEK_API_KEY) {
  console.log('DEEPSEEK_API_KEY starts with:', process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...');
}

console.log('=== Current working directory ===');
console.log(process.cwd());

console.log('=== .env file check ===');
import { existsSync } from 'fs';
console.log('.env file exists:', existsSync('.env'));
console.log('.env file in current dir:', existsSync(process.cwd() + '/.env'));