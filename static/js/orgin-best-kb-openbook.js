// ================= 摊开式数学书 =================
const OB_DATA_URL = 'static/data/knowledges.json';
const OB_KEYS = ['knowledge-level1','knowledge-level2','knowledge-level3','knowledge-level4'];
const OB_KP = '知识点';
const OB_CP = '考点';

let obChapters = []; // [{name, treeRoot}]
let obCurrent = 0;
let obCurrentNode = null;

async function obLoad(){
  const res = await fetch(OB_DATA_URL);
  const rows = await res.json();

  // group by level1
  const byL1 = new Map();
  for(const r of rows){
    const l1 = (r[OB_KEYS[0]]||'(未分类)').trim();
    if(!byL1.has(l1)) byL1.set(l1, []);
    byL1.get(l1).push(r);
  }
  // 取全部或前4个都行，这里按你的数据一般是4个
  obChapters = [...byL1.entries()].map(([name, list]) => ({
    name, treeRoot: obBuildTree(list)
  }));
}

function obBuildTree(rows){
  const root = {};
  for(const r of rows){
    const path = OB_KEYS.slice(1).map(k => (r[k]||'').trim()); // L2-L4
    const kp = (r[OB_KP]||'').trim();
    const cp = (r[OB_CP]||'').trim();

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

function obRenderTOC(){
  const toc = document.getElementById('kbObToc');
  toc.innerHTML = '';
  obChapters.forEach((ch, i)=>{
    const pill = document.createElement('div');
    pill.className = 'pill' + (i===obCurrent?' active':'');
    pill.textContent = ch.name;
    pill.addEventListener('click', ()=>obGoto(i));
    toc.appendChild(pill);
  });
}

function obRenderSpread(){
  // 左页标题
  document.getElementById('kbObLeftTitle').textContent = `第 ${obCurrent+1} 章 · ${obChapters[obCurrent].name}`;
  // 树
  const treeWrap = document.getElementById('kbObTree');
  obRenderTree(treeWrap, obChapters[obCurrent].treeRoot, {openDepth:2, keyword:''});
  // 右页重置
  obCurrentNode = null;
  document.getElementById('kbObDetail').innerHTML = '';
  document.getElementById('kbObHint').style.display = '';
}

function obRenderTree(container, data, {openDepth=2, keyword=''} = {}){
  container.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'kb-ob-tree';

  const createNode = (name, node, level) => {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'kb-ob-node';

    const toggle = document.createElement('div');
    toggle.className = 'kb-ob-toggle';
    toggle.textContent = '›';

    const hasChildren = node.children && Object.keys(node.children).length;
    const hasKPs = node.kps && node.kps.size;
    if(!hasChildren && !hasKPs) toggle.classList.add('is-leaf');

    const label = document.createElement('span');
    label.className = 'kb-ob-label';
    label.textContent = name;
    if(keyword && name.toLowerCase().includes(keyword.toLowerCase())){
      label.classList.add('hit');
    }

    row.appendChild(toggle);
    row.appendChild(label);
    li.appendChild(row);

    const kids = document.createElement('div');
    kids.className = 'kb-ob-children';
    kids.style.display = 'none';
    li.appendChild(kids);

    let opened = false;
    const open = ()=>{
      if(opened) return;
      opened = true;
      toggle.textContent = '⌄';
      kids.style.display = '';

      if(hasChildren){
        const sub = document.createElement('ul');
        sub.className = 'kb-ob-tree';
        Object.entries(node.children).sort().forEach(([n, nd])=>{
          sub.appendChild(createNode(n, nd, level+1));
        });
        kids.appendChild(sub);
      }
      if(hasKPs){
        // 在左页也简单预览 KP 数
        const cnt = document.createElement('div');
        cnt.style.cssText = 'margin:4px 0 0 0; color:#7aa6be; font-size:12px;';
        cnt.textContent = `知识点 ${node.kps.size} 个`;
        kids.appendChild(cnt);
      }
    };
    const close = ()=>{
      opened = false;
      toggle.textContent = '›';
      kids.style.display = 'none';
      kids.innerHTML = '';
    };

    row.addEventListener('click', ()=>{
      // 点击标签：右页渲染详情
      obCurrentNode = node;
      obRenderRight(node);
      // 同时展开/收起
      opened ? close() : open();
    });
    toggle.addEventListener('click', (e)=>{ e.stopPropagation(); opened ? close() : open(); });

    if(level <= openDepth) open();
    return li;
  };

  const level2 = data.children ? Object.entries(data.children).sort() : [];
  level2.forEach(([name, node])=>{
    ul.appendChild(createNode(name, node, 2));
  });
  container.appendChild(ul);

  // 搜索
  const input = document.getElementById('kbObSearch');
  if(input){
    let t=null;
    input.oninput = e=>{
      clearTimeout(t);
      t=setTimeout(()=>{
        obRenderTree(container, data, {openDepth: e.target.value?5:2, keyword: e.target.value.trim()});
      },160);
    };
  }
}

function obRenderRight(node){
  const detail = document.getElementById('kbObDetail');
  const hint = document.getElementById('kbObHint');
  hint.style.display = 'none';
  detail.innerHTML = '';

  if(!(node && node.kps && node.kps.size)){
    detail.innerHTML = '<div style="color:#8aa6b8;">此节点暂无知识点</div>';
    return;
  }

  node.kps.forEach((cpSet, kpName)=>{
    const blk = document.createElement('div');
    blk.className = 'kb-ob-kp-block';

    const title = document.createElement('div');
    title.className = 'kb-ob-kp-title';
    title.textContent = kpName;
    blk.appendChild(title);

    let i = 0;
    const MAX = 24; // 右页展示更多些
    cpSet.forEach(cp=>{
      if(i<MAX){
        const chip = document.createElement('span');
        chip.className = 'kb-ob-chip';
        chip.textContent = cp;
        blk.appendChild(chip);
      }
      i++;
    });
    const overflow = cpSet.size - Math.min(cpSet.size, MAX);
    if(overflow>0){
      const more = document.createElement('span');
      more.className = 'kb-ob-chip';
      more.textContent = `+${overflow}`;
      blk.appendChild(more);
    }
    detail.appendChild(blk);
  });
}

/* 章节切换 */
function obGoto(index){
  obCurrent = Math.max(0, Math.min(index, obChapters.length-1));
  obUpdateNav();
  obRenderTOC();
  obRenderSpread();
}
function obUpdateNav(){
  document.getElementById('kbObPrev').disabled = obCurrent===0;
  document.getElementById('kbObNext').disabled = obCurrent===obChapters.length-1;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await obLoad();
  if(!obChapters.length){
    document.getElementById('kbObToc').innerHTML = '<div class="pill">暂无数据</div>';
    return;
  }
  obRenderTOC();
  obRenderSpread();
  obUpdateNav();

  document.getElementById('kbObPrev').addEventListener('click', ()=>obGoto(obCurrent-1));
  document.getElementById('kbObNext').addEventListener('click', ()=>obGoto(obCurrent+1));
});
