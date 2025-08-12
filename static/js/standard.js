/* static/js/standard.js
 * 数据源：/static/data/standard_knowledge.json
 * 功能：中英文切换；仅显示当前语言字段；级联自动跳过空层；
 *      题卡含 KP/Principle 标签；Question/Answer 标签随语言切换。
 */

// ===== 配置 =====
const DATA_URL = 'static/data/standard_knowledge.json';
const MAX_DISPLAY = 40;

// ===== 状态 =====
let RAW = [];                 // 原始数组（每行=一道题）
let STD_LANG = 'en';          // 'en' | 'cn'（默认英文）
let selections = {};          // {L1,L2,L3,L4,KP,PR}
let lastKeyword = '';

// ===== DOM 快捷 =====
const qs = (s) => document.querySelector(s);

// ===== 文案 =====
const I18N = {
  en: {
    title: 'Problem Retrieval',
    hint:  'Tip: Select from the left to narrow to specific knowledge points & principles.',
    filters: 'Filters',
    searchPh: 'Search problems / knowledge / principles…',
    empty: 'Please pick knowledge/principle on the left or search above',
    answer: 'Answer',
    qLabel: 'Question',
    tag: { kp: 'Knowledge', pr: 'Principle' },
    listNote: (n, total) => `Showing first ${n} of ${total}`
  },
  cn: {
    title: '题库检索',
    hint:  '可从左侧逐级筛选到具体的知识点与知识原理，或直接搜索。',
    filters: '筛选',
    searchPh: '搜索题目 / 知识点 / 知识原理…',
    empty: '请选择知识点和知识原理，或使用上方搜索',
    answer: '答案',
    qLabel: '题目',
    tag: { kp: '知识点', pr: '知识原理' },
    listNote: (n, total) => `仅展示前 ${n} 题，共 ${total} 题`
  }
};

// 当前语言字段映射（不回退）
function F() {
  const isEn = STD_LANG === 'en';
  return {
    L1: isEn ? 'knowledge-level1_en' : 'knowledge-level1',
    L2: isEn ? 'knowledge-level2_en' : 'knowledge-level2',
    L3: isEn ? 'knowledge-level3_en' : 'knowledge-level3',
    L4: isEn ? 'knowledge-level4_en' : 'knowledge-level4',
    KP: isEn ? 'knowledge_en'       : 'knowledge',
    PR: isEn ? 'principle_en'       : 'principle',
    Q:  isEn ? 'question_en'        : 'question',
    A:  isEn ? 'answer_en'          : 'answer',
    IMG_CN: '图片路径' // 图片字段只有中文键名
  };
}

// 取值（去 NaN/空）
function getVal(row, key) {
  const v = row[key];
  if (v === undefined || v === null) return '';
  if (typeof v === 'number' && Number.isNaN(v)) return '';
  return String(v).trim();
}

// 稳定加载（防缓存 + 清理 NaN）
async function safeLoadJSON(url){
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), {
    cache: 'no-store'
  });
  if(!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const txt = await res.text();
  const cleaned = txt.replace(/\bNaN\b/g, 'null');
  return JSON.parse(cleaned);
}

// ===== 加载入口 =====
async function fetchData() {
  try {
    RAW = await safeLoadJSON(DATA_URL);
    console.log('[standard] loaded items:', RAW.length);
  } catch (e) {
    console.error(e);
    RAW = [];
    const box = document.getElementById('questions-list');
    if (box) {
      box.innerHTML = `<div class="empty-note" style="color:#c33;">
        ${STD_LANG==='en' ? 'Data load failed. Please check JSON path.' : '数据加载失败，请检查 JSON 路径。'}
      </div>`;
    }
  }

  renderCascader({});
  renderQuestions([]);
  syncLangTexts();
}

// ===== 级联（自动跳过空层） =====
function renderCascader(preset = {}) {
  selections = { ...preset };
  const box = document.getElementById('cascader-box');
  if(!box) return;
  box.innerHTML = '';

  const f = F();
  const layers = [
    { key: 'L1', label_en: 'Level 1', label_cn: '一级分类' },
    { key: 'L2', label_en: 'Level 2', label_cn: '二级分类' },
    { key: 'L3', label_en: 'Level 3', label_cn: '三级分类' },
    { key: 'L4', label_en: 'Level 4', label_cn: '四级分类' },
    { key: 'KP', label_en: 'Knowledge', label_cn: '知识点' },
    { key: 'PR', label_en: 'Principle', label_cn: '知识原理' }
  ];

  let cand = RAW.slice();
  function applySelectionsUpTo(layerIndex) {
    const fkeys = [f.L1, f.L2, f.L3, f.L4, f.KP, f.PR];
    const order = ['L1','L2','L3','L4','KP','PR'];
    cand = RAW.slice();
    for (let i = 0; i <= layerIndex; i++) {
      const lvKey = order[i];
      const field = fkeys[i];
      const val = selections[lvKey] || '';
      if (val) cand = cand.filter(r => getVal(r, field) === val);
    }
  }

  layers.forEach((lv, idx) => {
    applySelectionsUpTo(idx-1);
    const field = F()[lv.key];

    const opts = Array.from(new Set(
      cand.map(r => getVal(r, field)).filter(v => v !== '')
    ));

    if (!opts.length) {
      if (selections[lv.key]) delete selections[lv.key];
      return;
    }

    const row = document.createElement('div');
    row.className = 'cascader-row';

    const label = document.createElement('label');
    label.textContent = (STD_LANG === 'en' ? lv.label_en : lv.label_cn);

    const sel = document.createElement('select');
    sel.className = 'cascader-select';
    sel.innerHTML =
      `<option value="">${STD_LANG==='en'?'All':'全部'}</option>` +
      opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    sel.value = selections[lv.key] || '';

    sel.onchange = () => {
      const val = sel.value;
      selections[lv.key] = val || '';
      for (let j = idx+1; j < layers.length; j++) delete selections[layers[j].key];
      renderCascader(selections);
      runSearchOrFilter();
    };

    row.appendChild(label);
    row.appendChild(sel);
    box.appendChild(row);
  });
}

// ===== 过滤 & 搜索 =====
function runSearchOrFilter() {
  const f = F();
  const kw = (lastKeyword || '').trim().toLowerCase();

  let list = RAW.filter(row => {
    if (selections.L1 && getVal(row, f.L1) !== selections.L1) return false;
    if (selections.L2 && getVal(row, f.L2) !== selections.L2) return false;
    if (selections.L3 && getVal(row, f.L3) !== selections.L3) return false;
    if (selections.L4 && getVal(row, f.L4) !== selections.L4) return false;
    if (selections.KP && getVal(row, f.KP) !== selections.KP) return false;
    if (selections.PR && getVal(row, f.PR) !== selections.PR) return false;

    if (!kw) return true;

    const hay = [
      getVal(row, f.Q),
      getVal(row, f.KP),
      getVal(row, f.PR)
    ].join(' ').toLowerCase();
    return hay.includes(kw);
  });

  renderQuestions(list);
}

// ===== 渲染题目卡片 =====
function renderQuestions(rows) {
  const box = document.getElementById('questions-list');
  if(!box) return;
  const f = F();
  const t = I18N[STD_LANG];

  if (!rows || rows.length === 0) {
    box.innerHTML = `<div class="empty-note">${t.empty}</div>`;
    return;
  }

  const show = rows.slice(0, MAX_DISPLAY);
  const more = rows.length - show.length;
  const note = more > 0
    ? `<div class="list-note">${t.listNote(MAX_DISPLAY, rows.length)}</div>`
    : '';

  box.innerHTML = note + show.map(r => {
    const q  = getVal(r, f.Q) || '—';
    const a  = getVal(r, f.A) || '—';
    const kp = getVal(r, f.KP) || '—';
    const pr = getVal(r, f.PR) || '—';
    const img = getVal(r, f.IMG_CN);

    return `
      <div class="kp-question-card">
        ${img ? `<img class="kp-question-img" src="static/images/${escapeHtml(img)}" onerror="this.style.display='none'">` : ''}
        <div class="kp-question-body">
          <div class="kp-tags">
            <span class="kp-chip kp-chip-k">${escapeHtml(I18N[STD_LANG].tag.kp)} · ${escapeHtml(kp)}</span>
            <span class="kp-chip kp-chip-p">${escapeHtml(I18N[STD_LANG].tag.pr)} · ${escapeHtml(pr)}</span>
          </div>
          <div class="kp-question-title">
            <span class="q-label">${I18N[STD_LANG].qLabel}${STD_LANG==='en'?':':'：'}</span>${escapeHtml(q)}
          </div>
          <div class="kp-question-answer">${t.answer}${STD_LANG==='en'?':':'：'}${escapeHtml(a)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== 事件绑定 & 语言切换 =====
function wireEvents() {
  const btnEn = document.getElementById('stdLangEn');
  const btnCn = document.getElementById('stdLangCn');
  if (btnEn && btnCn) {
    btnEn.onclick = () => {
      if (STD_LANG !== 'en') {
        STD_LANG = 'en';
        selections = {};
        lastKeyword = '';
        syncLangTexts();
        renderCascader({});
        runSearchOrFilter();
      }
    };
    btnCn.onclick = () => {
      if (STD_LANG !== 'cn') {
        STD_LANG = 'cn';
        selections = {};
        lastKeyword = '';
        syncLangTexts();
        renderCascader({});
        runSearchOrFilter();
      }
    };
  }

  const input = document.getElementById('search-input');
  if (input) {
    input.placeholder = I18N[STD_LANG].searchPh;
    let t = null;
    input.addEventListener('input', e => {
      clearTimeout(t);
      t = setTimeout(() => {
        lastKeyword = e.target.value.trim();
        runSearchOrFilter();
      }, 160);
    });
  }
}

// 顶栏文案 / 按钮态
function syncLangTexts() {
  const t = I18N[STD_LANG];

  const root = document.getElementById('standard');
  if (root) root.setAttribute('data-lang', STD_LANG);

  const title  = document.getElementById('stdTitle');
  const hint   = document.getElementById('stdSubHint');
  const filterT= document.getElementById('filterTitle');
  const input  = document.getElementById('search-input');

  if (title)   title.textContent   = t.title;
  if (hint)    hint.textContent    = t.hint;
  if (filterT) filterT.textContent = t.filters;
  if (input)   input.placeholder   = t.searchPh;

  const btnEn = document.getElementById('stdLangEn');
  const btnCn = document.getElementById('stdLangCn');
  if (btnEn && btnCn) {
    btnEn.classList.toggle('active', STD_LANG === 'en');
    btnCn.classList.toggle('active', STD_LANG === 'cn');
  }
}

// ===== 小工具 =====
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', async ()=>{
  wireEvents();
  syncLangTexts();
  await fetchData();
});