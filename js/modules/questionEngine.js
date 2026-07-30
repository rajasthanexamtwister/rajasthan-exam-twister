/* =============================================
   BCI Quiz — Question Engine & Mode Generators
   Normalizes rich schema, generates mock tests,
   weak topic quizzes, flashcards, & one-liners.
   ============================================= */

const QuestionEngine = {
  // Normalize question objects into unified structure
  normalizeQuestion(q) {
    if (!q) return null;
    const normalized = { ...q };

    // 0. Handle option key variations
    if (!normalized.options && normalized['options ']) {
      normalized.options = normalized['options '];
    }

    // 1. Standardize options text & prefixes
    if (Array.isArray(normalized.options)) {
      normalized.options = normalized.options.map((opt, optIdx) => {
        let textVal = (typeof opt === 'object' && opt !== null) ? (opt.text || opt.option || '') : String(opt);
        textVal = textVal.trim();

        // Standardize (a), (b), (c), (d) prefixes
        const prefix = ['(a) ', '(b) ', '(c) ', '(d) '][optIdx] || '';
        const hasPrefix = /^\([a-dA-D]\)/.test(textVal) || /^[a-dA-D]\./.test(textVal);
        if (!hasPrefix && prefix) {
          textVal = prefix + textVal;
        }
        return textVal;
      });

      // Add Option E dynamically if standard 4 options
      const hasE = normalized.options.some(opt => /^\(e\)/i.test(opt));
      if (!hasE && normalized.options.length === 4) {
        normalized.options.push("(e) अनुत्तरित प्रश्न / Not Attempted (Option E)");
      }
    } else {
      normalized.options = [];
    }

    // 2. Standardize Question Text (Merge English and Hindi if available)
    if (!normalized.question) {
      let en = normalized.question_english || normalized.question_en || '';
      let hi = normalized.question_hindi || normalized.question_hi || '';
      if (en && hi) {
        normalized.question = `${en}\n\n${hi}`;
      } else {
        normalized.question = en || hi || '';
      }
    }

    // 3. Standardize Answer Match
    let ans = normalized.answer || normalized.correct_answer || normalized.correct_value;
    if (ans && normalized.options.length > 0) {
      ans = String(ans).trim();
      const match = ans.match(/^\(([a-dA-D])\)$/) || ans.match(/^[a-dA-D]$/);
      if (match) {
        const label = (match[1] || match[0]).toLowerCase();
        const labelIndex = label.charCodeAt(0) - 97;

        let foundOpt = normalized.options.find(opt => {
          const clean = opt.trim().toLowerCase();
          return clean.startsWith(`(${label})`) || clean.startsWith(`${label}.`);
        });

        if (!foundOpt && labelIndex >= 0 && labelIndex < normalized.options.length) {
          foundOpt = normalized.options[labelIndex];
        }

        if (foundOpt) ans = foundOpt;
      }
    }
    normalized.answer = ans;

    // 4. Default metadata fallbacks
    normalized.difficulty = normalized.difficulty || 'Medium';
    normalized.trap_point = normalized.trap_point || null;
    normalized.memory_trick = normalized.memory_trick || null;
    normalized.one_line_fact = normalized.one_line_fact || null;
    normalized.explanation = normalized.explanation || 'Refer to handbook notes for detailed breakdown.';

    return normalized;
  },

  // Shuffle array utility
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // 1. Generate Full Syllabus Mock Test
  generateMockTest(allLoadedTopics, totalCount = 100) {
    let pool = [];
    allLoadedTopics.forEach(t => {
      if (Array.isArray(t.questions)) {
        pool.push(...t.questions);
      }
    });

    pool = this.shuffle(pool);
    return pool.slice(0, Math.min(totalCount, pool.length));
  },

  // 2. Generate Weak Topic Quiz (Accuracy < 65%)
  generateWeakTopicQuiz(allLoadedTopics, stats) {
    const topicStats = stats.topicStats || {};
    const weakTopicNames = Object.keys(topicStats).filter(name => {
      const ts = topicStats[name];
      if (!ts || ts.total < 3) return false;
      const accuracy = (ts.correct / ts.total) * 100;
      return accuracy < 65;
    });

    let pool = [];
    allLoadedTopics.forEach(t => {
      const isWeak = weakTopicNames.some(wt => (t.topic?.name || '').toLowerCase().includes(wt.toLowerCase()));
      if (isWeak || weakTopicNames.length === 0) {
        pool.push(...t.questions);
      }
    });

    if (pool.length === 0) {
      // Fallback if no weak topics detected yet
      allLoadedTopics.forEach(t => pool.push(...t.questions));
    }

    return this.shuffle(pool).slice(0, 30);
  },

  // 3. Generate Mistake Notebook Quiz
  generateMistakeQuiz(stats) {
    const wrongQs = stats.wrongQuestions || [];
    return wrongQs.map(q => this.normalizeQuestion(q));
  },

  // 4. Generate Bookmarked Quiz
  generateBookmarkedQuiz(allLoadedTopics, stats) {
    const bIds = new Set(stats.bookmarkedIds || []);
    let pool = [];

    allLoadedTopics.forEach(t => {
      t.questions.forEach(q => {
        const qId = q.id || q.question;
        if (bIds.has(qId)) {
          pool.push(q);
        }
      });
    });

    return pool;
  },

  // 5. Generate Flashcards (Questions with memory tricks & trap points prioritized)
  generateFlashcards(allLoadedTopics) {
    let pool = [];
    allLoadedTopics.forEach(t => {
      t.questions.forEach(q => {
        if (q.memory_trick || q.trap_point || q.one_line_fact) {
          pool.push(q);
        }
      });
    });

    if (pool.length < 20) {
      allLoadedTopics.forEach(t => pool.push(...t.questions));
    }

    return this.shuffle(pool);
  },

  // 6. Generate One-Liner Feed
  generateOneLiners(allLoadedTopics) {
    let facts = [];
    allLoadedTopics.forEach(t => {
      t.questions.forEach(q => {
        if (q.one_line_fact) {
          facts.push({
            fact: q.one_line_fact,
            topic: q.topic || t.topic?.name || 'General',
            id: q.id
          });
        } else if (q.question && q.answer) {
          facts.push({
            fact: `${q.question.substring(0, 100)}... ➔ Answer: ${q.answer}`,
            topic: q.topic || t.topic?.name || 'General',
            id: q.id
          });
        }
      });
    });
    return this.shuffle(facts);
  }
};

window.QuestionEngine = QuestionEngine;
