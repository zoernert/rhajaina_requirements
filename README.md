# Rhajaina Requirements Management System

A KaibanJS-powered multi-agent system for systematically analyzing, validating, and managing requirements for the Rhajaina AI Chat Application.

## 🎯 Purpose

This project was created to avoid the complexity issues that led to restarting the previous chat application implementation. It uses AI agents to:

- **Systematically analyze requirements** before implementation
- **Prevent requirement drift** and scope creep
- **Create living documentation** that evolves with the project
- **Ensure architectural consistency** across development phases

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- AI API Keys (Google Gemini, Mistral, DeepSeek)

### Installation

```bash
# Clone the repository
git clone https://github.com/zoernert/rhajaina_requirements.git
cd rhajaina_requirements

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your actual API keys
```

### Configuration

Add your API keys to `.env`:
```env
# Primary LLM API Keys
GOOGLE_AI_API_KEY=your-google-gemini-api-key
MISTRAL_API_KEY=your-mistral-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key

# Optional: Additional providers
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## 🎮 Usage

### Option 1: Visual Workflow (Recommended)
```bash
# Launch the KaibanJS visual board
npm run board

# Opens in browser - watch agents work in real-time
# Like Trello/Jira but for AI agents
```

### Option 2: Command Line
```bash
# Run specific workflows
npm run requirements    # Requirements analysis
npm run architecture   # Architecture design  
npm run docs           # Documentation generation

# Development mode
npm run dev
```

## 🤖 AI Agent Team

The system employs 4 specialized AI agents:

### 📋 Requirements Analyst (Gemini 2.0 Flash)
- **Role**: Validates and refines requirements
- **Tools**: Requirement Validator, Documentation Generator
- **Output**: Validated user stories with acceptance criteria, priorities, and risk assessments

### 🏗️ Solution Architect (Mistral Large)
- **Role**: Designs scalable architecture for Rhajaina
- **Tools**: Documentation Generator
- **Output**: Service decomposition, technology recommendations, deployment strategies

### 📝 Technical Writer (DeepSeek Coder)
- **Role**: Creates comprehensive technical documentation
- **Tools**: Documentation Generator  
- **Output**: API docs, implementation guides, architecture diagrams

### 📊 Project Manager (Gemini 2.0 Flash)
- **Role**: Coordinates priorities and manages project timeline
- **Tools**: Documentation Generator
- **Output**: Project plans, priority matrices, risk mitigation strategies

## 📁 Project Structure

```
rhajaina_requirements/
├── src/
│   ├── agents/           # AI agent definitions
│   ├── tools/            # Custom tools (validation, documentation)
│   ├── workflows/        # Multi-agent workflows
│   └── main.ts          # Main orchestration
├── outputs/             # Generated documentation
│   ├── requirements-documents/
│   ├── architecture-diagrams/
│   └── implementation-specs/
├── .env                 # API keys (not in git)
└── package.json
```

## 📤 Outputs

The system generates comprehensive documentation in `outputs/`:

### Requirements Documents
- Validated user stories with acceptance criteria
- Priority matrix (P0-P3) and complexity estimates
- Risk assessments and mitigation strategies
- Dependency mapping between requirements

### Architecture Specifications  
- Microservice boundaries and responsibilities
- Technology stack recommendations (Moleculer, Mastra, Qdrant, etc.)
- Integration strategies for existing infrastructure
- Deployment and scaling considerations

### Implementation Guides
- Development setup instructions
- API specifications and contracts
- Quality gates and testing strategies
- Monitoring and observability plans

## 🔄 Workflow Process

1. **Input**: Define requirements for Rhajaina AI Chat Application
2. **Analysis**: Requirements Analyst validates each requirement systematically
3. **Architecture**: Solution Architect designs scalable system architecture  
4. **Documentation**: Technical Writer creates comprehensive specifications
5. **Planning**: Project Manager coordinates timeline and priorities
6. **Output**: Ready-to-implement specifications with validated requirements

## 🛠️ Technologies

- **Framework**: [KaibanJS](https://kaibanjs.com) - JavaScript-native multi-agent system
- **AI Models**: 
  - Google Gemini 2.0 Flash (requirements, project management)
  - Mistral Large (architecture design)
  - DeepSeek Coder (technical documentation)
- **Tools**: LangChain, TypeScript, Zod validation
- **Infrastructure**: Designed for Redis, NATS, Qdrant, MongoDB, n8n integration

## 🎯 Next Steps

### Phase 1: Requirements Analysis (Current)
- [x] Set up multi-agent requirements analysis system
- [x] Create specialized AI agents for different roles
- [x] Implement requirement validation and documentation tools
- [ ] Run initial requirements analysis for Rhajaina
- [ ] Review and refine generated requirements

### Phase 2: Implementation Planning  
- [ ] Use validated requirements for Moleculer + Mastra implementation
- [ ] Set up development environment based on architecture specifications
- [ ] Create implementation roadmap from generated project plans
- [ ] Begin Rhajaina development with solid foundation

### Phase 3: Iterative Refinement
- [ ] Use system for ongoing requirement changes
- [ ] Maintain living documentation as project evolves
- [ ] Prevent complexity drift with systematic analysis

## 🤝 Contributing

This is a systematic approach to managing AI project requirements. The methodology can be adapted for other complex AI projects facing requirement drift and complexity issues.

## 📄 License

ISC

---

**Built with ❤️ for systematic AI project management**

*Preventing the complexity issues that derail AI projects through systematic requirements analysis and living documentation.*