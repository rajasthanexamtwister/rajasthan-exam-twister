/* =============================================
   BCI Quiz — Universal Search Engine
   Searches questions, options, explanations,
   trap points, memory tricks, topics, & notes.
   ============================================= */

const SearchEngine = {
  // Query questions array
  searchQuestions(allLoadedTopics, queryStr) {
    if (!queryStr || queryStr.trim().length === 0) return [];
    const q = queryStr.toLowerCase().trim();
    const results = [];

    allLoadedTopics.forEach(t => {
      if (Array.isArray(t.questions)) {
        t.questions.forEach(question => {
          const text = (question.question || '').toLowerCase();
          const expl = (question.explanation || '').toLowerCase();
          const trap = (question.trap_point || '').toLowerCase();
          const trick = (question.memory_trick || '').toLowerCase();
          const topic = (question.topic || t.topic?.name || '').toLowerCase();
          const optionsText = Array.isArray(question.options) ? question.options.join(' ').toLowerCase() : '';

          if (text.includes(q) || expl.includes(q) || trap.includes(q) || trick.includes(q) || topic.includes(q) || optionsText.includes(q)) {
            results.push({
              question,
              matchField: text.includes(q) ? 'Question' : (expl.includes(q) ? 'Explanation' : (trap.includes(q) ? 'Trap Point' : 'Topic')),
              topicName: question.topic || t.topic?.name || 'General'
            });
          }
        });
      }
    });

    return results;
  },

  // Perform search UI filter
  executeUniversalSearch(queryStr, allLoadedTopics, resultsContainerId) {
    const container = document.getElementById(resultsContainerId);
    if (!container) return;

    const matches = this.searchQuestions(allLoadedTopics, queryStr);
    container.innerHTML = '';

    if (matches.length === 0) {
      container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:14px;">
        🔍 No matching questions or topics found for "<strong>${queryStr}</strong>".
      </div>`;
      return;
    }

    const titleEl = document.createElement('div');
    titleEl.style.fontSize = '14px';
    titleEl.style.fontWeight = '700';
    titleEl.style.marginBottom = '12px';
    titleEl.style.color = 'var(--saffron)';
    titleEl.textContent = `Found ${matches.length} matching result(s):`;
    container.appendChild(titleEl);

    matches.slice(0, 30).forEach(({ question, matchField, topicName }) => {
      const item = document.createElement('div');
      item.className = 'search-result-card';
      item.style.background = 'var(--surface)';
      item.style.border = '1px solid var(--border)';
      item.style.borderRadius = 'var(--radius)';
      item.style.padding = '14px';
      item.style.marginBottom = '10px';
      item.style.boxShadow = 'var(--shadow)';

      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span class="badge" style="font-size:11px; background:var(--saffron); color:#fff; padding:2px 8px; border-radius:12px;">${topicName}</span>
          <span style="font-size:11px; color:var(--text-muted);">Match in ${matchField}</span>
        </div>
        <div style="font-weight:600; font-size:14px; margin-bottom:8px; line-height:1.4;">${question.question}</div>
        ${question.explanation ? `<div style="font-size:12px; color:var(--text-muted); line-height:1.4;">💡 ${question.explanation.substring(0, 120)}...</div>` : ''}
      `;
      container.appendChild(item);
    });
  }
};

window.SearchEngine = SearchEngine;
