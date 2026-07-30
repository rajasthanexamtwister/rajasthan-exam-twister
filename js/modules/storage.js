/* =============================================
   BCI Quiz — Storage Engine & Progress Manager
   Handles LocalStorage, Mistakes, Bookmarks,
   Study Heatmap History, & Import/Export Backup
   ============================================= */

const STORAGE_KEY = 'bci_stats_v2';

const StorageEngine = {
  getStats() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure standard defaults exist
        parsed.topicStats = parsed.topicStats || {};
        parsed.wrongQuestions = parsed.wrongQuestions || [];
        parsed.bookmarkedIds = parsed.bookmarkedIds || [];
        parsed.attemptHistory = parsed.attemptHistory || [];
        parsed.dailyActivity = parsed.dailyActivity || {};
        return parsed;
      } catch (e) {
        console.error('Error parsing stats, resetting to clean state', e);
      }
    }

    // Default Stats Schema
    return {
      totalTests: 0,
      totalQs: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalScore: 0,
      totalTimeSeconds: 0,
      topicStats: {},       // { topicName: { correct, wrong, total, timeSpent } }
      wrongQuestions: [],   // [ { question, selectedAnswer, timestamp, topic } ]
      bookmarkedIds: [],    // [ questionId ]
      attemptHistory: [],   // [ { questionId, isCorrect, timeSpent, timestamp } ]
      dailyActivity: {},    // { "YYYY-MM-DD": count }
    };
  },

  saveStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  },

  recordQuestionAttempt(question, selectedOption, isCorrect, timeSpentSec = 0) {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];

    stats.totalQs += 1;
    stats.totalTimeSeconds += timeSpentSec;

    if (isCorrect) {
      stats.totalCorrect += 1;
      stats.totalScore += 1;
    } else {
      stats.totalWrong += 1;
      stats.totalScore -= 0.33; // Standard RSMSSB negative marking
    }

    // Update Daily Activity Heatmap
    stats.dailyActivity[today] = (stats.dailyActivity[today] || 0) + 1;

    // Update Topic Level Stats
    const topicName = question.topic || 'General';
    if (!stats.topicStats[topicName]) {
      stats.topicStats[topicName] = { correct: 0, wrong: 0, total: 0, timeSpent: 0 };
    }
    stats.topicStats[topicName].total += 1;
    stats.topicStats[topicName].timeSpent += timeSpentSec;
    if (isCorrect) {
      stats.topicStats[topicName].correct += 1;
    } else {
      stats.topicStats[topicName].wrong += 1;
    }

    // Record Mistakes Notebook entry
    if (!isCorrect) {
      const existingIdx = stats.wrongQuestions.findIndex(q => q.id === question.id || q.question === question.question);
      const wrongEntry = {
        ...question,
        userSelectedAnswer: selectedOption,
        lastAttemptDate: new Date().toLocaleDateString(),
        mistakeCount: existingIdx >= 0 ? (stats.wrongQuestions[existingIdx].mistakeCount || 1) + 1 : 1
      };

      if (existingIdx >= 0) {
        stats.wrongQuestions[existingIdx] = wrongEntry;
      } else {
        stats.wrongQuestions.push(wrongEntry);
      }
    } else {
      // Remove from wrong questions if successfully answered
      stats.wrongQuestions = stats.wrongQuestions.filter(q => q.id !== question.id && q.question !== question.question);
    }

    // Log to Attempt History
    stats.attemptHistory.push({
      id: question.id || question.question?.substring(0, 20),
      topic: topicName,
      isCorrect: isCorrect,
      timeSpentSec: timeSpentSec,
      timestamp: Date.now()
    });

    // Keep history clean (max 500 items)
    if (stats.attemptHistory.length > 500) {
      stats.attemptHistory.shift();
    }

    this.saveStats(stats);
  },

  recordTestCompleted() {
    const stats = this.getStats();
    stats.totalTests += 1;
    this.saveStats(stats);
  },

  // Bookmark Management
  toggleBookmark(question) {
    const stats = this.getStats();
    const qId = question.id || question.question;
    const index = stats.bookmarkedIds.indexOf(qId);
    let isBookmarked = false;

    if (index >= 0) {
      stats.bookmarkedIds.splice(index, 1);
      isBookmarked = false;
    } else {
      stats.bookmarkedIds.push(qId);
      isBookmarked = true;
    }

    this.saveStats(stats);
    return isBookmarked;
  },

  isBookmarked(question) {
    const stats = this.getStats();
    const qId = question.id || question.question;
    return stats.bookmarkedIds.includes(qId);
  },

  // Import / Export Progress Backup
  exportProgressJSON() {
    const stats = this.getStats();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bci_exam_prep_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importProgressJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object' && parsed.totalQs !== undefined) {
        this.saveStats(parsed);
        return { success: true, message: 'Progress successfully restored!' };
      } else {
        return { success: false, message: 'Invalid backup file format.' };
      }
    } catch (e) {
      return { success: false, message: 'Error reading JSON backup file.' };
    }
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

window.StorageEngine = StorageEngine;
