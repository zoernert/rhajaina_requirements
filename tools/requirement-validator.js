import { Tool } from "@langchain/core/tools";
import { z } from "zod";

export class RequirementValidator extends Tool {
  name = 'requirement-validator';
  description = 'Validates requirements for completeness, consistency, and feasibility. Input should be a JSON string with: {"requirement": "text", "context": "optional context", "relatedRequirements": ["optional array"]}';
  
  schema = z.object({
    input: z.string().optional().describe("JSON string containing requirement, context, and relatedRequirements")
  }).transform((data) => data.input);
  
  async _call(input) {
    try {
      if (!input) {
        return JSON.stringify({
          error: 'No input provided. Expected JSON string with requirement field.'
        });
      }
      
      const params = JSON.parse(input);
      const { requirement, context, relatedRequirements } = params;
      
      if (!requirement) {
        return JSON.stringify({
          error: 'Missing required field: requirement'
        });
      }
      
      // Validation criteria
      const validationResults = {
        completeness: this.checkCompleteness(requirement),
        clarity: this.checkClarity(requirement),
        testability: this.checkTestability(requirement),
        feasibility: this.checkFeasibility(requirement, context),
        conflicts: this.checkConflicts(requirement, relatedRequirements),
        dependencies: this.identifyDependencies(requirement, relatedRequirements)
      };
      
      const score = this.calculateScore(validationResults);
      const recommendations = this.generateRecommendations(validationResults);
      
      return JSON.stringify({
        score,
        validationResults,
        recommendations,
        approved: score >= 0.8
      });
    } catch (error) {
      return JSON.stringify({
        error: 'Invalid input format. Expected JSON with requirement, context, and relatedRequirements fields.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  checkCompleteness(requirement) {
    // Check if requirement has who, what, why, when, where
    const completenessFactors = [
      /who|user|actor|role/.test(requirement.toLowerCase()),
      /what|action|feature|functionality/.test(requirement.toLowerCase()),
      /why|because|so that|in order to/.test(requirement.toLowerCase()),
      /when|trigger|condition/.test(requirement.toLowerCase()) || true, // Optional
      requirement.length > 50 // Sufficient detail
    ];
    
    return completenessFactors.filter(Boolean).length / completenessFactors.length;
  }
  
  checkClarity(requirement) {
    // Check for ambiguous words and clear language
    const ambiguousWords = ['simple', 'easy', 'fast', 'good', 'nice', 'flexible'];
    const ambiguityCount = ambiguousWords.filter(word => 
      requirement.toLowerCase().includes(word)
    ).length;
    
    return Math.max(0, 1 - (ambiguityCount * 0.2));
  }
  
  checkTestability(requirement) {
    // Check if requirement can be tested
    const testableIndicators = [
      /should|must|will|shall/.test(requirement.toLowerCase()),
      /\d+/.test(requirement), // Contains numbers/metrics
      /verify|test|measure|check/.test(requirement.toLowerCase()),
      !/subjective|feeling|nice|good/.test(requirement.toLowerCase())
    ];
    
    return testableIndicators.filter(Boolean).length / testableIndicators.length;
  }
  
  checkFeasibility(requirement, context) {
    // Basic feasibility check - would need more sophisticated analysis
    const complexityIndicators = [
      /real-time|instantaneous|immediate/.test(requirement.toLowerCase()),
      /unlimited|infinite|any/.test(requirement.toLowerCase()),
      /100%|perfect|never fail/.test(requirement.toLowerCase())
    ];
    
    const infeasibilityScore = complexityIndicators.filter(Boolean).length;
    return Math.max(0.3, 1 - (infeasibilityScore * 0.3));
  }
  
  checkConflicts(requirement, related) {
    if (!related) return [];
    
    // Simple conflict detection - would need more sophisticated analysis
    const conflicts = [];
    const reqLower = requirement.toLowerCase();
    
    related.forEach((rel, index) => {
      const relLower = rel.toLowerCase();
      
      // Check for obvious conflicts
      if (reqLower.includes('synchronous') && relLower.includes('asynchronous')) {
        conflicts.push(`Conflict with requirement ${index + 1}: sync vs async`);
      }
      if (reqLower.includes('real-time') && relLower.includes('batch')) {
        conflicts.push(`Conflict with requirement ${index + 1}: real-time vs batch`);
      }
    });
    
    return conflicts;
  }
  
  identifyDependencies(requirement, related) {
    if (!related) return [];
    
    const dependencies = [];
    const reqLower = requirement.toLowerCase();
    
    // Simple dependency detection
    if (reqLower.includes('chat') && related.some(r => r.toLowerCase().includes('user authentication'))) {
      dependencies.push('User authentication system');
    }
    if (reqLower.includes('semantic search') && related.some(r => r.toLowerCase().includes('vector'))) {
      dependencies.push('Vector database setup');
    }
    
    return dependencies;
  }
  
  calculateScore(results) {
    const weights = {
      completeness: 0.3,
      clarity: 0.2,
      testability: 0.2,
      feasibility: 0.3
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (results[key] * weight);
    }, 0);
  }
  
  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.completeness < 0.8) {
      recommendations.push('Add more detail about who, what, and why');
    }
    if (results.clarity < 0.8) {
      recommendations.push('Remove ambiguous terms and be more specific');
    }
    if (results.testability < 0.8) {
      recommendations.push('Add measurable criteria and acceptance conditions');
    }
    if (results.feasibility < 0.8) {
      recommendations.push('Consider technical constraints and realistic expectations');
    }
    if (results.conflicts.length > 0) {
      recommendations.push('Resolve conflicts with related requirements');
    }
    
    return recommendations;
  }
}

// Export an instance for easy use
export const requirementValidator = new RequirementValidator();