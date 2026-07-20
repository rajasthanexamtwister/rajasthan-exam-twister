/* =============================================
   BCI Quiz — RSMSSB Prep
   Complete Quiz Engine
   ============================================= */

// ============ TOPIC CONFIG ============
// Add your JSON filenames here when you add new topics
const TOPIC_FILES = [
  { file: 'DBMS/DBMS_overview of database management.json', name: 'DBMS Overview',        icon: '📖', category: 'dbms' },
  { file: 'DBMS/DBMS_architecture of database system .json',name: 'DBMS Architecture',    icon: '🏛️', category: 'dbms' },
  { file: 'DBMS/DBMS_database design.json',                name: 'Database Design',      icon: '📐', category: 'dbms' },
  { file: 'DBMS/DBMS_manipulating data.json',              name: 'Manipulating Data',     icon: '⚙️', category: 'dbms' },
  { file: 'DBMS/DBMS_Rdbms.json',                          name: 'RDBMS',                icon: '💾', category: 'dbms' },
  { file: 'DBMS/DBMS_no sql technology .js',               name: 'NoSQL Technology',     icon: '🌐', category: 'dbms' },
  { file: 'DBMS/DBMS_MCQ important.json',                 name: 'DBMS Important MCQs',  icon: '⭐', category: 'dbms' },

  // IT Pathshala DBMS Folder Topics
  { file: 'IT PATHSHALA DBMS/DBMS_Basics.json',                       name: 'DBMS Basics (IT Pathshala)',                   icon: '📚', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/DBMS_Data_Models_ER.json',                name: 'Data Models & ER (IT Pathshala)',              icon: '🗂️', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/DBMS_Relational_Algebra_Calculus.json',   name: 'Relational Algebra & Calculus (IT Pathshala)', icon: '🧮', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/DBMS_RDBMS.json',                         name: 'RDBMS (IT Pathshala)',                         icon: '📁', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/DBMS_Normalization.json',                 name: 'Normalization (IT Pathshala)',                 icon: '📋', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/DBMS_Transaction_Concurrency.json',       name: 'Transaction & Concurrency (IT Pathshala)',     icon: '🔄', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/DBMS_NoSQL_DataWarehouse_Mining.json',    name: 'NoSQL & Data Warehouse (IT Pathshala)',        icon: '☁️', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/MS_Access_Question_Bank.json',            name: 'MS Access Bank (IT Pathshala)',                icon: '📊', category: 'dbms' },
  { file: 'IT PATHSHALA DBMS/MS_PowerPoint_Question_Bank.json',        name: 'MS PowerPoint Bank (IT Pathshala)',            icon: '📉', category: 'msoffice' },
  { file: 'IT PATHSHALA DBMS/RSMSSB_BCI_2022_Paper_1.json',            name: 'BCI Paper 1 (2022)',                           icon: '📝', category: 'papers' },
  { file: 'IT PATHSHALA DBMS/RSMSSB_BCI_2022_Paper_2.json',            name: 'BCI Paper 2 (2022)',                           icon: '📝', category: 'papers' },
  { file: 'IT PATHSHALA DBMS/RSSB_Forest_Guard_2026.json',             name: 'RSSB Forest Guard (2026)',                     icon: '🌳', category: 'papers' },
  { file: 'rpsc_2nd_grade.json',                                       name: 'RPSC 2nd Grade GK (2024)',                     icon: '📝', category: 'papers' },

  { file: 'computer.json',          name: 'Computer',          icon: '💻', category: 'others' },
  { file: 'system_analysis_design.json', name: 'System Analysis & Design', icon: '📊', category: 'others' },
  { file: 'rajasthan_history.json', name: 'Rajasthan History', icon: '🏰', category: 'others' },
  { file: 'geography.json',         name: 'Geography',         icon: '🗺️', category: 'others' },
  { file: 'culture.json',           name: 'Culture',           icon: '🎭', category: 'others' },
  { file: 'other_topics.json',      name: 'Other Topics',      icon: '📖', category: 'others' },
];

// Helper to automatically format statement-based questions with newlines
function formatQuestionText(text) {
  if (typeof text !== 'string') return text;
  
  // Check if this text likely contains a statement/conclusion list that needs formatting
  const hasStatementList = /\s*[—-]\s*\([Ii1a]\)/.test(text) || 
                           /(?:Statements|Conclusions|कथन|निष्कर्ष):\s*\([Ii1a]\)/i.test(text);
                           
  if (!hasStatementList) return text;
  
  let formatted = text;
  
  // Handle section headers like Statements/Conclusions or कथन/निष्कर्ष by putting them on newlines
  formatted = formatted.replace(/\s+(Statements:|Conclusions:|कथन:|निष्कर्ष:)/ig, '\n$1');
  
  // Replace dash/em-dash followed by (I) or (i) or (1) or (a) with newline and the indicator
  formatted = formatted.replace(/\s*[—-]\s*(\([Ii1a]\))/g, '\n$1');
  
  // Handle prefix labels followed by the first indicator
  formatted = formatted.replace(/(Statements:|Conclusions:|कथन:|निष्कर्ष:)\s*(\([Ii1a]\))/ig, '$1\n$2');
  
  // Replace spaces around subsequent indicators (II), (III), (IV), (V), (2), (3), (b), (c), etc. with a newline
  formatted = formatted.replace(/\s+(\((?:II|III|IV|V|ii|iii|iv|v|2|3|4|5|b|c|d|e)\))\s+/g, '\n$1 ');
  
  return formatted.trim();
}

// Helper to normalize question fields from different JSON formats
function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  questions.forEach(q => {
    // 0. Normalize option key trailing spaces if any
    if (!q.options && q['options ']) {
      q.options = q['options '];
    }

    // Normalize options from objects {id, text} to simple strings if necessary
    if (Array.isArray(q.options)) {
      q.options = q.options.map((opt, optIdx) => {
        let textVal = (typeof opt === 'object' && opt !== null) ? (opt.text || opt.option || '') : String(opt);
        textVal = textVal.trim();
        
        // Add (a), (b), (c), (d) prefixes if not already present
        const prefix = ['(a) ', '(b) ', '(c) ', '(d) '][optIdx] || '';
        const hasPrefix = textVal.toLowerCase().startsWith('(a)') ||
                          textVal.toLowerCase().startsWith('(b)') ||
                          textVal.toLowerCase().startsWith('(c)') ||
                          textVal.toLowerCase().startsWith('(d)');
        if (!hasPrefix && prefix) {
          textVal = prefix + textVal;
        }
        return textVal;
      });

      // Add Option E dynamically if it doesn't exist
      const hasE = q.options.some(opt => opt.toLowerCase().startsWith('(e)'));
      if (!hasE && q.options.length === 4) {
        q.options.push("(e) अनुत्तरित प्रश्न / Not Attempted (Option E)");
      }
    }

    // 1. Standardize question text (merge English and Hindi if available)
    if (!q.question) {
      let en = q.question_english || q.question_en || '';
      let hi = q.question_hindi || q.question_hi || '';
      en = formatQuestionText(en);
      hi = formatQuestionText(hi);
      if (en && hi) {
        q.question = `${en}\n\n${hi}`;
      } else {
        q.question = en || hi || '';
      }
    } else {
      q.question = formatQuestionText(q.question);
    }

    // 2. Standardize answers
    let ans = q.answer || q.correct_answer;
    if (ans && q.options) {
      ans = ans.trim();
      // Match (a) or just a
      const match = ans.match(/^\(([a-dA-D])\)$/) || ans.match(/^[a-dA-D]$/);
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
      const res = await fetch(`question-answer/${topic.file}`);
      if (!res.ok) continue;

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Fallback for JS files or JSON files with comments/trailing commas
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const arrayText = text.substring(startIndex, endIndex + 1);
          parsed = new Function(`return ${arrayText}`)();
        } else {
          continue;
        }
      }

      let questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);
      if (!Array.isArray(questions) || questions.length === 0) continue;
      questions = normalizeQuestions(questions);

      window.allLoadedTopics.push({ topic, questions });
      categories[topic.category || 'others'].topics.push({ topic, questions });
    } catch (e) {
      // File doesn't exist or error — skip silently
    }
  }

  let totalRendered = 0;
  for (const catKey in categories) {
    const cat = categories[catKey];
    if (cat.topics.length === 0) continue;

    // Create section element
    const secEl = document.createElement('div');
    secEl.className = 'category-section';
    secEl.setAttribute('data-category', catKey);
    secEl.style.marginBottom = '24px';

    // Label
    const labelEl = document.createElement('div');
    labelEl.className = 'section-label';
    labelEl.style.fontSize = '12px';
    labelEl.style.borderBottom = '1px solid var(--border)';
    labelEl.style.paddingBottom = '6px';
    labelEl.style.marginBottom = '12px';
    labelEl.style.color = 'var(--saffron)';
    labelEl.textContent = cat.name;
    secEl.appendChild(labelEl);

    // Grid for cards
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
      No question files found. Add JSON files to the <code>question-answer/</code> folder.
    </div>`;
  }
}

function filterHomeCategory(catKey, btn) {
  // Update active tab button style
  document.querySelectorAll('.home-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const target = document.querySelector(`.home-filter-btn[onclick*="'${catKey}'"]`);
    if (target) target.classList.add('active');
  }

  // Filter sections and respect the current search query
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

    if (isCatMatch && hasVisibleCard) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });

  // Clear selected topic config on category change to avoid confusion
  clearTopic();
}

function searchTopics(query) {
  const q = query.toLowerCase().trim();
  const activeBtn = document.querySelector('.home-filter-btn.active');
  const activeCat = activeBtn ? activeBtn.getAttribute('onclick').match(/'([^']+)'/)[1] : 'all';

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

    if (isCatMatch && hasVisibleCard) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
}

function startMockTest() {
  if (!window.allLoadedTopics || window.allLoadedTopics.length === 0) {
    alert("Please wait a moment while the question files are loading...");
    return;
  }

  let combinedQuestions = [];
  window.allLoadedTopics.forEach(item => {
    combinedQuestions = combinedQuestions.concat(item.questions);
  });

  if (combinedQuestions.length === 0) {
    alert("No questions found to start a mock test.");
    return;
  }

  // Create a virtual topic for the mock test
  const mockTopic = {
    name: "Full Syllabus Mock Test",
    file: "mock_test_mixed",
    icon: "📝"
  };

  // Select this mock topic in the UI config box
  selectTopic(mockTopic, combinedQuestions, null);

  // Scroll to config box
  document.getElementById('configBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectTopic(topic, questions, cardEl) {
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
  if (cardEl) cardEl.classList.add('selected');

  state.selectedTopic = topic.name;
  state.selectedFile = topic.file;
  state.allQuestions = questions;

  document.getElementById('selectedTopicLabel').textContent = `${topic.icon} ${topic.name} (${questions.length} Qs)`;

  // Reset custom range values
  const rStart = document.getElementById('rangeStart');
  const rEnd = document.getElementById('rangeEnd');
  const rMaxLabel = document.getElementById('rangeMaxLabel');
  if (rStart && rEnd) {
    rStart.value = 1;
    rStart.max = questions.length;
    rEnd.value = Math.min(50, questions.length);
    rEnd.max = questions.length;
    if (rMaxLabel) {
      rMaxLabel.textContent = `(1 to ${questions.length})`;
    }
  }

  document.getElementById('configBox').style.display = 'block';
  document.getElementById('configBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearTopic() {
  state.selectedTopic = null;
  state.allQuestions = [];
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('configBox').style.display = 'none';
  document.getElementById('customRangeRow').style.display = 'none';
}

// ============ CONFIG BUTTONS ============
function initConfigButtons() {
  // Question count
  document.getElementById('qCountOptions').addEventListener('click', e => {
    if (!e.target.classList.contains('cfg-btn')) return;
    setActive('qCountOptions', e.target);
    const val = e.target.dataset.val;
    state.qCount = (val === 'all' || val === 'range') ? val : parseInt(val);
    document.getElementById('customRangeRow').style.display =
      val === 'range' ? 'flex' : 'none';
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

  // Slice first if custom range is selected
  if (state.qCount === 'range') {
    let startVal = parseInt(document.getElementById('rangeStart').value) || 1;
    let endVal = parseInt(document.getElementById('rangeEnd').value) || pool.length;

    // Boundary validations
    if (startVal < 1) startVal = 1;
    if (endVal > pool.length) endVal = pool.length;
    if (startVal > endVal) {
      const temp = startVal;
      startVal = endVal;
      endVal = temp;
    }

    pool = pool.slice(startVal - 1, endVal);
  }

  // Shuffle if random
  if (state.order === 'random') pool = shuffle(pool);

  // Limit count for static values
  if (state.qCount !== 'all' && state.qCount !== 'range') {
    pool = pool.slice(0, Math.min(state.qCount, pool.length));
  }

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
  diffEl.className = `q-difficulty ${(q.difficulty || 'medium').toLowerCase()}`;
  const impEl = document.getElementById('qImportant');
  impEl.style.display = q.important ? 'inline' : 'none';

  // Exam source
  const sourceEl = document.getElementById('qSource');
  if (sourceEl) {
    if (q.exam_source) {
      sourceEl.textContent = q.exam_source;
      sourceEl.style.display = 'inline';
    } else {
      sourceEl.style.display = 'none';
    }
  }

  // Question text
  document.getElementById('questionText').textContent = q.question;

  // Options
  const optList = document.getElementById('optionsList');
  optList.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D', 'E'];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="opt-label">${labels[i]}</span><span class="opt-text">${opt}</span>`;

    const existingAnswer = state.answers[idx];
    if (existingAnswer !== undefined) {
      btn.disabled = true;
      if (opt === q.answer) {
        btn.classList.add('correct');
      } else if (opt === existingAnswer) {
        if (opt.toLowerCase().includes('(e)')) {
          btn.classList.add('skipped-opt');
        } else {
          btn.classList.add('wrong');
        }
      }
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
    if (optText === q.answer) {
      b.classList.add('correct');
    } else if (b === clickedBtn) {
      if (optText.toLowerCase().includes('(e)')) {
        b.classList.add('skipped-opt');
      } else {
        b.classList.add('wrong');
      }
    }
  });

  state.answers[idx] = selectedOpt;
  state.skipped.delete(idx);

  if (state.mode !== 'exam') showReveal(q);

  document.getElementById('skipBtn').style.display = 'none';
  document.getElementById('scoreLive').textContent = `Score: ${calcLiveScore().toFixed(2)}`;

  const paletteStatus = selectedOpt === q.answer ? 'answered' : (selectedOpt.toLowerCase().includes('(e)') ? 'skipped' : 'wrong-ans');
  updatePalette(idx, paletteStatus);

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
  
  let html = '';
  if (q.explanation) {
    html += `<div class="reveal-explanation-section explanation"><strong>💡 Explanation:</strong> ${q.explanation}</div>`;
  }
  if (q.trap_point) {
    html += `<div class="reveal-explanation-section trap-point"><strong>⚠️ Trap Point:</strong> ${q.trap_point}</div>`;
  }
  if (q.memory_trick) {
    html += `<div class="reveal-explanation-section memory-trick"><strong>💡 Memory Trick:</strong> ${q.memory_trick}</div>`;
  }
  if (q.revision_fact || q.one_line_fact) {
    html += `<div class="reveal-explanation-section revision-fact"><strong>📋 Revision Fact:</strong> ${q.revision_fact || q.one_line_fact}</div>`;
  }
  if (q.technical_proof) {
    html += `<div class="reveal-explanation-section technical-proof"><strong>⚙️ Technical Proof:</strong> ${q.technical_proof}</div>`;
  }
  
  document.getElementById('revealExplanation').innerHTML = html || '<div class="reveal-explanation-section">No explanation available.</div>';
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
    const ans = state.answers[idx];
    if (ans === q.answer) {
      score += 1;
    } else if (ans.toLowerCase().startsWith('(e)')) {
      score += 0;
    } else {
      score -= (1/3);
    }
  });
  return score;
}

function calcResult() {
  let correct = 0;
  let wrong = 0;
  let skippedE = 0;
  let blank = 0;

  state.questions.forEach((q, idx) => {
    const ans = state.answers[idx];
    if (ans === undefined) {
      blank++;
    } else if (ans === q.answer) {
      correct++;
    } else if (ans.toLowerCase().startsWith('(e)')) {
      skippedE++;
    } else {
      wrong++;
    }
  });

  const total = state.questions.length;
  const score = correct - (wrong / 3) - (blank / 3);
  const attempted = correct + wrong + skippedE;
  const accuracy = (correct + wrong) > 0 ? (correct / (correct + wrong) * 100) : 0;
  const pct = (score / total) * 100;
  const blankPercentage = (blank / total) * 100;
  const disqualified = blankPercentage > 10;
  const pass = pct >= 40 && !disqualified;

  return { 
    total, 
    correct, 
    wrong, 
    skipped: skippedE + blank, 
    skippedE, 
    blank, 
    attempted, 
    score, 
    accuracy, 
    pct, 
    pass, 
    disqualified, 
    blankPercentage 
  };
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
  let emoji = r.pass ? '🎉' : (r.pct >= 30 ? '💪' : '😤');
  if (r.disqualified) {
    emoji = '🚫';
  }
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultScore').textContent = r.score.toFixed(2);

  const status = document.getElementById('resultStatus');
  if (r.disqualified) {
    status.textContent = `🚫 DISQUALIFIED (${r.blankPercentage.toFixed(1)}% Blank)`;
    status.className = 'result-status fail';
  } else {
    status.textContent = r.pass ? `✅ Qualified (${r.pct.toFixed(1)}%)` : `❌ Not Qualified (${r.pct.toFixed(1)}%)`;
    status.className = 'result-status ' + (r.pass ? 'pass' : 'fail');
  }

  document.getElementById('rTotal').textContent = r.total;
  document.getElementById('rCorrect').textContent = r.correct;
  document.getElementById('rWrong').textContent = r.wrong;
  document.getElementById('rSkipped').textContent = r.skipped;
  document.getElementById('rOptionE').textContent = r.skippedE;
  document.getElementById('rBlank').textContent = r.blank;
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
  const labels = ['A','B','C','D','E'];

  questions.forEach((q, idx) => {
    const userAns = answers[idx];
    let status = 'skipped';
    if (userAns !== undefined) {
      if (userAns === q.answer) {
        status = 'correct';
      } else if (userAns.toLowerCase().includes('(e)')) {
        status = 'skipped';
      } else {
        status = 'wrong';
      }
    }

    if (filter !== 'all' && filter !== status) return;

    const statusLabel = { correct: '✅ Correct', wrong: '❌ Wrong', skipped: '⏭ Skipped' }[status];

    let detailsHtml = '';
    if (q.explanation) {
      detailsHtml += `<div class="ri-detail-sec explanation"><strong>💡 Explanation:</strong> ${q.explanation}</div>`;
    }
    if (q.trap_point) {
      detailsHtml += `<div class="ri-detail-sec trap-point"><strong>⚠️ Trap Point:</strong> ${q.trap_point}</div>`;
    }
    if (q.memory_trick) {
      detailsHtml += `<div class="ri-detail-sec memory-trick"><strong>💡 Memory Trick:</strong> ${q.memory_trick}</div>`;
    }
    if (q.revision_fact || q.one_line_fact) {
      detailsHtml += `<div class="ri-detail-sec revision-fact"><strong>📋 Revision Fact:</strong> ${q.revision_fact || q.one_line_fact}</div>`;
    }
    if (q.technical_proof) {
      detailsHtml += `<div class="ri-detail-sec technical-proof"><strong>⚙️ Technical Proof:</strong> ${q.technical_proof}</div>`;
    }

    const item = document.createElement('div');
    item.className = `review-item ${status}`;
    item.innerHTML = `
      <div class="ri-head">
        <span class="ri-status ${status}">${statusLabel}</span>
        <span style="font-size:12px;color:var(--text-muted)">Q${idx+1}</span>
        ${q.exam_source ? `<span class="ri-source-tag">${q.exam_source}</span>` : ''}
      </div>
      <div class="ri-qtext">${q.question}</div>
      <div class="ri-options">
        ${q.options.map((opt, i) => {
          let cls = '';
          if (opt === q.answer) cls = 'correct-opt';
          else if (opt === userAns) {
            cls = opt.toLowerCase().includes('(e)') ? 'skipped-opt' : 'wrong-opt';
          }
          return `<div class="ri-opt ${cls}">${labels[i]}. ${opt}</div>`;
        }).join('')}
      </div>
      ${detailsHtml ? `<div class="ri-details">${detailsHtml}</div>` : ''}
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

// ============ THEME MANAGEMENT ============
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add('dark');
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) toggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) toggleBtn.textContent = '🌙';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
    toggleBtn.style.transform = 'scale(1.2) rotate(360deg)';
    setTimeout(() => {
      toggleBtn.style.transform = '';
    }, 300);
  }
}

// ============ INIT ============
function init() {
  initTheme();
  showScreen('home');
  loadTopics();
  initConfigButtons();
  loadBookmarks();
}

document.addEventListener('DOMContentLoaded', init);
