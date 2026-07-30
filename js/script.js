/* =============================================
   BCI Quiz — RSMSSB Prep Core Application Engine
   Integrates storage, question engine, AI educator,
   analytics dashboard, hotkeys & mode controllers.
   ============================================= */

// ============ TOPIC CONFIG ============
const TOPIC_FILES = [
  { file: 'dbms/dbms-overview.json',                      name: 'DBMS Overview',        icon: '📖', category: 'dbms' },
  { file: 'dbms/dbms-architecture.json',                  name: 'DBMS Architecture',    icon: '🏛️', category: 'dbms' },
  { file: 'dbms/dbms-database-design.json',              name: 'Database Design',      icon: '📐', category: 'dbms' },
  { file: 'dbms/dbms-manipulating-data.json',            name: 'Manipulating Data',     icon: '⚙️', category: 'dbms' },
  { file: 'dbms/dbms-rdbms.json',                        name: 'RDBMS',                icon: '💾', category: 'dbms' },
  { file: 'dbms/dbms-nosql-technology.json',             name: 'NoSQL Technology',     icon: '🌐', category: 'dbms' },
  { file: 'dbms/dbms-mcq-important.json',               name: 'DBMS Important MCQs',  icon: '⭐', category: 'dbms' },

  // IT Pathshala DBMS Topics
  { file: 'dbms/it-pathshala-dbms-basics.json',                      name: 'DBMS Basics (IT Pathshala)',                   icon: '📚', category: 'dbms' },
  { file: 'dbms/it-pathshala-dbms-data-models-er.json',               name: 'Data Models & ER (IT Pathshala)',              icon: '🗂️', category: 'dbms' },
  { file: 'dbms/it-pathshala-dbms-relational-algebra-calculus.json',  name: 'Relational Algebra & Calculus (IT Pathshala)', icon: '🧮', category: 'dbms' },
  { file: 'dbms/it-pathshala-dbms-rdbms.json',                        name: 'RDBMS (IT Pathshala)',                         icon: '📁', category: 'dbms' },
  { file: 'dbms/it-pathshala-dbms-normalization.json',                name: 'Normalization (IT Pathshala)',                 icon: '📋', category: 'dbms' },
  { file: 'dbms/it-pathshala-dbms-transaction-concurrency.json',      name: 'Transaction & Concurrency (IT Pathshala)',     icon: '🔄', category: 'dbms' },
  { file: 'dbms/it-pathshala-dbms-nosql-datawarehouse-mining.json',   name: 'NoSQL & Data Warehouse (IT Pathshala)',        icon: '☁️', category: 'dbms' },
  { file: 'ms-office/ms-access-question-bank.json',                   name: 'MS Access Bank (IT Pathshala)',                icon: '📊', category: 'dbms' },
  { file: 'ms-office/ms-powerpoint-question-bank.json',               name: 'MS PowerPoint Bank (IT Pathshala)',            icon: '📉', category: 'msoffice' },
  { file: 'papers/rsmssb-bci-2022-paper-1.json',                      name: 'BCI Paper 1 (2022)',                           icon: '📝', category: 'papers' },
  { file: 'papers/rsmssb-bci-2022-paper-2.json',                      name: 'BCI Paper 2 (2022)',                           icon: '📝', category: 'papers' },
  { file: 'papers/rssb-forest-guard-2026.json',                     name: 'RSSB Forest Guard (2026)',                     icon: '🌳', category: 'papers' },
  { file: 'papers/rpsc-2nd-grade-gk-2024.json',                      name: 'RPSC 2nd Grade GK (2024)',                     icon: '📝', category: 'papers' },

  { file: 'others/system-analysis-design.json',                      name: 'System Analysis & Design',                     icon: '📊', category: 'others' },
  { file: 'others/bci-syllabus-topics.json',                         name: 'BCI Syllabus & Topic Weightage',               icon: '📖', category: 'others' },
];

// Global Active State
let state = {
  selectedTopic: null,
  selectedFile: null,
  allQuestions: [],

  // Quiz Config
  qCount: 25,
  order: 'random',
  timerMode: 'none',
  timerMinutes: 0,
  mode: 'practice',

  // Active Quiz Progress
  questions: [],
  currentIndex: 0,
  answers: {},
  skipped: new Set(),
  bookmarked: new Set(),
  questionStartTimes: {},

  // Timers
  timerInterval: null,
  timerSecondsLeft: 0,
  timerTotal: 0,
  qStartTime: 0,

  lastResult: null,
};

window.allLoadedTopics = [];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  UIController.loadSavedTheme();
  initTopicFilterButtons();
  initTopicSearchInput();
  initConfigButtons();
  loadTopics();
  initHotkeyBindings();
});

function initHotkeyBindings() {
  UIController.initKeyboardHotkeys({
    onSelectOption: (idx) => selectOptionByIndex(idx),
    onNext: () => nextQuestion(),
    onPrev: () => prevQuestion(),
    onBookmark: () => toggleBookmarkCurrent(),
    onSkip: () => skipQuestion(),
    onSearchTrigger: () => openSearchModal(),
    onCloseModals: () => closeModal()
  });
}

function initTopicFilterButtons() {
  const filterRow = document.getElementById('homeFilterRow');
  if (!filterRow) return;
  filterRow.querySelectorAll('.home-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const cat = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'all';
      filterHomeCategory(cat, this);
    });
  });
}

function initTopicSearchInput() {
  const input = document.getElementById('topicSearch');
  if (input) {
    input.addEventListener('input', function() {
      searchTopics(this.value);
    });
  }
}

function initConfigButtons() {
  const qOpts = document.getElementById('qCountOptions');
  if (qOpts) {
    qOpts.querySelectorAll('.cfg-btn').forEach(btn => {
      btn.onclick = function() {
        qOpts.querySelectorAll('.cfg-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.qCount = this.getAttribute('data-val');
        const customRow = document.getElementById('customRangeRow');
        if (customRow) {
          customRow.style.display = (state.qCount === 'range') ? 'flex' : 'none';
        }
      };
    });
  }

  const oOpts = document.getElementById('qOrderOptions');
  if (oOpts) {
    oOpts.querySelectorAll('.cfg-btn').forEach(btn => {
      btn.onclick = function() {
        oOpts.querySelectorAll('.cfg-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.order = this.getAttribute('data-val');
      };
    });
  }

  const tOpts = document.getElementById('timerOptions');
  if (tOpts) {
    tOpts.querySelectorAll('.cfg-btn').forEach(btn => {
      btn.onclick = function() {
        tOpts.querySelectorAll('.cfg-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.timerMode = this.getAttribute('data-val');
        if (state.timerMode === '30') state.timerMinutes = 30;
        else if (state.timerMode === '60') state.timerMinutes = 60;
        else state.timerMinutes = 0;

        const customTimer = document.getElementById('customTimerRow');
        if (customTimer) {
          customTimer.style.display = (state.timerMode === 'custom') ? 'block' : 'none';
        }
      };
    });
  }

  const mOpts = document.getElementById('modeOptions');
  if (mOpts) {
    mOpts.querySelectorAll('.cfg-btn').forEach(btn => {
      btn.onclick = function() {
        mOpts.querySelectorAll('.cfg-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.mode = this.getAttribute('data-val');
      };
    });
  }
}

// ============ TOPIC LOADING & NORMALIZATION ============
async function loadTopics() {
  window.allLoadedTopics = [];
  const container = document.getElementById('topicsContainer');
  if (!container) return;
  container.innerHTML = '';

  const categories = {
    dbms: { name: '🗄️ DBMS (डेटाबेस मैनेजमेंट)', topics: [] },
    msoffice: { name: '📊 MS Office (एमएस ऑफिस)', topics: [] },
    papers: { name: '📝 Previous Papers & Exams (परीक्षा प्रश्न पत्र)', topics: [] },
    others: { name: '📖 Other Topics (अन्य विषय)', topics: [] }
  };

  for (const topic of TOPIC_FILES) {
    try {
      const res = await fetch(`question-bank/${topic.file}`);
      if (!res.ok) continue;

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const arrayText = text.substring(startIndex, endIndex + 1);
          parsed = new Function(`return ${arrayText}`)();
        } else {
          continue;
        }
      }

      let rawQs = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);
      if (!Array.isArray(rawQs) || rawQs.length === 0) continue;

      const normalizedQs = rawQs.map(q => QuestionEngine.normalizeQuestion(q)).filter(Boolean);

      window.allLoadedTopics.push({ topic, questions: normalizedQs });
      categories[topic.category || 'others'].topics.push({ topic, questions: normalizedQs });
    } catch (e) {
      // Silently skip missing or unparseable topic files
    }
  }

  renderTopicsGrid(categories, container);
}

function renderTopicsGrid(categories, container) {
  let totalRendered = 0;
  for (const catKey in categories) {
    const cat = categories[catKey];
    if (cat.topics.length === 0) continue;

    const secEl = document.createElement('div');
    secEl.className = 'category-section';
    secEl.setAttribute('data-category', catKey);
    secEl.style.marginBottom = '24px';

    const labelEl = document.createElement('div');
    labelEl.className = 'section-label';
    labelEl.style.fontSize = '12px';
    labelEl.style.borderBottom = '1px solid var(--border)';
    labelEl.style.paddingBottom = '6px';
    labelEl.style.marginBottom = '12px';
    labelEl.style.color = 'var(--saffron)';
    labelEl.textContent = cat.name;
    secEl.appendChild(labelEl);

    const gridEl = document.createElement('div');
    gridEl.className = 'topic-grid';

    cat.topics.forEach(({ topic, questions }) => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <div class="topic-icon">${topic.icon}</div>
        <div class="topic-name">${topic.name}</div>
        <div class="topic-count">${questions.length} questions</div>
      `;
      card.onclick = () => selectTopic(topic, questions, card);
      gridEl.appendChild(card);
      totalRendered++;
    });

    secEl.appendChild(gridEl);
    container.appendChild(secEl);
  }

  if (totalRendered === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:14px;padding:20px 0;text-align:center">
      No question files found in <code>question-bank/</code> folder.
    </div>`;
  }
}

// ============ SCREEN & NAVIGATION ============
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    if (b.textContent.toLowerCase().includes(name.substring(0, 4))) b.classList.add('active');
  });

  if (name === 'dashboard') renderDashboard();
  if (name === 'revision') renderRevisionCounts();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleNav() {
  const n = document.getElementById('mobileNav');
  if (n) n.classList.toggle('open');
}

function toggleTheme() {
  UIController.toggleTheme();
}

function filterHomeCategory(catKey, btn) {
  document.querySelectorAll('.home-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const query = (document.getElementById('topicSearch')?.value || '').toLowerCase().trim();

  document.querySelectorAll('.category-section').forEach(sec => {
    const secCat = sec.getAttribute('data-category');
    const isCatMatch = (catKey === 'all' || secCat === catKey);

    let hasVisibleCard = false;
    sec.querySelectorAll('.topic-card').forEach(card => {
      const name = card.querySelector('.topic-name').textContent.toLowerCase();
      const isSearchMatch = name.includes(query);
      if (isSearchMatch) {
        card.style.display = 'flex';
        if (isCatMatch) hasVisibleCard = true;
      } else {
        card.style.display = 'none';
      }
    });

    sec.style.display = (isCatMatch && hasVisibleCard) ? 'block' : 'none';
  });

  clearTopic();
}

function searchTopics(query) {
  const q = query.toLowerCase().trim();
  const activeBtn = document.querySelector('.home-filter-btn.active');
  const activeCat = activeBtn ? (activeBtn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'all') : 'all';

  document.querySelectorAll('.category-section').forEach(sec => {
    const secCat = sec.getAttribute('data-category');
    const isCatMatch = (activeCat === 'all' || secCat === activeCat);

    let hasVisibleCard = false;
    sec.querySelectorAll('.topic-card').forEach(card => {
      const name = card.querySelector('.topic-name').textContent.toLowerCase();
      const isSearchMatch = name.includes(q);
      if (isSearchMatch) {
        card.style.display = 'flex';
        if (isCatMatch) hasVisibleCard = true;
      } else {
        card.style.display = 'none';
      }
    });

    sec.style.display = (isCatMatch && hasVisibleCard) ? 'block' : 'none';
  });
}

// Filter for Notes Screen Tabs
function filterCategory(catKey, btn) {
  document.querySelectorAll('.notes-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.notes-section').forEach(sec => {
    const secCat = sec.getAttribute('data-section-category');
    if (catKey === 'all' || secCat === catKey) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
}

// Filter for Revision Screen Tabs
function filterReview(btn, type) {
  document.querySelectorAll('.review-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ============ TOPIC SELECTION & CONFIG ============
function selectTopic(topic, questions, cardEl) {
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');

  state.selectedTopic = topic;
  state.allQuestions = questions;

  const box = document.getElementById('configBox');
  const lbl = document.getElementById('selectedTopicLabel');
  if (lbl) lbl.textContent = topic.name;
  if (box) {
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function clearTopic() {
  state.selectedTopic = null;
  state.allQuestions = [];
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('active'));
  const box = document.getElementById('configBox');
  if (box) box.style.display = 'none';
}

// ============ QUIZ LAUNCHERS ============
function startTest() {
  if (!state.allQuestions || state.allQuestions.length === 0) {
    UIController.showToast('Please select a topic first!');
    return;
  }

  let finalQuestions = [...state.allQuestions];

  if (state.order === 'random') {
    finalQuestions = QuestionEngine.shuffle(finalQuestions);
  }

  if (state.qCount === 'range') {
    const rStart = parseInt(document.getElementById('rangeStart')?.value || '1', 10) - 1;
    const rEnd = parseInt(document.getElementById('rangeEnd')?.value || '50', 10);
    finalQuestions = finalQuestions.slice(Math.max(0, rStart), Math.min(finalQuestions.length, rEnd));
  } else if (state.qCount !== 'all') {
    const count = parseInt(state.qCount, 10);
    finalQuestions = finalQuestions.slice(0, Math.min(count, finalQuestions.length));
  }

  launchQuizSession(finalQuestions, state.selectedTopic?.name || 'Topic Practice');
}

function startMockTest() {
  const mockQs = QuestionEngine.generateMockTest(window.allLoadedTopics, 100);
  if (mockQs.length === 0) {
    UIController.showToast('No questions loaded for Mock Test.');
    return;
  }
  state.timerMode = '60';
  state.timerMinutes = 60;
  state.mode = 'exam';
  launchQuizSession(mockQs, 'Full Syllabus Mock Test (100 Qs)');
}

function startWeakTopicQuiz() {
  const stats = StorageEngine.getStats();
  const weakQs = QuestionEngine.generateWeakTopicQuiz(window.allLoadedTopics, stats);
  if (weakQs.length === 0) {
    UIController.showToast('No weak topics detected yet!');
    return;
  }
  launchQuizSession(weakQs, '🎯 Weak Topic AI Diagnostic Quiz');
}

function startMistakeQuiz() {
  const stats = StorageEngine.getStats();
  const mistakeQs = QuestionEngine.generateMistakeQuiz(stats);
  if (mistakeQs.length === 0) {
    UIController.showToast('Great job! Mistake Notebook is empty.');
    return;
  }
  launchQuizSession(mistakeQs, '📕 Mistake Notebook Re-Test');
}

function startBookmarkedQuiz() {
  const stats = StorageEngine.getStats();
  const bQs = QuestionEngine.generateBookmarkedQuiz(window.allLoadedTopics, stats);
  if (bQs.length === 0) {
    UIController.showToast('No bookmarked questions saved.');
    return;
  }
  launchQuizSession(bQs, '⭐ Bookmarked Questions Quiz');
}

function startRapidFire() {
  let pool = [];
  window.allLoadedTopics.forEach(t => pool.push(...t.questions));
  if (pool.length === 0) return;

  pool = QuestionEngine.shuffle(pool).slice(0, 15);
  state.timerMode = 'custom';
  state.timerMinutes = 3;
  launchQuizSession(pool, '⚡ Rapid Fire Quiz (15 Qs)');
}

function startRevision(type) {
  if (type === 'wrong' || type === 'mistakes') {
    startMistakeQuiz();
  } else if (type === 'bookmarks') {
    startBookmarkedQuiz();
  } else {
    startWeakTopicQuiz();
  }
}

function reviewAnswers() {
  showScreen('revision');
}

function retestWrong() {
  startMistakeQuiz();
}

function launchQuizSession(questionsList, sessionTitle) {
  state.questions = questionsList;
  state.currentIndex = 0;
  state.answers = {};
  state.skipped = new Set();
  state.qStartTime = Date.now();

  const titleEl = document.getElementById('quizHeaderTitle');
  if (titleEl) titleEl.textContent = sessionTitle;

  showScreen('quiz');
  renderQuizQuestion();
  renderQuestionPalette();

  if (state.timerMode !== 'none') {
    startTimer(state.timerMinutes * 60);
  }
}

// ============ QUIZ QUESTION RENDERER ============
function renderQuizQuestion() {
  const q = state.questions[state.currentIndex];
  if (!q) return;

  state.qStartTime = Date.now();

  const pLabel = document.getElementById('progressLabel') || document.getElementById('quizQNum');
  const pFill = document.getElementById('progressFill');
  const sLive = document.getElementById('scoreLive');
  const qNum = document.getElementById('qNumber') || document.getElementById('quizQNum');
  const qDiff = document.getElementById('qDifficulty');
  const qText = document.getElementById('questionText') || document.getElementById('quizQText');
  const optBox = document.getElementById('optionsList') || document.getElementById('quizOptionsBox');

  const curNum = state.currentIndex + 1;
  const totalNum = state.questions.length;

  if (pLabel) pLabel.textContent = `Q ${curNum} / ${totalNum}`;
  if (pFill) pFill.style.width = `${(curNum / totalNum) * 100}%`;
  if (sLive) {
    let curScore = 0;
    Object.keys(state.answers).forEach(idx => {
      const isC = state.answers[idx] === state.questions[idx]?.answer;
      if (isC) curScore += 1;
      else if (!state.answers[idx].includes('(e)')) curScore -= 0.33;
    });
    sLive.textContent = `Score: ${curScore.toFixed(2)}`;
  }

  if (qNum) qNum.textContent = `Q${curNum}`;
  if (qDiff) qDiff.textContent = q.difficulty || 'Medium';
  if (qText) qText.textContent = q.question;

  if (optBox) {
    optBox.innerHTML = '';
    (q.options || []).forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn option-btn';
      if (state.answers[state.currentIndex] === opt) {
        btn.classList.add('selected');
      }

      btn.textContent = opt;
      btn.onclick = () => selectOption(opt, btn);
      optBox.appendChild(btn);
    });
  }

  const ansReveal = document.getElementById('answerReveal') || document.getElementById('quizExplBox');
  const revAns = document.getElementById('revealAnswer');
  const revExpl = document.getElementById('revealExplanation');

  if (ansReveal) {
    if (state.mode === 'practice' && state.answers[state.currentIndex]) {
      const isCorrect = state.answers[state.currentIndex] === q.answer;
      ansReveal.style.display = 'block';

      if (revAns) revAns.textContent = q.answer;
      if (revExpl) {
        let aiDiagnostic = '';
        if (!isCorrect) {
          const timeSpent = Math.round((Date.now() - state.qStartTime) / 1000);
          const aiRes = AIEngine.analyzeMistake(q, state.answers[state.currentIndex], timeSpent);
          aiDiagnostic = `<div style="margin-top:10px; padding:10px; background:rgba(239, 68, 68, 0.1); border-radius:6px; font-size:13px; color:#ef4444;">
            ${aiRes.suggestion}
          </div>`;
        }

        revExpl.innerHTML = `
          <div>${q.explanation}</div>
          ${q.trap_point ? `<div style="margin-top:6px; color:#f59e0b;">⚠️ <strong>Trap Point:</strong> ${q.trap_point}</div>` : ''}
          ${q.memory_trick ? `<div style="margin-top:6px; color:#10b981;">🧠 <strong>Memory Trick:</strong> ${q.memory_trick}</div>` : ''}
          ${aiDiagnostic}
        `;
      }
    } else {
      ansReveal.style.display = 'none';
    }
  }

  renderQuestionPalette();
}

function selectOption(optStr, btnEl) {
  const q = state.questions[state.currentIndex];
  state.answers[state.currentIndex] = optStr;

  document.querySelectorAll('.quiz-option-btn, .option-btn').forEach(b => b.classList.remove('selected'));
  if (btnEl) btnEl.classList.add('selected');

  const timeSpent = Math.round((Date.now() - state.qStartTime) / 1000);
  const isCorrect = optStr === q.answer;
  StorageEngine.recordQuestionAttempt(q, optStr, isCorrect, timeSpent);

  renderQuizQuestion();
}

function selectOptionByIndex(idx) {
  const q = state.questions[state.currentIndex];
  if (q && q.options && q.options[idx]) {
    selectOption(q.options[idx], null);
  }
}

function navigate(step) {
  if (step === -1) prevQuestion();
  else if (step === 1) nextQuestion();
}

function nextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuizQuestion();
  }
}

function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuizQuestion();
  }
}

function skipQuestion() {
  state.skipped.add(state.currentIndex);
  nextQuestion();
}

function toggleBookmarkCurrent() {
  const q = state.questions[state.currentIndex];
  if (q) {
    const isBookmarked = StorageEngine.toggleBookmark(q);
    UIController.showToast(isBookmarked ? '⭐ Question Bookmarked' : 'Removed from Bookmarks');
  }
}

// ============ PALETTE RENDERER ============
function togglePalette() {
  const pal = document.getElementById('questionPalette');
  if (pal) {
    pal.style.display = (pal.style.display === 'none' || !pal.style.display) ? 'block' : 'none';
  }
}

function renderQuestionPalette() {
  const grid = document.getElementById('paletteGrid') || document.getElementById('questionPaletteContainer');
  if (!grid) return;

  grid.innerHTML = '';
  state.questions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    if (idx === state.currentIndex) btn.classList.add('current');
    if (state.answers[idx]) btn.classList.add('answered');
    else if (state.skipped.has(idx)) btn.classList.add('skipped');

    btn.textContent = idx + 1;
    btn.onclick = () => {
      state.currentIndex = idx;
      renderQuizQuestion();
    };
    grid.appendChild(btn);
  });
}

// ============ TIMER ENGINE ============
function startTimer(secondsTotal) {
  clearInterval(state.timerInterval);
  state.timerSecondsLeft = secondsTotal;
  state.timerTotal = secondsTotal;

  const bar = document.getElementById('timerBar');
  const display = document.getElementById('timerDisplay');
  if (bar) bar.style.display = 'flex';

  state.timerInterval = setInterval(() => {
    state.timerSecondsLeft--;
    if (display) {
      const m = Math.floor(state.timerSecondsLeft / 60).toString().padStart(2, '0');
      const s = (state.timerSecondsLeft % 60).toString().padStart(2, '0');
      display.textContent = `${m}:${s}`;
    }

    if (state.timerSecondsLeft <= 0) {
      clearInterval(state.timerInterval);
      UIController.showToast('⏱️ Time Up! Submitting test...');
      submitTest();
    }
  }, 1000);
}

// ============ SUBMIT TEST & RESULTS ============
function confirmSubmit() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.style.display = 'flex';
  else submitTest();
}

function submitTest() {
  closeModal();
  clearInterval(state.timerInterval);
  StorageEngine.recordTestCompleted();

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let optionECount = 0;

  state.questions.forEach((q, idx) => {
    const userAns = state.answers[idx];
    if (!userAns) {
      skippedCount++;
    } else if (userAns.includes('(e)') || userAns.includes('Not Attempted')) {
      optionECount++;
    } else if (userAns === q.answer) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const totalScore = (correctCount * 1) - (wrongCount * 0.33);
  state.lastResult = {
    correctCount,
    wrongCount,
    skippedCount,
    optionECount,
    totalScore,
    totalCount: state.questions.length
  };

  renderResultsScreen();
}

function renderResultsScreen() {
  const r = state.lastResult;
  if (!r) return;

  const resScore = document.getElementById('resultScore');
  const resCorrect = document.getElementById('rCorrect') || document.getElementById('resultCorrect');
  const resWrong = document.getElementById('rWrong') || document.getElementById('resultWrong');
  const resSkipped = document.getElementById('rSkipped') || document.getElementById('resultSkipped');
  const resOptionE = document.getElementById('rOptionE');
  const resTotal = document.getElementById('rTotal');

  if (resScore) resScore.textContent = r.totalScore.toFixed(2);
  if (resCorrect) resCorrect.textContent = r.correctCount;
  if (resWrong) resWrong.textContent = r.wrongCount;
  if (resSkipped) resSkipped.textContent = r.skippedCount;
  if (resOptionE) resOptionE.textContent = r.optionECount;
  if (resTotal) resTotal.textContent = r.totalCount;

  showScreen('result');
}

// ============ DASHBOARD & ANALYTICS ============
function renderDashboard() {
  const stats = StorageEngine.getStats();
  AnalyticsEngine.renderDashboard(stats);
}

function renderRevisionCounts() {
  const stats = StorageEngine.getStats();
  const elMistakes = document.getElementById('mistakeCountBadge');
  const elBookmarks = document.getElementById('bookmarkCountBadge');
  if (elMistakes) elMistakes.textContent = `${(stats.wrongQuestions || []).length} items`;
  if (elBookmarks) elBookmarks.textContent = `${(stats.bookmarkedIds || []).length} items`;
}

function clearAllData() {
  if (confirm('Are you sure you want to reset all study progress and statistics?')) {
    StorageEngine.clearAllData();
    UIController.showToast('Progress reset.');
    renderDashboard();
    renderRevisionCounts();
  }
}

// ============ SEARCH OVERLAY ============
function openSearchModal() {
  const modal = document.getElementById('searchModalOverlay');
  if (modal) modal.style.display = 'flex';
  const input = document.getElementById('universalSearchInput');
  if (input) {
    input.focus();
    input.oninput = (e) => SearchEngine.executeUniversalSearch(e.target.value, window.allLoadedTopics, 'searchResultsContainer');
  }
}

function closeModal() {
  const modals = ['confirmModal', 'notesIframeModal', 'searchModalOverlay'];
  modals.forEach(id => {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
  });
}

// ============ NOTES IFRAME VIEWER ============
function openNotesSheet(url, title) {
  const modal = document.getElementById('notesIframeModal');
  const iframe = document.getElementById('notesIframe');
  const titleEl = document.getElementById('notesIframeTitle');
  const tabLink = document.getElementById('notesIframeTabLink');

  if (iframe) iframe.src = url;
  if (titleEl) titleEl.textContent = title;
  if (tabLink) tabLink.href = url;
  if (modal) modal.style.display = 'flex';
}

function closeNotesSheet() {
  const modal = document.getElementById('notesIframeModal');
  const iframe = document.getElementById('notesIframe');
  if (iframe) iframe.src = '';
  if (modal) modal.style.display = 'none';
}

// Export Global Handlers for ALL inline onclick attributes
window.showScreen = showScreen;
window.toggleNav = toggleNav;
window.toggleTheme = toggleTheme;
window.filterHomeCategory = filterHomeCategory;
window.searchTopics = searchTopics;
window.filterCategory = filterCategory;
window.filterReview = filterReview;
window.selectTopic = selectTopic;
window.clearTopic = clearTopic;
window.startTest = startTest;
window.startMockTest = startMockTest;
window.startWeakTopicQuiz = startWeakTopicQuiz;
window.startMistakeQuiz = startMistakeQuiz;
window.startBookmarkedQuiz = startBookmarkedQuiz;
window.startRapidFire = startRapidFire;
window.startRevision = startRevision;
window.reviewAnswers = reviewAnswers;
window.retestWrong = retestWrong;
window.navigate = navigate;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.skipQuestion = skipQuestion;
window.togglePalette = togglePalette;
window.confirmSubmit = confirmSubmit;
window.submitTest = submitTest;
window.clearAllData = clearAllData;
window.openNotesSheet = openNotesSheet;
window.closeNotesSheet = closeNotesSheet;
window.openSearchModal = openSearchModal;
window.closeModal = closeModal;
