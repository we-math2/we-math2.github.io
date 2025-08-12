let knowledges = [];
let questions = [];

const LEVEL_NAMES = [
  "knowledge-level1",
  "knowledge-level2",
  "knowledge-level3",
  "knowledge-level4",
  "知识点",
  "考点"
];
const LEVEL_LABELS = {
  "knowledge-level1": "一级分类",
  "knowledge-level2": "二级分类",
  "knowledge-level3": "三级分类",
  "knowledge-level4": "四级分类",
  "知识点": "知识点",
  "考点": "考点"
};
const MAX_DISPLAY = 40;

function fetchData() {
  return Promise.all([
    fetch('static/data/knowledges.json').then(r => r.json()),
    fetch('static/data/questions.json').then(r => r.json())
  ]).then(([k, q]) => {
    knowledges = k;
    questions = q;
    renderAlwaysShowCascader([]);
  });
}

function renderAlwaysShowCascader(selectedValues = []) {
  let cascaderBox = document.getElementById('cascader-box');
  cascaderBox.innerHTML = '';
  let filterData = knowledges.slice();

  for (let i = 0; i < LEVEL_NAMES.length; i++) {
    let arr = knowledges.slice();
    for (let j = 0; j < i; j++) {
      if (selectedValues[j]) arr = arr.filter(item => item[LEVEL_NAMES[j]] === selectedValues[j]);
    }
    let opts = Array.from(new Set(arr.map(x => x[LEVEL_NAMES[i]]).filter(v => v && v.trim() !== "")));
    if (opts.length === 0) continue;
    let row = document.createElement('div');
    row.className = 'cascader-row';
    let label = document.createElement('label');
    label.textContent = LEVEL_LABELS[LEVEL_NAMES[i]];
    let select = document.createElement('select');
    select.id = `cascader-${i}`;
    select.setAttribute('data-lvl', LEVEL_NAMES[i]);
    select.innerHTML = `<option value="">请选择${LEVEL_LABELS[LEVEL_NAMES[i]]}</option>`;
    opts.forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`);
    select.value = selectedValues[i] || '';
    select.onchange = () => {
      let newSelected = selectedValues.slice(0, i);
      newSelected[i] = select.value;
      renderAlwaysShowCascader(newSelected);
      showQuestionsByPartialCascader(newSelected);
    };
    row.appendChild(label);
    row.appendChild(select);
    cascaderBox.appendChild(row);
    if (selectedValues[i]) filterData = filterData.filter(item => item[LEVEL_NAMES[i]] === selectedValues[i]);
  }
  showQuestionsByPartialCascader(selectedValues);
}

function showQuestionsByPartialCascader(selectedValues) {
  let filtered = questions.slice();
  for (let i = 0; i < selectedValues.length; i++) {
    if (selectedValues[i]) {
      let colName = LEVEL_NAMES[i] === "知识点" || LEVEL_NAMES[i] === "考点" ? LEVEL_NAMES[i] : null;
      if (colName && filtered.length) {
        filtered = filtered.filter(q => q[colName] === selectedValues[i]);
      } else if (filtered.length && LEVEL_NAMES[i] !== "知识点" && LEVEL_NAMES[i] !== "考点") {
        let subKnowledges = knowledges.filter(item => {
          for (let j = 0; j <= i; j++) {
            if (selectedValues[j] && item[LEVEL_NAMES[j]] !== selectedValues[j]) return false;
          }
          return true;
        });
        let validKPs = Array.from(new Set(subKnowledges.map(x => x["知识点"]).filter(Boolean)));
        let validCPs = Array.from(new Set(subKnowledges.map(x => x["考点"]).filter(Boolean)));
        filtered = filtered.filter(q => (!validKPs.length || validKPs.includes(q["知识点"])) && (!validCPs.length || validCPs.includes(q["考点"])));
      }
    }
  }
  renderQuestions(filtered);
}

function renderQuestions(qs){
  const box = document.getElementById('questions-list');
  if(qs.length === 0) {
    box.innerHTML = "<div>暂无相关题目</div>";
    return;
  }
  let showList = qs.slice(0, MAX_DISPLAY);
  let note = qs.length > MAX_DISPLAY ? `<div style="color:#aaa;margin-bottom:10px;">仅展示前${MAX_DISPLAY}道题，共${qs.length}题</div>` : "";
  box.innerHTML = note + showList.map(q=>`
    <div class="kp-question-card">
      <img class="kp-question-img" src="static/images/${q['图片路径']}" onerror="this.style.display='none'">
      <div class="kp-question-body">
        <div class="kp-question-title">${q['题干']}</div>
        <div class="kp-question-answer">答案：${q['答案']}</div>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', function(){
  const input = document.getElementById('search-input');
  if(!input) return;
  input.addEventListener('input', function(e){
    const kw = e.target.value.trim();
    if(!kw){
      document.getElementById('questions-list').innerHTML = "请选择知识点和考点，或使用上方搜索";
      return;
    }
    const result = questions.filter(q=>
      q['题干'].includes(kw) ||
      q['知识点'].includes(kw) ||
      q['考点'].includes(kw)
    );
    renderQuestions(result);
  });
});

fetchData();
