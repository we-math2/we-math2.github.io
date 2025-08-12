(function(){
    const DATA_URL = "static/data/knowledge_tree_v2.json";
    let RAW = null;
    let LANG = (localStorage.getItem("atlas_lang") || "en");
    let currentL1 = null;
  
    const byId = (id) => document.getElementById(id);
    const textByLang = (obj) => LANG === "en" ? (obj?.name_en || obj?.name_cn || "") : (obj?.name_cn || obj?.name_en || "");
    const descByLang = (obj) => LANG === "en" ? (obj?.desc_en || obj?.desc_cn || "") : (obj?.desc_cn || obj?.desc_en || "");
  
    document.addEventListener("DOMContentLoaded", async () => {
      try{
        const res = await fetch(DATA_URL);
        RAW = await res.json();
        currentL1 = RAW?.chapters?.[0]?.id || null;
        renderChapters();
        renderPages();
  
        const langBtn = byId("lang-toggle");
        updateLangBtn(langBtn);
        langBtn.addEventListener("click", ()=>{
          LANG = (LANG==="en"?"cn":"en");
          localStorage.setItem("atlas_lang", LANG);
          updateLangBtn(langBtn);
          renderChapters(); renderPages();
        });
  
        byId("atlas-search").addEventListener("input", e=>{
          renderPages(e.target.value.trim());
        });
      }catch(e){
        console.error(e);
        byId("page-left").innerHTML = "<div style='color:#c33'>Load knowledge_tree_v2.json failed.</div>";
      }
    });
  
    function updateLangBtn(btn){ btn.textContent = (LANG==="en" ? "EN ▾" : "中文 ▾"); }
  
    function renderChapters(){
      const wrap = byId("atlas-chapters"); wrap.innerHTML = "";
      (RAW.chapters||[]).forEach(ch=>{
        const b = document.createElement("button");
        b.className = "atlas-tab" + (ch.id===currentL1 ? " active": "");
        b.textContent = textByLang(ch) || "Untitled";
        b.addEventListener("click", ()=>{ currentL1 = ch.id; renderChapters(); renderPages(); });
        wrap.appendChild(b);
      });
    }
  
    function renderPages(keyword=""){
      const L = byId("page-left"), R = byId("page-right");
      L.innerHTML=""; R.innerHTML="";
      const chapter = (RAW.chapters||[]).find(x=>x.id===currentL1) || RAW.chapters?.[0];
      if(!chapter){ L.innerHTML="<div>No chapter</div>"; return; }
  
      // 左页：L2 提纲（点击刷新右页）
      (chapter.children||[]).forEach(l2=>{
        const acc = createLeftItem(textByLang(l2) || "Untitled L2", ()=> renderRightPage(l2, keyword));
        L.appendChild(acc);
      });
      renderRightPage(chapter.children?.[0], keyword);
    }
  
    function renderRightPage(l2, keyword=""){
      const R = byId("page-right"); R.innerHTML="";
      if(!l2){ R.innerHTML="<div>Empty</div>"; return; }
  
      const head = document.createElement("div");
      head.className = "atlas-acc-hd";
      head.innerHTML = `<div style="font-size:1.05em">${textByLang(l2)}</div>
                        <span class="atlas-badge">${(l2.children||[]).length} subsections</span>`;
      R.appendChild(head);
  
      (l2.children||[]).forEach(l3=>{
        const box = document.createElement("div");
        box.className = "atlas-accordion";
  
        const hd = document.createElement("div");
        hd.className = "atlas-acc-hd";
        const chev = document.createElement("span"); chev.className="chev"; chev.textContent="▸";
        const lab = document.createElement("div"); lab.textContent = textByLang(l3) || "Untitled L3";
        const badge = document.createElement("span"); badge.className="atlas-badge";
        badge.textContent = `${(l3.children||[]).length} topics`;
  
        const row = document.createElement("div"); row.style.display="flex"; row.style.alignItems="center"; row.style.gap="10px";
        row.appendChild(chev); row.appendChild(lab);
        const hdr = document.createElement("div"); hdr.appendChild(badge);
        hd.appendChild(row); hd.appendChild(hdr);
  
        const bd = document.createElement("div"); bd.className = "atlas-acc-bd"; bd.style.display="none";
  
        // L4 -> KnowledgePoints -> Principles
        (l3.children||[]).forEach(l4=>{
          const l4Box = document.createElement("div"); l4Box.className="atlas-accordion";
          const l4Hd  = document.createElement("div"); l4Hd.className="atlas-acc-hd";
          l4Hd.innerHTML = `<div>${textByLang(l4) || "Untitled L4"}</div>
                            <span class="atlas-badge">${(l4.knowledgepoints||[]).length} knowledge points</span>`;
          const l4Bd  = document.createElement("div"); l4Bd.className="atlas-acc-bd"; l4Bd.style.display="none";
  
          (l4.knowledgepoints||[]).forEach(kp=>{
            // 关键字过滤（知识点名、其 principles 文本）
            const pool = ( (textByLang(kp) || "") + " " + (kp.principles||[]).map(p=> (LANG==="en"?p.name_en:p.name_cn)).join(" ") ).toLowerCase();
            if(keyword && !pool.includes(keyword.toLowerCase())) return;
  
            const kpWrap = document.createElement("div"); kpWrap.className="atlas-kp";
            const kpHd   = document.createElement("div"); kpHd.className="atlas-kp-hd";
            const kpName = document.createElement("div"); kpName.textContent = textByLang(kp) || "Knowledge Point";
            const kpBadge= document.createElement("span"); kpBadge.className="atlas-badge";
            kpBadge.textContent = `${(kp.principles||[]).length} principles`;
  
            kpHd.appendChild(kpName); kpHd.appendChild(kpBadge);
            const kpBd = document.createElement("div"); kpBd.className="atlas-kp-bd";
  
            (kp.principles||[]).forEach(pr=>{
              const line = document.createElement("div"); line.className="atlas-pr-line";
              const pname = (LANG==="en"?pr.name_en:pr.name_cn) || "Principle";
              const pdesc = descByLang(pr);
              line.innerHTML = `<b>${pname}</b>${pdesc?`: <small>${pdesc}</small>`:""}`;
              kpBd.appendChild(line);
            });
  
            kpHd.addEventListener("click", ()=>{
              kpBd.style.display = (kpBd.style.display==="none"||!kpBd.style.display) ? "block" : "none";
            });
  
            kpWrap.appendChild(kpHd); kpWrap.appendChild(kpBd);
            l4Bd.appendChild(kpWrap);
          });
  
          l4Hd.addEventListener("click", ()=>{
              l4Bd.style.display = (l4Bd.style.display==="none"||!l4Bd.style.display) ? "block" : "none";
          });
  
          l4Box.appendChild(l4Hd); l4Box.appendChild(l4Bd);
          bd.appendChild(l4Box);
        });
  
        hd.addEventListener("click", ()=>{
          const open = bd.style.display!=="none"; bd.style.display = open?"none":"block";
          chev.classList.toggle("open", !open);
        });
  
        box.appendChild(hd); box.appendChild(bd);
        R.appendChild(box);
      });
    }
  
    function createLeftItem(label, onOpen){
      const wrap = document.createElement("div"); wrap.className="atlas-accordion";
      const hd = document.createElement("div"); hd.className="atlas-acc-hd";
      const chev = document.createElement("span"); chev.className="chev"; chev.textContent="▸";
      const lab = document.createElement("div"); lab.textContent = label;
      hd.appendChild(chev); hd.appendChild(lab);
      hd.addEventListener("click", ()=>{
        [...document.querySelectorAll("#page-left .atlas-acc-hd")].forEach(x=> x.style.background="unset");
        hd.style.background="#eef5fb"; if(onOpen) onOpen();
      });
      const bd = document.createElement("div"); bd.className="atlas-acc-bd"; bd.style.display="none";
      wrap.appendChild(hd); wrap.appendChild(bd);
      return wrap;
    }
  })();
  