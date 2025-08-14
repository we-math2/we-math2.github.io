// ============== 数据源 ==============
const KB_DATA_URL = 'static/data/knowledge_tree_v2.json';

// ============== 状态 ==============
let kbData = null;
let kbLang = 'en';            // 'en' | 'cn'
let kbChapters = [];          // L1 list
let kbCurrent = 0;            // 当前章
let kbCurrentKP = null;       // 当前选中对象：KnowledgePoint 或 层节点（null 表示未选）

// ============== 工具：中/英字段 ==============
const nameOf = (obj) => (!obj ? '' : (kbLang==='en' ? (obj.name_en||obj.name_cn) : (obj.name_cn||obj.name_en)) || '');
const descOf  = (obj) => (!obj ? '' : (kbLang==='en' ? (obj.desc_en || obj.desc_cn) : (obj.desc_cn || obj.desc_en)) || '');

// 标题统一入口（保留，可在需要时手动调用）
function kbSetRightTitle(mode, scopeName){
  const title = document.getElementById('kbObRightTitle');
  if(!title) return;
  if(mode === 'agg'){
    title.textContent = kbLang==='en'
      ? `All KnowledgePoints under “${scopeName}”`
      : `“${scopeName}” 下的全部知识点`;
  } else {
    title.textContent = kbLang==='en'
      ? 'KnowledgePoint · Principles'
      : '知识点 · 知识原理';
  }
}

// ============== 加载 ==============
async function kbLoad(){
  const res = await fetch(KB_DATA_URL);
  kbData = await res.json();
  kbChapters = kbData?.chapters || [];
}

// ============== 事件 & 启动 ==============
function kbInitEvents(){
  const btnCn = document.getElementById('kbLangCn');
  const btnEn = document.getElementById('kbLangEn');

  const syncLangBtn = () => {
    // 切换按钮选中态
    if(btnCn) btnCn.classList.toggle('active', kbLang==='cn');
    if(btnEn) btnEn.classList.toggle('active', kbLang==='en');

    // 把当前语言写到容器 data-lang 上，触发字体/语言相关样式
    const root = document.querySelector('.kb-openbook');
    if(root) root.setAttribute('data-lang', kbLang);

    // 搜索框占位
    const s = document.getElementById('kbObSearch');
    if(s) s.placeholder = kbLang==='en' ? 'Search in chapter…' : '章节内搜索…';

    // 左侧引导/提示行
    const hint = document.getElementById('kbObHint');
    if(hint){
      hint.textContent = kbLang==='en'
        ? 'Select a node on the left to view its knowledge points and principles.'
        : '从左侧选择节点查看其下的知识点与知识原理';
    }

    const guide = document.getElementById('kbObGuide');
    if(guide){
      guide.textContent = kbLang==='en'
        ? 'Tip: Narrow the scope by selecting nodes on the left (L1–L4) or a knowledge point.'
        : '提示：可从左侧选择 L1–L4 层或具体知识点，以缩小右侧展示范围';
    }

    // ★ 关键：切语言后按“当前所处模式”重渲右侧（标题/内容一起更新）
    kbRefreshRight();
  };

  if(btnCn) btnCn.addEventListener('click', ()=>{ kbLang='cn'; syncLangBtn(); kbRerenderAll(true); });
  if(btnEn) btnEn.addEventListener('click', ()=>{ kbLang='en'; syncLangBtn(); kbRerenderAll(true); });
  syncLangBtn();

  // 翻章
  const prev = document.getElementById('kbObPrev');
  const next = document.getElementById('kbObNext');
  if(prev) prev.addEventListener('click', ()=>kbGoto(kbCurrent-1));
  if(next) next.addEventListener('click', ()=>kbGoto(kbCurrent+1));

  // 搜索（左页树内搜索）
  const input = document.getElementById('kbObSearch');
  if(input){
    let t=null;
    input.oninput = e=>{
      clearTimeout(t);
      t=setTimeout(()=> kbRenderTree(e.target.value.trim()), 160);
    };
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await kbLoad();
  if(!kbChapters.length){
    const toc = document.getElementById('kbObToc');
    if (toc) toc.innerHTML = '<div class="pill">No data</div>';
    return;
  }
  kbInitEvents();
  kbRenderTOC();
  kbRenderSpread();
  kbUpdateNav();
  // 初始状态：右侧聚合展示当前章节
  kbRenderRightAgg(kbChapters[kbCurrent]);
});

// ============== 渲染全量 ==============
function kbRerenderAll(keepRight=false){
  kbRenderTOC();
  kbRenderSpread();
  kbUpdateNav();
  if(!keepRight){
    // 若不保留右侧，可解开下一行
    // kbRenderRightAgg(kbChapters[kbCurrent]);
  }
}

// ============== 顶部章节条 ==============
function kbRenderTOC(){
  const toc = document.getElementById('kbObToc');
  if(!toc) return;
  toc.innerHTML = '';
  kbChapters.forEach((ch, i)=>{
    const pill = document.createElement('div');
    pill.className = 'pill' + (i===kbCurrent?' active':'');
    pill.textContent = nameOf(ch);
    pill.addEventListener('click', ()=>kbGoto(i));
    toc.appendChild(pill);
  });
}

function kbGoto(index){
  kbCurrent = Math.max(0, Math.min(index, kbChapters.length-1));
  kbCurrentKP = null;                 // 清掉选中，进入“按章节聚合”模式
  kbRenderTOC();
  kbRenderSpread();
  kbUpdateNav();
  // 右侧按“当前章节”聚合，标题不会串
  kbRenderRightAgg(kbChapters[kbCurrent]);
}

function kbUpdateNav(){
  const prev = document.getElementById('kbObPrev');
  const next = document.getElementById('kbObNext');
  if(prev) prev.disabled = kbCurrent===0;
  if(next) next.disabled = kbCurrent===kbChapters.length-1;
}

// ============== 按当前状态刷新右侧（切语言时关键） ==============
function kbRefreshRight(){
  if (!kbChapters.length) return;

  // 单KP模式
  if (kbCurrentKP && kbCurrentKP.principles) {
    kbRenderRight(kbCurrentKP);
    return;
  }
  // 层节点聚合
  if (kbCurrentKP) {
    kbRenderRightAgg(kbCurrentKP);
    return;
  }
  // 整章聚合
  kbRenderRightAgg(kbChapters[kbCurrent]);
}

// ============== 左右页整体 ==============
function kbRenderSpread(){
  const ch = kbChapters[kbCurrent];
  const leftTitle = document.getElementById('kbObLeftTitle');
  if(leftTitle){
    leftTitle.textContent =
      kbLang==='en' ? `Chapter ${kbCurrent+1} · ${nameOf(ch)}` : `第 ${kbCurrent+1} 章 · ${nameOf(ch)}`;
  }

  // 左：树
  const kw = document.getElementById('kbObSearch')?.value?.trim() || '';
  kbRenderTree(kw);

  // 右：若当前处于单KP模式，维持；否则进入聚合
  const hint = document.getElementById('kbObHint');
  if(hint) hint.style.display = 'none';

  if(!kbCurrentKP){
    // ★ 兜底：聚合展示当前章节
    kbRenderRightAgg(kbChapters[kbCurrent]);
  }else{
    if (kbCurrentKP.principles) {
      kbRenderRight(kbCurrentKP);
    } else {
      kbRenderRightAgg(kbCurrentKP);
    }
  }
}

// ============== 工具：简单命中匹配 ==============
const textHit = (txt, kw) => {
  if(!kw) return true;
  return (txt||'').toLowerCase().includes(kw.toLowerCase());
};

// ============== 左页树（跳过未命名中间层，上浮子元素） ==============
function kbRenderTree(keyword=''){
  const wrap = document.getElementById('kbObTree');
  if(!wrap) return;
  wrap.innerHTML = '';
  const root = document.createElement('ul');
  root.className = 'kb-ob-tree';

  const ch = kbChapters[kbCurrent];
  if(!ch){ wrap.appendChild(root); return; }

  // 收集“有效子层”（把未命名的中间层透明化，直接取其子孙中有名字的层）
  function collectEffectiveChildren(node){
    const out = [];
    const queue = [...(node.children || [])];

    while(queue.length){
      const n = queue.shift();
      const nm = (nameOf(n) || '').trim();

      if(!nm){
        // 空名字的层：透传其 children；其 KP 作为“虚拟 KP 列表”带上来
        if(n.children && n.children.length) queue.push(...n.children);
        if(n.knowledgepoints && n.knowledgepoints.length){
          out.push({ __virtualKPList: n.knowledgepoints });
        }
        continue;
      }
      out.push(n);
    }
    return out;
  }

  // 渲染一个层级节点
  const makeNode = (node, lvl=2)=>{
    const li = document.createElement('li');

    const row = document.createElement('div');
    row.className = 'kb-ob-node';

    const tg = document.createElement('div');
    tg.className = 'kb-ob-toggle';
    tg.textContent = '›';

    const label = document.createElement('span');
    label.className = 'kb-ob-label';
    const nm = nameOf(node) || (kbLang==='en'?'(Uncategorized)':'（未分类）');
    label.textContent = nm;

    if(keyword && textHit(nm, keyword)) label.classList.add('hit');

    row.appendChild(tg); row.appendChild(label);
    li.appendChild(row);

    const kids = document.createElement('div');
    kids.className = 'kb-ob-children';
    kids.style.display = 'none';
    li.appendChild(kids);

    // 有效子层 + 有效 KP
    const effectiveChildren = collectEffectiveChildren(node);
    const effectiveKP = [
      ...(node.knowledgepoints || []),
      ...effectiveChildren
        .filter(x => x.__virtualKPList)
        .flatMap(x => x.__virtualKPList)
    ];
    const realChildren = effectiveChildren.filter(x => !x.__virtualKPList);

    const hasChildren = realChildren.length > 0 || effectiveKP.length > 0;
    if(!hasChildren) tg.classList.add('is-leaf');

    let opened=false;
    const open=()=>{
      if(opened) return; opened=true;
      tg.textContent='⌄'; kids.style.display='';

      // 子层
      if(realChildren.length){
        const sub = document.createElement('ul'); sub.className='kb-ob-tree';
        realChildren.forEach(nd=>{
          sub.appendChild(makeNode(nd, lvl+1));
        });
        kids.appendChild(sub);
      }

      // KP 列表
      if(effectiveKP.length){
        const ulkp = document.createElement('ul'); ulkp.className='kb-ob-tree';
        effectiveKP.forEach(kp=>{
          const liKp = document.createElement('li');
          const rowKp = document.createElement('div'); rowKp.className='kb-ob-node';

          const dot = document.createElement('div'); dot.className='kb-ob-toggle is-leaf'; dot.textContent='•';
          const lbl = document.createElement('span'); lbl.className='kb-ob-label'; lbl.textContent = nameOf(kp);
          if(keyword && textHit(nameOf(kp), keyword)) lbl.classList.add('hit');

          rowKp.appendChild(dot); rowKp.appendChild(lbl);
          liKp.appendChild(rowKp); ulkp.appendChild(liKp);

          // 点击“知识点”：右侧显示该 KP 的考点（单KP模式）
          rowKp.addEventListener('click', (e)=>{
            e.stopPropagation();
            kbCurrentKP = kp;
            const hint = document.getElementById('kbObHint');
            if(hint) hint.style.display='none';
            kbRenderRight(kp);
          });
        });
        kids.appendChild(ulkp);
      }
    };
    const close=()=>{ opened=false; tg.textContent='›'; kids.style.display='none'; kids.innerHTML=''; };

    // 点击“层节点”：展开/收起 + 右侧聚合显示该层子树
    row.addEventListener('click', (e)=>{
      if(e.target !== tg) {
        opened ? close() : open();
        kbCurrentKP = node; // 记录当前“层节点”为选中对象
        const hint = document.getElementById('kbObHint');
        if(hint) hint.style.display='none';
        kbRenderRightAgg(node); // 聚合显示该层下所有 KP/考点
      }
    });
    tg.addEventListener('click', (e)=>{ e.stopPropagation(); opened?close():open(); });

    // 默认展开策略
    if(lvl<=2 || (keyword && textHit(nm, keyword))) open();

    return li;
  };

  // 顶层：当前章节的 L2 开始（名字为空的 L2 会被透传）
  const topChildren = collectEffectiveChildren(ch);
  topChildren.forEach(nd=>{
    if(nd.__virtualKPList){
      // L2 空名但直挂 KP：直接画 KP
      const ul = document.createElement('ul'); ul.className='kb-ob-tree';
      nd.__virtualKPList.forEach(kp=>{
        const liKp = document.createElement('li');
        const rowKp = document.createElement('div'); rowKp.className='kb-ob-node';
        const dot = document.createElement('div'); dot.className='kb-ob-toggle is-leaf'; dot.textContent='•';
        const lbl = document.createElement('span'); lbl.className='kb-ob-label'; lbl.textContent = nameOf(kp);
        if(keyword && textHit(nameOf(kp), keyword)) lbl.classList.add('hit');
        rowKp.appendChild(dot); rowKp.appendChild(lbl);
        rowKp.addEventListener('click', (e)=>{
          e.stopPropagation();
          kbCurrentKP = kp;
          const hint = document.getElementById('kbObHint');
          if(hint) hint.style.display='none';
          kbRenderRight(kp);
        });
        liKp.appendChild(rowKp); ul.appendChild(liKp);
      });
      root.appendChild(ul);
    }else{
      root.appendChild(makeNode(nd, 2));
    }
  });

  wrap.appendChild(root);

  // 根据语言更新搜索占位
  const input = document.getElementById('kbObSearch');
  if(input) input.placeholder = kbLang==='en' ? 'Search in chapter…' : '章节内搜索…';
}

// ============== 右页：两种渲染 ==============

// A) 单知识点：chips + 点开才显示描述
function kbRenderRight(kp){
  const detail = document.getElementById('kbObDetail');
  const title  = document.getElementById('kbObRightTitle');
  if(!detail) return;
  detail.classList.remove('kb-ob-grid', 'kb-ob-list');
  detail.innerHTML = '';
  if(title) {
    title.textContent = kbLang==='en' ? 'KnowledgePoint · Principles' : '知识点 · 知识原理';
  }

  const head = document.createElement('div');
  head.className = 'kb-ob-kp-head';
  head.textContent = nameOf(kp);
  detail.appendChild(head);

  const list = kp.principles || [];
  if(!list.length){
    const empty = document.createElement('div');
    empty.style.cssText = 'color:#8aa6b8; margin-top:6px;';
    empty.textContent = kbLang==='en' ? 'No principles under this knowledge point.' : '该知识点暂无知识原理的内容。';
    detail.appendChild(empty);
    return;
  }

  const chipsWrap = document.createElement('div');
  chipsWrap.className = 'kb-ob-chips';
  detail.appendChild(chipsWrap);

  list.forEach((pr)=>{
    const chip = document.createElement('div');
    chip.className = 'kb-ob-chip';
    chip.innerHTML = `<span class="dot"></span><span>${nameOf(pr)}</span>`;
    chipsWrap.appendChild(chip);

    chip.addEventListener('click', ()=>{
      const next = chip.nextElementSibling;
      // 若下一个就是描述块 -> 切换收起
      if(next && next.classList && next.classList.contains('kb-ob-desc')){
        next.remove();
        chip.classList.remove('active');
        return;
      }
      // 否则插入一个新的描述块
      const desc = document.createElement('div');
      desc.className = 'kb-ob-desc';
      desc.style.cssText = 'margin:6px 0 2px 0; padding:10px 12px; border-radius:10px; border:1px dashed #cfe0ee; color:#335d7a; background:#f7fbff;';
      desc.innerHTML = `<b>${kbLang==='en' ? 'Description' : '描述'}:</b> ${descOf(pr)}`;
      chip.insertAdjacentElement('afterend', desc);
      chip.classList.add('active');
    });
  });

  // 可选：默认展开第一个
  // const firstChip = chipsWrap.querySelector('.kb-ob-chip');
  // if(firstChip) firstChip.click();
}

// B) 聚合：点 L1/L2/L3/L4 时，展示其子树下所有 KP（每个 KP 一个卡片；chip 点开描述）
function kbRenderRightAgg(target){
  const hint  = document.getElementById('kbObHint');
  const title = document.getElementById('kbObRightTitle');
  const detail = document.getElementById('kbObDetail');

  if(!detail) return;
  detail.classList.remove('kb-ob-grid');
  detail.classList.add('kb-ob-list'); // 纵向列表风格
  if(hint) hint.style.display = 'none';
  detail.innerHTML = '';

  // 默认取当前章节
  if(!target){ target = kbChapters[kbCurrent]; }

  // 若传入就是 KP，则走单 KP 渲染
  if(target && target.principles){
    kbRenderRight(target);
    return;
  }

  // 深度收集该节点下所有 KP
  const collectKPDeep = (node)=>{
    const acc = [];
    if(!node) return acc;
    if(Array.isArray(node.knowledgepoints)) acc.push(...node.knowledgepoints);
    if(Array.isArray(node.children)) node.children.forEach(ch => acc.push(...collectKPDeep(ch)));
    return acc;
  };

  const allKPs = collectKPDeep(target);
  const targetName = nameOf(target) || nameOf(kbChapters[kbCurrent]) || '';
  if(title){
    title.textContent = kbLang === 'en'
      ? `All KnowledgePoints under “${targetName}”`
      : `“${targetName}” 下的全部知识点`;
  }

  if(!allKPs.length){
    detail.innerHTML = `<div style="color:#8aa6b8;">${kbLang==='en'?'No knowledge points under this node.':'此节点暂无知识点'}</div>`;
    return;
  }

  // 逐个知识点渲染为卡片
  allKPs.forEach(kp=>{
    const card = document.createElement('div');
    card.className = 'kb-ob-kp-block';

    const titleEl = document.createElement('div');
    titleEl.className = 'kb-ob-kp-title';
    titleEl.textContent = nameOf(kp);
    card.appendChild(titleEl);

    const list = kp.principles || [];
    if(!list.length){
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#8aa6b8; margin-top:4px;';
      empty.textContent = kbLang==='en' ? 'No principles under this knowledge point.' : '该知识点暂无知识原理内容。';
      card.appendChild(empty);
      detail.appendChild(card);
      return;
    }

    const chips = document.createElement('div');
    chips.className = 'kb-ob-chips';
    card.appendChild(chips);

    list.forEach(pr=>{
      const chip = document.createElement('div');
      chip.className = 'kb-ob-chip';
      chip.innerHTML = `<span class="dot"></span><span>${nameOf(pr)}</span>`;
      chips.appendChild(chip);

      chip.addEventListener('click', ()=>{
        const next = chip.nextElementSibling;
        if(next && next.classList && next.classList.contains('kb-ob-desc')){
          next.remove();
          chip.classList.remove('active');
          return;
        }
        const desc = document.createElement('div');
        desc.className = 'kb-ob-desc';
        desc.style.cssText = 'margin:6px 0 2px 0; padding:10px 12px; border-radius:10px; border:1px dashed #cfe0ee; color:#335d7a; background:#f7fbff;';
        desc.innerHTML = `<b>${kbLang==='en' ? 'Description' : '描述'}:</b> ${descOf(pr)}`;
        chip.insertAdjacentElement('afterend', desc);
        chip.classList.add('active');
      });
    });

    // 可选：默认展开每张卡片内第一个
    // const firstChip = card.querySelector('.kb-ob-chip');
    // if(firstChip) firstChip.click();

    detail.appendChild(card);
  });

  detail.scrollTop = 0;
}

// ============== 工具（给其它地方复用） ==============

// 收集某节点/章节下所有 KP 与考点（用于其它聚合场景）
function kbCollectKPDeep(target){
  const list = []; // { kpName, kpObj, principles:[{name, desc}] }
  const pushKP = (kp) => {
    const kpName = kbLang==='en' ? (kp.name_en||kp.name_cn||'') : (kp.name_cn||kp.name_en||'');
    if(!kpName) return;
    let rec = list.find(x=>x.kpName===kpName);
    if(!rec){ rec = { kpName, kpObj: kp, principles: [] }; list.push(rec); }
    if(Array.isArray(kp.principles)){
      kp.principles.forEach(p=>{
        const pName = kbLang==='en' ? (p.name_en||p.name_cn||'') : (p.name_cn||p.name_en||'');
        const pDesc = kbLang==='en' ? (p.desc_en||p.desc_cn||'') : (p.desc_cn||p.desc_en||'');
        if(!pName) return;
        if(!rec.principles.find(q=>q.name===pName)){
          rec.principles.push({ name:pName, desc:pDesc });
        }
      });
    }
  };

  const walkNode = (node)=>{
    if(!node) return;
    if(Array.isArray(node.knowledgepoints)) node.knowledgepoints.forEach(pushKP);
    if(Array.isArray(node.children))         node.children.forEach(walkNode);
  };

  if(!target) target = kbChapters[kbCurrent];
  walkNode(target);
  return list;
}

// 从聚合列表渲染右页（备用）
function kbRenderRightFromList(kpList){
  const detail = document.getElementById('kbObDetail');
  if(!detail) return;
  detail.classList.remove('kb-ob-grid');
  detail.classList.add('kb-ob-list');
  detail.innerHTML = '';

  kpList.forEach(rec=>{
    const card = document.createElement('div');
    card.className = 'kb-ob-kp-block';

    const title = document.createElement('div');
    title.className = 'kb-ob-kp-title';
    title.textContent = rec.kpName || (kbLang==='en'?'(Unnamed KP)':'（未命名知识点）');
    card.appendChild(title);

    const chips = document.createElement('div');
    chips.className = 'kb-ob-chips';
    card.appendChild(chips);

    (rec.principles || []).forEach(pr=>{
      const chip = document.createElement('div');
      chip.className = 'kb-ob-chip';
      chip.innerHTML = `<span class="dot"></span><span>${pr.name}</span>`;
      chips.appendChild(chip);

      chip.addEventListener('click', ()=>{
        const next = chip.nextElementSibling;
        if(next && next.classList && next.classList.contains('kb-ob-desc')){
          next.remove();
          chip.classList.remove('active');
          return;
        }
        const desc = document.createElement('div');
        desc.className = 'kb-ob-desc';
        desc.style.cssText = 'margin:6px 0 2px 0; padding:10px 12px; border-radius:10px; border:1px dashed #cfe0ee; color:#335d7a; background:#f7fbff;';
        const labelDesc = kbLang==='en' ? 'Description' : '描述';
        const labelPrin = kbLang==='en' ? 'Principle'   : '知识原理';
        desc.innerHTML = `<b>${labelPrin}:</b> ${pr.name}<br><b>${labelDesc}:</b> ${pr.desc || (kbLang==='en'?'—':'—')}`;
        chip.insertAdjacentElement('afterend', desc);
        chip.classList.add('active');
      });
    });

    // 可选：默认展开第一条
    // const firstChip = card.querySelector('.kb-ob-chip');
    // if(firstChip) firstChip.click();

    detail.appendChild(card);
  });
}