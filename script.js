/* =============================================
   BCI Quiz — RSMSSB Prep
   Complete Quiz Engine
   ============================================= */

// ============ TOPIC CONFIG ============
// Add your JSON filenames here when you add new topics
const TOPIC_FILES = [
  { file: 'DBMS_overview of database management.json', name: 'DBMS Overview',        icon: '📖' },
  { file: 'DBMS_architecture of database system .json',name: 'DBMS Architecture',    icon: '🏛️' },
  { file: 'DBMS_database design.json',                name: 'Database Design',      icon: '📐' },
  { file: 'DBMS_MCQ important.json',                 name: 'DBMS Important MCQs',  icon: '⭐' },
  { file: 'computer.json',          name: 'Computer',          icon: '💻' },
  { file: 'rajasthan_history.json', name: 'Rajasthan History', icon: '🏰' },
  { file: 'geography.json',         name: 'Geography',         icon: '🗺️' },
  { file: 'culture.json',           name: 'Culture',           icon: '🎭' },
  { file: 'other_topics.json',      name: 'Other Topics',      icon: '📖' },
];

// Helper to normalize question fields from different JSON formats
function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  questions.forEach(q => {
    // 0. Normalize option key trailing spaces if any
    if (!q.options && q['options ']) {
      q.options = q['options '];
    }

    // 1. Standardize question text (merge English and Hindi if available)
    if (!q.question) {
      const en = q.question_english || q.question_en || '';
      const hi = q.question_hindi || q.question_hi || '';
      if (en && hi) {
        q.question = `${en}\n[${hi}]`;
      } else {
        q.question = en || hi || '';
      }
    }

    // 2. Standardize answers
    let ans = q.answer || q.correct_answer;
    if (ans && q.options) {
      ans = ans.trim();
      // Match (a) or just a
      const match = ans.match(/^\(([a-dAD])\)$/) || ans.match(/^[a-dAD]$/);
      if (match) {
        const label = (match[1] || match[0]).toLowerCase(); // 'a', 'b', 'c', or 'd'
        const labelIndex = label.charCodeAt(0) - 97; // 0, 1, 2, 3
        
        // Try to find the full option string that starts with "(a)" or "a." or "a "
        let foundOpt = q.options.find(opt => {
          const cleanOpt = opt.trim().toLowerCase();
          return cleanOpt.startsWith(`(${label})`) || cleanOpt.startsWith(`${label}.`) || cleanOpt.startsWith(`${label} `);
        });
        
        // Fallback to index if not found by prefix
        if (!foundOpt && labelIndex >= 0 && labelIndex < q.options.length) {
          foundOpt = q.options[labelIndex];
        }
        
        if (foundOpt) {
          ans = foundOpt;
        }
      }
    }
    q.answer = ans;

    // 3. Standardize importance (boolean)
    if (q.important === undefined && q.importance) {
      q.important = (q.importance === 'Important' || q.importance === 'Very Important');
    }
  });
  return questions;
}

// ============ STATE ============
let state = {
  // Topic
  selectedTopic: null,
  selectedFile: null,
  allQuestions: [],

  // Config
  qCount: 25,
  order: 'random',
  timerMode: 'none',
  timerMinutes: 0,
  mode: 'practice',

  // Active quiz
  questions: [],
  currentIndex: 0,
  answers: {},          // { qIndex: selectedOption }
  skipped: new Set(),   // qIndex
  bookmarked: new Set(), // question id

  // Timer
  timerInterval: null,
  timerSecondsLeft: 0,
  timerTotal: 0,

  // Result
  lastResult: null,
};

// ============ LOCAL STORAGE ============
function saveStats() {
  const stats = getStats();
  localStorage.setItem('bci_stats', JSON.stringify(stats));
}

function getStats() {
  const raw = localStorage.getItem('bci_stats');
  return raw ? JSON.parse(raw) : {
    totalTests: 0,
    totalQs: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalScore: 0,
    topicStats: {},      // { topicName: { correct, wrong, total } }
    wrongQuestions: [],  // array of question objects
    skippedQuestions: [],
    bookmarkedIds: [],
  };
}

function saveBookmarks() {
  const ids = [...state.bookmarked];
  const cur = getStats();
  cur.bookmarkedIds = ids;
  localStorage.setItem('bci_stats', JSON.stringify(cur));
}

function loadBookmarks() {
  const s = getStats();
  state.bookmarked = new Set(s.bookmarkedIds || []);
}

// ============ SCREEN MANAGEMENT ============
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');

  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    if (b.textContent.toLowerCase().includes(name.substring(0, 4))) b.classList.add('active');
  });

  if (name === 'dashboard') renderDashboard();
  if (name === 'revision')  renderRevisionCounts();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleNav() {
  const n = document.getElementById('mobileNav');
  n.classList.toggle('open');
}

// ============ TOPIC LOADING ============
async function loadTopics() {
  const grid = document.getElementById('topicGrid');
  grid.innerHTML = '';

  for (const topic of TOPIC_FILES) {
    try {
      const res = await fetch(`question-answer/${topic.file}`);
      if (!res.ok) continue;
      let questions = await res.json();
      if (!Array.isArray(questions) || questions.length === 0) continue;
      questions = normalizeQuestions(questions);

      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <div class="topic-icon">${topic.icon}</div>
        <div class="topic-name">${topic.name}</div>
        <div class="topic-count">${questions.length} questions</div>
      `;
      card.onclick = () => selectTopic(topic, questions, card);
      grid.appendChild(card);
    } catch (e) {
      // File doesn't exist or error — skip silently
    }
  }

  if (grid.children.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;color:var(--text-muted);font-size:14px;padding:20px 0">
      No question files found. Add JSON files to the <code>question-answer/</code> folder.
    </div>`;
  }
}

function selectTopic(topic, questions, cardEl) {
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');

  state.selectedTopic = topic.name;
  state.selectedFile = topic.file;
  state.allQuestions = questions;

  document.getElementById('selectedTopicLabel').textContent = `${topic.icon} ${topic.name} (${questions.length} Qs)`;
  document.getElementById('configBox').style.display = 'block';
  document.getElementById('configBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearTopic() {
  state.selectedTopic = null;
  state.allQuestions = [];
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('configBox').style.display = 'none';
}

// ============ CONFIG BUTTONS ============
function initConfigButtons() {
  // Question count
  document.getElementById('qCountOptions').addEventListener('click', e => {
    if (!e.target.classList.contains('cfg-btn')) return;
    setActive('qCountOptions', e.target);
    state.qCount = e.target.dataset.val === 'all' ? 'all' : parseInt(e.target.dataset.val);
  });

  // Order
  document.getElementById('qOrderOptions').addEventListener('click', e => {
    if (!e.target.classList.contains('cfg-btn')) return;
    setActive('qOrderOptions', e.target);
    state.order = e.target.dataset.val;
  });

  // Timer
  document.getElementById('timerOptions').addEventListener('click', e => {
    if (!e.target.classList.contains('cfg-btn')) return;
    setActive('timerOptions', e.target);
    state.timerMode = e.target.dataset.val;
    document.getElementById('customTimerRow').style.display =
      e.target.dataset.val === 'custom' ? 'block' : 'none';
  });

  // Mode
  document.getElementById('modeOptions').addEventListener('click', e => {
    if (!e.target.classList.contains('cfg-btn')) return;
    setActive('modeOptions', e.target);
    state.mode = e.target.dataset.val;
  });
}

function setActive(groupId, btn) {
  document.getElementById(groupId).querySelectorAll('.cfg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ============ START TEST ============
function startTest() {
  if (!state.selectedTopic || state.allQuestions.length === 0) {
    showToast('Please select a topic first');
    return;
  }

  let pool = [...state.allQuestions];

  // Shuffle if random
  if (state.order === 'random') pool = shuffle(pool);

  // Limit count
  if (state.qCount !== 'all') pool = pool.slice(0, Math.min(state.qCount, pool.length));

  state.questions = pool;
  state.currentIndex = 0;
  state.answers = {};
  state.skipped = new Set();

  // Timer setup
  if (state.timerMode !== 'none') {
    let mins = state.timerMode === 'custom'
      ? parseInt(document.getElementById('customMinutes').value) || 30
      : parseInt(state.timerMode);
    state.timerSecondsLeft = mins * 60;
    state.timerTotal = state.timerSecondsLeft;
  }

  loadBookmarks();
  showScreen('quiz');
  renderQuestion();
  buildPalette();

  if (state.timerMode !== 'none') startTimer();
  else document.getElementById('timerBar').style.display = 'none';
}

// ============ QUIZ RENDER ============
function renderQuestion() {
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  const idx = state.currentIndex;

  // Progress
  document.getElementById('progressLabel').textContent = `Q ${idx + 1} / ${total}`;
  document.getElementById('progressFill').style.width = `${((idx + 1) / total) * 100}%`;
  document.getElementById('scoreLive').textContent = `Score: ${calcLiveScore().toFixed(2)}`;

  // Q meta
  document.getElementById('qNumber').textContent = `Q${idx + 1}`;
  const diffEl = document.getElementById('qDifficulty');
  diffEl.textContent = capitalize(q.difficulty || 'medium');
  diffEl.className = `q-difficulty ${q.difficulty || 'medium'}`;
  const impEl = document.getElementById('qImportant');
  impEl.style.display = q.important ? 'inline' : 'none';

  // Question text
  document.getElementById('questionText').textContent = q.question;

  // Options
  const optList = document.getElementById('optionsList');
  optList.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="opt-label">${labels[i]}</span><span class="opt-text">${opt}</span>`;

    const existingAnswer = state.answers[idx];
    if (existingAnswer !== undefined) {
      btn.disabled = true;
      if (opt === q.answer) btn.classList.add('correct');
      else if (opt === existingAnswer) btn.classList.add('wrong');
    } else {
      btn.onclick = () => selectAnswer(opt, btn, q);
    }
    optList.appendChild(btn);
  });

  // Answer reveal
  const reveal = document.getElementById('answerReveal');
  if (state.answers[idx] !== undefined) {
    showReveal(q);
  } else {
    reveal.style.display = 'none';
  }

  // Buttons
  document.getElementById('prevBtn').disabled = idx === 0;
  document.getElementById('nextBtn').disabled = idx === total - 1;
  document.getElementById('skipBtn').style.display =
    state.answers[idx] !== undefined ? 'none' : 'flex';

  updatePaletteHighlight();
}

function selectAnswer(selectedOpt, clickedBtn, q) {
  const idx = state.currentIndex;

  // Disable all options
  const opts = document.querySelectorAll('.option-btn');
  opts.forEach(b => { b.disabled = true; b.onclick = null; });

  // Mark correct / wrong
  opts.forEach(b => {
    const optText = b.querySelector('.opt-text').textContent;
    if (optText === q.answer) b.classList.add('correct');
    else if (b === clickedBtn) b.classList.add('wrong');
  });

  state.answers[idx] = selectedOpt;
  state.skipped.delete(idx);

  if (state.mode !== 'exam') showReveal(q);

  document.getElementById('skipBtn').style.display = 'none';
  document.getElementById('scoreLive').textContent = `Score: ${calcLiveScore().toFixed(2)}`;

  updatePalette(idx, selectedOpt === q.answer ? 'answered' : 'wrong-ans');

  // Automatically navigate to the next question after a 1-second delay
  if (idx < state.questions.length - 1) {
    setTimeout(() => {
      if (state.currentIndex === idx) {
        navigate(1);
      }
    }, 1000);
  }
}

function showReveal(q) {
  document.getElementById('answerReveal').style.display = 'block';
  document.getElementById('revealAnswer').textContent = q.answer;
  document.getElementById('revealExplanation').textContent = q.explanation || '';
}

function skipQuestion() {
  state.skipped.add(state.currentIndex);
  updatePalette(state.currentIndex, 'skipped');
  if (state.currentIndex < state.questions.length - 1) {
    navigate(1);
  }
}

function navigate(dir) {
  const newIdx = state.currentIndex + dir;
  if (newIdx < 0 || newIdx >= state.questions.length) return;
  state.currentIndex = newIdx;
  renderQuestion();
}

// ============ PALETTE ============
function buildPalette() {
  const grid = document.getElementById('paletteGrid');
  grid.innerHTML = '';
  state.questions.forEach((_, i) => {
    const btn = document.createElement('div');
    btn.className = 'palette-num';
    btn.id = `pal-${i}`;
    btn.textContent = i + 1;
    btn.onclick = () => { state.currentIndex = i; renderQuestion(); };
    grid.appendChild(btn);
  });
}

function updatePalette(idx, cls) {
  const btn = document.getElementById(`pal-${idx}`);
  if (!btn) return;
  btn.className = 'palette-num ' + cls;
}

function updatePaletteHighlight() {
  document.querySelectorAll('.palette-num').forEach((btn, i) => {
    btn.classList.remove('current');
    if (i === state.currentIndex) btn.classList.add('current');
  });
}

function togglePalette() {
  const p = document.getElementById('questionPalette');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

// ============ TIMER ============
function startTimer() {
  document.getElementById('timerBar').style.display = 'flex';
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timerSecondsLeft--;
    updateTimerDisplay();
    if (state.timerSecondsLeft <= 0) {
      clearInterval(state.timerInterval);
      showToast('⏱ Time up! Auto-submitting...');
      setTimeout(submitTest, 1500);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const s = state.timerSecondsLeft;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  document.getElementById('timerDisplay').textContent =
    `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

  const pct = state.timerTotal > 0 ? (s / state.timerTotal) * 100 : 100;
  const bar = document.getElementById('timerProgress');
  bar.style.width = `${pct}%`;
  bar.classList.toggle('warning', pct < 20);
}

// ============ SCORE CALC ============
function calcLiveScore() {
  let score = 0;
  Object.keys(state.answers).forEach(idx => {
    const q = state.questions[parseInt(idx)];
    if (state.answers[idx] === q.answer) score += 1;
    else score -= (1/3);
  });
  return score;
}

function calcResult() {
  let correct = 0, wrong = 0, skipped = 0;

  state.questions.forEach((q, idx) => {
    if (state.answers[idx] === undefined || state.skipped.has(idx)) {
      skipped++;
    } else if (state.answers[idx] === q.answer) {
      correct++;
    } else {
      wrong++;
    }
  });

  const total = state.questions.length;
  const attempted = correct + wrong;
  const score = correct - (wrong / 3);
  const maxScore = total;
  const accuracy = attempted > 0 ? (correct / attempted * 100) : 0;
  const pct = (score / maxScore) * 100;
  const pass = pct >= 40;

  return { total, correct, wrong, skipped, attempted, score, accuracy, pct, pass };
}

// ============ SUBMIT ============
function confirmSubmit() {
  const unanswered = state.questions.length -
    Object.keys(state.answers).length;
  document.getElementById('confirmModalBody').innerHTML =
    `Answered: <strong>${Object.keys(state.answers).length}</strong> / ${state.questions.length}<br>
    Unanswered: <strong>${unanswered}</strong><br><br>
    Are you sure you want to submit?`;
  document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
}

function submitTest() {
  closeModal();
  stopTimer();

  const result = calcResult();
  state.lastResult = { ...result, questions: state.questions, answers: { ...state.answers } };

  // Save stats
  const stats = getStats();
  stats.totalTests++;
  stats.totalQs += result.attempted;
  stats.totalCorrect += result.correct;
  stats.totalWrong += result.wrong;
  stats.totalScore += result.score;

  // Topic stats
  if (!stats.topicStats[state.selectedTopic]) {
    stats.topicStats[state.selectedTopic] = { correct: 0, wrong: 0, total: 0 };
  }
  stats.topicStats[state.selectedTopic].correct += result.correct;
  stats.topicStats[state.selectedTopic].wrong += result.wrong;
  stats.topicStats[state.selectedTopic].total += result.attempted;

  // Save wrong questions (avoid duplicates by id)
  const existingIds = new Set(stats.wrongQuestions.map(q => q.id + '_' + q.topic));
  state.questions.forEach((q, idx) => {
    if (state.answers[idx] !== undefined && state.answers[idx] !== q.answer) {
      const key = q.id + '_' + q.topic;
      if (!existingIds.has(key)) {
        stats.wrongQuestions.push(q);
        existingIds.add(key);
      }
    }
    // Save skipped
    if (state.skipped.has(idx)) {
      const key = q.id + '_' + q.topic + '_skipped';
      if (!stats.skippedQuestions.find(sq => sq.id === q.id && sq.topic === q.topic)) {
        stats.skippedQuestions.push(q);
      }
    }
  });

  localStorage.setItem('bci_stats', JSON.stringify(stats));

  // Render result screen
  renderResult(result);
  showScreen('result');
}

// ============ RESULT RENDER ============
function renderResult(r) {
  const emoji = r.pass ? '🎉' : (r.pct >= 30 ? '💪' : '😤');
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultScore').textContent = r.score.toFixed(2);

  const status = document.getElementById('resultStatus');
  status.textContent = r.pass ? `✅ Qualified (${r.pct.toFixed(1)}%)` : `❌ Not Qualified (${r.pct.toFixed(1)}%)`;
  status.className = 'result-status ' + (r.pass ? 'pass' : 'fail');

  document.getElementById('rTotal').textContent = r.total;
  document.getElementById('rCorrect').textContent = r.correct;
  document.getElementById('rWrong').textContent = r.wrong;
  document.getElementById('rSkipped').textContent = r.skipped;
  document.getElementById('rAttempted').textContent = r.attempted;
  document.getElementById('rAccuracy').textContent = r.accuracy.toFixed(1) + '%';
}

// ============ REVIEW ============
function reviewAnswers() {
  renderReviewList('all');
  showScreen('review');
}

function renderReviewList(filter) {
  const list = document.getElementById('reviewList');
  list.innerHTML = '';
  if (!state.lastResult) return;

  const { questions, answers } = state.lastResult;
  const labels = ['A','B','C','D'];

  questions.forEach((q, idx) => {
    const userAns = answers[idx];
    let status = 'skipped';
    if (userAns !== undefined) {
      status = userAns === q.answer ? 'correct' : 'wrong';
    }

    if (filter !== 'all' && filter !== status) return;

    const statusLabel = { correct: '✅ Correct', wrong: '❌ Wrong', skipped: '⏭ Skipped' }[status];

    const item = document.createElement('div');
    item.className = `review-item ${status}`;
    item.innerHTML = `
      <div class="ri-head">
        <span class="ri-status ${status}">${statusLabel}</span>
        <span style="font-size:12px;color:var(--text-muted)">Q${idx+1}</span>
      </div>
      <div class="ri-qtext">${q.question}</div>
      <div class="ri-options">
        ${q.options.map((opt, i) => {
          let cls = '';
          if (opt === q.answer) cls = 'correct-opt';
          else if (opt === userAns) cls = 'wrong-opt';
          return `<div class="ri-opt ${cls}">${labels[i]}. ${opt}</div>`;
        }).join('')}
      </div>
      ${q.explanation ? `<div class="ri-explanation">💡 ${q.explanation}</div>` : ''}
    `;
    list.appendChild(item);
  });

  if (list.children.length === 0) {
    list.innerHTML = `<div style="color:var(--text-muted);padding:20px;text-align:center">No questions in this category</div>`;
  }
}

function filterReview(btn, filter) {
  document.querySelectorAll('.rf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderReviewList(filter);
}

// ============ REVISION ============
function renderRevisionCounts() {
  const stats = getStats();
  document.getElementById('revWrongCount').textContent = `${stats.wrongQuestions.length} questions`;
  document.getElementById('revSkippedCount').textContent = `${stats.skippedQuestions.length} questions`;

  // Count important questions from all loaded data
  const importantCount = state.allQuestions.filter(q => q.important).length;
  document.getElementById('revImportantCount').textContent = `${importantCount} questions (from last topic)`;
  document.getElementById('revBookmarkedCount').textContent = `${(stats.bookmarkedIds || []).length} questions`;
}

async function startRevision(type) {
  let pool = [];
  const stats = getStats();

  if (type === 'wrong') {
    pool = stats.wrongQuestions;
    if (pool.length === 0) { showToast('No wrong questions saved yet!'); return; }
  } else if (type === 'skipped') {
    pool = stats.skippedQuestions;
    if (pool.length === 0) { showToast('No skipped questions saved yet!'); return; }
  } else if (type === 'important') {
    // Load all topics and collect important ones
    pool = [];
    for (const topic of TOPIC_FILES) {
      try {
        const res = await fetch(`question-answer/${topic.file}`);
        if (!res.ok) continue;
        let qs = await res.json();
        qs = normalizeQuestions(qs);
        pool.push(...qs.filter(q => q.important));
      } catch(e) {}
    }
    if (pool.length === 0) { showToast('No important questions found!'); return; }
  } else if (type === 'bookmarked') {
    const bIds = new Set(stats.bookmarkedIds || []);
    // Load from all topics
    for (const topic of TOPIC_FILES) {
      try {
        const res = await fetch(`question-answer/${topic.file}`);
        if (!res.ok) continue;
        let qs = await res.json();
        qs = normalizeQuestions(qs);
        pool.push(...qs.filter(q => bIds.has(String(q.id))));
      } catch(e) {}
    }
    if (pool.length === 0) { showToast('No bookmarked questions!'); return; }
  }

  // Start as a mini test
  state.questions = shuffle(pool);
  state.currentIndex = 0;
  state.answers = {};
  state.skipped = new Set();
  state.timerMode = 'none';
  state.mode = 'practice';
  state.selectedTopic = 'Revision';

  document.getElementById('timerBar').style.display = 'none';
  showScreen('quiz');
  renderQuestion();
  buildPalette();
  showToast(`Starting ${pool.length} questions revision`);
}

function retestWrong() {
  showScreen('revision');
  startRevision('wrong');
}

// ============ DASHBOARD ============
function renderDashboard() {
  const stats = getStats();
  const totalAttempted = stats.totalQs;
  const accuracy = totalAttempted > 0
    ? (stats.totalCorrect / totalAttempted * 100).toFixed(1)
    : 0;

  document.getElementById('dTotalTests').textContent = stats.totalTests;
  document.getElementById('dOverallAccuracy').textContent = `${accuracy}%`;
  document.getElementById('dTotalQs').textContent = stats.totalQs;
  document.getElementById('dTotalCorrect').textContent = stats.totalCorrect;
  document.getElementById('dTotalWrong').textContent = stats.totalWrong;
  document.getElementById('dTotalScore').textContent = stats.totalScore.toFixed(1);

  // Weak topics
  const weakEl = document.getElementById('weakTopics');
  const topicKeys = Object.keys(stats.topicStats);
  if (topicKeys.length === 0) {
    weakEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Take some tests to see weak areas</p>';
  } else {
    const sorted = topicKeys
      .map(k => ({ name: k, ...stats.topicStats[k], pct: stats.topicStats[k].total > 0 ? (stats.topicStats[k].correct / stats.topicStats[k].total * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
    weakEl.innerHTML = sorted.map(t =>
      `<div class="weak-item">
        <span>${t.name}</span>
        <span style="font-weight:700;color:${t.pct < 40 ? 'var(--red)' : t.pct < 60 ? 'var(--yellow)' : 'var(--green)'}">${t.pct.toFixed(0)}%</span>
      </div>`
    ).join('');
  }

  // Topic stats bars
  const tsEl = document.getElementById('topicStats');
  if (topicKeys.length === 0) {
    tsEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No data yet</p>';
  } else {
    tsEl.innerHTML = topicKeys.map(k => {
      const t = stats.topicStats[k];
      const pct = t.total > 0 ? Math.round(t.correct / t.total * 100) : 0;
      const cls = pct >= 60 ? 'good' : pct >= 40 ? 'mid' : 'bad';
      return `<div class="topic-stat-row">
        <span class="ts-name">${k}</span>
        <div class="ts-bar-wrap"><div class="ts-bar ${cls}" style="width:${pct}%"></div></div>
        <span class="ts-pct">${pct}%</span>
      </div>`;
    }).join('');
  }
}

function clearAllData() {
  if (confirm('All saved data will be deleted. Are you sure?')) {
    localStorage.removeItem('bci_stats');
    renderDashboard();
    showToast('All data cleared');
  }
}

// ============ UTILS ============
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2500);
}

// ============ NOTES & STUDY SHEETS ============
function openNotesSheet(url, title) {
  const modal = document.getElementById('notesIframeModal');
  const iframe = document.getElementById('notesIframe');
  const titleEl = document.getElementById('notesIframeTitle');
  const tabLink = document.getElementById('notesIframeTabLink');
  
  if (modal && iframe && titleEl && tabLink) {
    titleEl.textContent = title;
    tabLink.href = url;
    iframe.src = url;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Stop body scrolling
  }
}

function closeNotesSheet() {
  const modal = document.getElementById('notesIframeModal');
  const iframe = document.getElementById('notesIframe');
  
  if (modal && iframe) {
    modal.style.display = 'none';
    iframe.src = ''; // Clear source to stop iframe loading/playing
    document.body.style.overflow = ''; // Restore scrolling
  }
}

let activeNotesCategory = 'all';

function filterCategory(cat, btnEl) {
  activeNotesCategory = cat;
  
  // Set active button styles
  document.querySelectorAll('.notes-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (btnEl) btnEl.classList.add('active');
  
  filterNotes();
}

function filterNotes() {
  const searchVal = document.getElementById('notesSearch').value.toLowerCase().trim();
  const cards = document.querySelectorAll('.note-card');
  
  cards.forEach(card => {
    const titleAttr = card.dataset.title || '';
    const catAttr = card.dataset.category || '';
    
    const matchesCategory = (activeNotesCategory === 'all' || catAttr === activeNotesCategory);
    const matchesSearch = (!searchVal || titleAttr.includes(searchVal) || card.querySelector('.note-card-title').textContent.toLowerCase().includes(searchVal));
    
    if (matchesCategory && matchesSearch) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// ============ INIT ============
function init() {
  showScreen('home');
  loadTopics();
  initConfigButtons();
  loadBookmarks();
}

document.addEventListener('DOMContentLoaded', init);
