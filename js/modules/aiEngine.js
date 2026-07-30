/* =============================================
   BCI Quiz — Client-Side AI Educator Engine
   Diagnostic error analysis, misconception traps,
   memory tricks & mnemonics synthesizer.
   ============================================= */

const AIEngine = {
  // Analyze a wrong attempt and categorize the error
  analyzeMistake(question, selectedOption, timeSpentSec = 0) {
    if (!question || !selectedOption) return null;

    let category = 'Conceptual Error';
    let suggestion = 'Review fundamental rules and theory in revision handbooks.';

    // 1. Check if user fell into a known Trap Point
    if (question.trap_point) {
      category = 'Exam Trap Point';
      suggestion = `⚠️ AI Diagnostic: You fell for a standard exam trap: "${question.trap_point}"`;
    } 
    // 2. Speed Trap: Answered in < 5 seconds
    else if (timeSpentSec > 0 && timeSpentSec < 6) {
      category = 'Careless / Speed Trap';
      suggestion = '⏱️ AI Diagnostic: Answered too quickly (< 6s). Read all options thoroughly before selecting.';
    } 
    // 3. Option E chosen (Not attempted or confused)
    else if (selectedOption.includes('(e)') || selectedOption.includes('Not Attempted')) {
      category = 'Unattempted / Uncertainty';
      suggestion = '💡 AI Diagnostic: High uncertainty. Use memory tricks & elimination techniques.';
    } 
    // 4. Overthinking Trap: Took > 60 seconds and still got wrong
    else if (timeSpentSec > 60) {
      category = 'Overthinking / Time Drain';
      suggestion = '⏳ AI Diagnostic: Took over 60 seconds. Skip and mark for review in early exam passes.';
    }

    return {
      category,
      suggestion,
      trapPoint: question.trap_point || 'None reported',
      memoryTrick: question.memory_trick || 'Create a quick 3-word acronym to remember this fact.'
    };
  },

  // Extract or synthesize memory tricks
  getMemoryTrick(question) {
    if (question.memory_trick) {
      return `🧠 Mnemonic: ${question.memory_trick}`;
    }
    if (question.one_line_fact) {
      return `💡 Quick Fact: ${question.one_line_fact}`;
    }
    return `📌 Rule: Focus on core keyword matching between question and option.`;
  },

  // Generate personalized study recommendations based on performance
  generatePersonalizedPlan(stats) {
    const topicStats = stats.topicStats || {};
    const recommendations = [];

    Object.keys(topicStats).forEach(tName => {
      const ts = topicStats[tName];
      if (ts.total >= 3) {
        const accuracy = (ts.correct / ts.total) * 100;
        if (accuracy < 50) {
          recommendations.push({
            topic: tName,
            priority: 'HIGH',
            accuracy: accuracy.toFixed(1),
            action: 'Read Revision Handbook & solve Mistake Notebook questions immediately.'
          });
        } else if (accuracy < 70) {
          recommendations.push({
            topic: tName,
            priority: 'MEDIUM',
            accuracy: accuracy.toFixed(1),
            action: 'Practice 25 topic-specific questions & review trap points.'
          });
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push({
        topic: 'Full Syllabus',
        priority: 'NORMAL',
        accuracy: 'N/A',
        action: 'Great work! Take a 100-Question Full Syllabus Mock Test to maintain speed.'
      });
    }

    return recommendations.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
  }
};

window.AIEngine = AIEngine;
