// ======= 书本式知识体系 =======
const DATA_URL = 'static/data/knowledges.json';
const LV_KEYS = ['knowledge-level1','knowledge-level2','knowledge-level3','knowledge-level4'];
const KP_KEY = '知识点';
const CP_KEY = '考点';

let chapters = [];      // [{ name, treeRoot }]
let currentIndex = 0;

// 读取并按 L1 分章
async function loadChapters(){
  const res = await fetch(DATA_URL);
  const rows = await res.json();

  // group by L1
  const byL1 = new Map();
  for(const r of rows){
    const l1 = (r[LV_KEYS[0]] || '(未分类)').trim();
    if(!byL1.has(l1)) byL1.set(l1, []);
    byL1.get(l1).push(r);
  }
  // 只取前4个（如果正好4个就全取）
  const entries = [...byL1.entries()].slice(0,4);

  chapters = entries.map(([name, list])=>{
    return { name, treeRoot: buildTree(list) };
  });
}

// 把某 L1 下的数据构造成层级树
function buildTree(rows){
  const root = {};
  for(const r of rows){
    const path = LV_KEYS.slice(1).map(k => (r[k]||'').trim()); // 从 L2 开始
    const kp = (r[KP_KEY]||'').trim();
    const cp = (r[CP_KEY]||'').trim();

    let cur = root;
    path.forEach((name)=>{
      const key = name || '(未分类)';
      cur.children ??= {};
      cur.children[key] ??= {};
      cur = cur.children[key];
    });

    if(kp){
      cur.kps ??= new Map();
      if(!cur.kps.has(kp)) cur.kps.set(kp, new Set());
      if(cp) cur.kps.get(kp).add(cp);
    }
  }
  return root;
}

// 渲染整本书
function renderBook(){
  const toc = document.getElementById('kbBookToc');
  const pages = document.getElementById('kbBookPages');

  // TOC pills
  toc.innerHTML = '';
  chapters.forEach((ch, i)=>{
    const pill = document.createElement('div');
    pill.className = 'kb-toc-pill' + (i===currentIndex?' active':'');
    pill.textContent = ch.name;
    pill.addEventListener('click', ()=>goTo(i));
    toc.appendChild(pill);
  });

  // Pages
  pages.innerHTML = '';
  chapters.forEach((ch, i)=>{
    const page = document.createElement('div');
    page.className = 'kb-page';

    // 页头：标题+检索
    const head = document.createElement('div');
    head.className = 'kb-page-head';

    const title = document.createElement('div');
    title.className = 'kb-page-title';
    title.textContent = `第 ${i+1} 章 · ${ch.name}`;

    const search = document.createElement('input');
    search.className = 'kb-search';
    search.placeholder = '在本章内搜索层级/知识点/考点…';

    head.appendChild(title);
    head.appendChild(search);
    page.appendChild(head);

    // 树容器
    const treeWrap = document.createElement('div');
    page.appendChild(treeWrap);

    // 渲染树
    renderTree(treeWrap, ch.treeRoot, { baseLevel: 2, openDepth: 2, keyword: '' });

    // 章节内搜索
    let t = null;
    search.addEventListener('input', e=>{
      clearTimeout(t);
      t = setTimeout(()=>{
        const kw = (e.target.value||'').trim();
        renderTree(treeWrap, ch.treeRoot, { baseLevel: 2, openDepth: kw?5:2, keyword: kw });
      },160);
    });

    pages.appendChild(page);
  });

  updateViewport();
  updateNavButtons();
  updateTocActive();
}

// 渲染树（类似你之前的 chips 方案，缩小一点）
function renderTree(container, data, { baseLevel=2, openDepth=2, keyword='' } = {}){
  container.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'kb-tree';

  const createNode = (name, node, level) => {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = `kb-node kb-level-${level}`;

    const toggle = document.createElement('div');
    toggle.className = 'kb-toggle';
    toggle.textContent = '›';

    const hasChildren = node.children && Object.keys(node.children).length;
    const hasKPs = node.kps && node.kps.size;
    if(!hasChildren && !hasKPs) toggle.classList.add('is-leaf');

    const label = document.createElement('span');
    label.className = 'kb-label';
    label.textContent = name;

    const meta = document.createElement('span');
    meta.className = 'kb-meta';
    const childCount = hasChildren ? Object.keys(node.children).length : 0;
    const kpCount = hasKPs ? node.kps.size : 0;
    const cpCount = hasKPs ? [...node.kps.values()].reduce((a,s)=>a+s.size,0) : 0;
    meta.textContent = [
      childCount ? `${childCount} 类` : null,
      kpCount ? `${kpCount} 知识点` : null,
      cpCount ? `${cpCount} 考点` : null
    ].filter(Boolean).join(' · ') || '—';

    if(keyword){
      const kw = keyword.toLowerCase();
      if(name.toLowerCase().includes(kw)) label.classList.add('kb-hit');
    }

    row.appendChild(toggle);
    row.appendChild(label);
    row.appendChild(meta);
    li.appendChild(row);

    const kids = document.createElement('div');
    kids.className = 'kb-children';
    kids.style.display = 'none';
    li.appendChild(kids);

    let opened = false;
    const open = () => {
      if(opened) return;
      opened = true;
      toggle.textContent = '⌄';
      kids.style.display = '';

      if(hasChildren){
        const subUl = document.createElement('ul');
        subUl.className = 'kb-tree';
        Object.entries(node.children).sort().forEach(([childName, childNode])=>{
          subUl.appendChild(createNode(childName, childNode, Math.min(level+1,4)));
        });
        kids.appendChild(subUl);
      }
      if(hasKPs){
        node.kps.forEach((cpSet, kpName)=>{
          const line = document.createElement('div');
          line.className = 'kb-kp-line';
          const kpSpan = document.createElement('span');
          kpSpan.className = 'kb-label';
          kpSpan.textContent = kpName;
          if(keyword && kpName.toLowerCase().includes(keyword.toLowerCase())){
            kpSpan.classList.add('kb-hit');
          }
          line.appendChild(kpSpan);

          // 展示最多10个考点，多的折叠为 +N
          const chipsMax = 10;
          let i = 0;
          cpSet.forEach(cp=>{
            if(keyword && !cp.toLowerCase().includes(keyword.toLowerCase())){
              if(!kpName.toLowerCase().includes(keyword.toLowerCase())) return;
            }
            if(i < chipsMax){
              const chip = document.createElement('span');
              chip.className = 'kb-chip';
              chip.textContent = cp;
              line.appendChild(chip);
            }
            i++;
          });
          const overflow = cpSet.size - Math.min(cpSet.size, chipsMax);
          if(overflow > 0){
            const more = document.createElement('span');
            more.className = 'kb-chip';
            more.textContent = `+${overflow}`;
            line.appendChild(more);
          }

          kids.appendChild(line);
        });
      }
    };
    const close = () => {
      opened = false;
      toggle.textContent = '›';
      kids.style.display = 'none';
      kids.innerHTML = '';
    };

    row.addEventListener('click', ()=> opened ? close() : open());
    if(level - baseLevel + 1 <= openDepth) open();
    return li;
  };

  const level2 = data.children ? Object.entries(data.children).sort() : [];
  level2.forEach(([name, node])=>{
    ul.appendChild(createNode(name, node, 2));
  });
  container.appendChild(ul);
}

// 翻页 & TOC
function goTo(index){
  currentIndex = Math.max(0, Math.min(index, chapters.length-1));
  updateViewport();
  updateNavButtons();
  updateTocActive();
}
function updateViewport(){
  const pages = document.getElementById('kbBookPages');
  pages.style.transform = `translateX(${-100*currentIndex}%)`;
}
function updateNavButtons(){
  document.getElementById('kbBookPrev').disabled = currentIndex === 0;
  document.getElementById('kbBookNext').disabled = currentIndex === chapters.length-1;
}
function updateTocActive(){
  const pills = document.querySelectorAll('.kb-toc-pill');
  pills.forEach((p, i)=> p.classList.toggle('active', i===currentIndex));
}

// 绑定左右按钮
function wireNav(){
  document.getElementById('kbBookPrev').addEventListener('click', ()=>goTo(currentIndex-1));
  document.getElementById('kbBookNext').addEventListener('click', ()=>goTo(currentIndex+1));
}

// 启动
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadChapters();
  if(!chapters.length){
    document.getElementById('kbBookPages').innerHTML = '<div class="kb-page"><div class="kb-page-title">暂无数据</div></div>';
    return;
  }
  renderBook();
  wireNav();
});
