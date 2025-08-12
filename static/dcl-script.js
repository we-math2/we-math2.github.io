(function(){
    // ============ 主流程数据 ============
    const demoData = [
      { label: "Seed", q: "What is the volume of the prism in the figure?", a: "16", know: "Area of square, Definition of square, Volume of prism, Definition of prism", img: "static/image_3/3805.png" },
      { label: "Step↑", q: "Given a cone with base radius 3 and height equal to the prism, and its volume is $12\\pi$, what is the volume of the prism in the figure?", a: "16", know: "Area of square, Definition of square, Volume of prism, Definition of prism, Volume of cone, Area of circle", img: "static/image_3/3805_X6.png" },
      { label: "Step↑+Visual↑", q: "Given a cone with base radius 3 and height equal to the prism, and its volume is $12\\pi$, what is the volume of the prism in the figure?", a: "16", know: "Area of square, Definition of square, Volume of prism, Definition of prism, Volume of cone, Area of circle", img: "static/image_3/3805_X6Y.png" },
      { label: "Step↑+Context↑", q: "As shown, for a prism-shaped part, if a cone with base radius 3 and same height has volume $12\\pi$, and the cost per unit volume is 1 yuan, what is the cost to make the part? (Just fill in the number)", a: "16", know: "Area of square, Definition of square, Volume of prism, Definition of prism, Volume of cone, Area of circle", img: "static/image_3/3805_X6.png" },
      { label: "Step↑+Visual↑+Context↑", q: "As shown, for a prism-shaped part, if a cone with base radius 3 and same height has volume $12\\pi$, and the cost per unit volume is 1 yuan, what is the cost to make the part? (Just fill in the number)", a: "16", know: "Area of square, Definition of square, Volume of prism, Definition of prism, Volume of cone, Area of circle", img: "static/image_3/3805_X6Y.png" }
    ];
    const extraData = [
      { label: "Visual↑", q: "What is the volume of the prism in the figure? (Just fill in the number)", a: "16", know: "Area of square, Definition of square, Volume of prism, Definition of prism", img: "static/image_3/3805_Y.png" },
      { label: "Context↑", q: "As shown, for a prism-shaped part, if the cost per unit volume is 1 yuan, what is the cost to make the part? (Just fill in the number)", a: "16 yuan", know: "Area of square, Definition of square, Volume of prism, Definition of prism", img: "static/image_3/3805.png" }
    ];
    const knowledgeAuxData = [
      { label: "Area of square", q: "What is the area of a square with side length 4?", a: "16", know: "Area of square", img: "static/image_3/area_square.png" },
      { label: "Definition of square", q: "What is a square?", a: "A quadrilateral with four equal sides and four right angles.", know: "Definition of square", img: "static/image_3/def_square.png" }
    ];
  
    const cubeData = [
      { label: "Seed", q: "What is the volume of the prism?", img: "static/image_3/3805.png", coord: [0,0,0] },
      { label: "Visual↑", q: "Visual: What is the volume of the prism?", img: "static/image_3/3805_Y.png", coord: [1,0,0] },
      { label: "Context↑", q: "If cost per unit is 1 yuan, what is the total cost?", img: "static/image_3/3805.png", coord: [0,1,0] },
      { label: "Visual↑+Context↑", q: "Context+Visual: What is the cost?", img: "static/image_3/3805_Y.png", coord: [1,1,0] },
      { label: "Step↑", q: "If base radius 3, cone volume is $12\\pi$, what is the prism's volume?", img: "static/image_3/3805_X6.png", coord: [0,0,1] },
      { label: "Step↑+Visual↑", q: "Cone visual variant: Prism's volume?", img: "static/image_3/3805_X6Y.png", coord: [1,0,1] },
      { label: "Step↑+Context↑", q: "Cone + Cost: What is the total cost?", img: "static/image_3/3805_X6.png", coord: [0,1,1] },
      { label: "All↑", q: "Cone+Visual+Context: Final cost?", img: "static/image_3/3805_X6Y.png", coord: [1,1,1] }
    ];
    const flow2cube = [0,4,5,6,7];
    const flowIdx = [0,1,2,3,4];
  
    // 插入主体结构到dcl-demo容器
    function dclInsertMainHTML(){
      document.getElementById('dcl-demo').innerHTML = `
  <div class="super-card">
    <div class="progress-bar-wrap">
      <div class="progress-bar-horizontal" id="progress-bar-main"></div>
      <div class="progress-bar-aux" id="progress-bar-aux"></div>
    </div>
    <div class="flex-container">
      <div class="left-col">
        <div class="left-title">
          Case Demonstration
        </div>
        <div class="case-card" id="case-card"></div>
        <div id="aux-block" class="aux-block" style="display:none;"></div>
        <div class="msg-tip" id="msg-tip">Click one of the buttons below to start the step-by-step demonstration.</div>
        <div id="btn-block">
          <button class="control-btn" id="btn-correct">Model Correct</button>
          <button class="control-btn" id="btn-wrong">Model Wrong</button>
        </div>
        <div id="aux-btn-block" style="display:none;">
          <button class="control-btn" id="btn-aux-finish">Finish Auxiliary Learning</button>
        </div>
      </div>
      <div id="exit-modal" style="display:none; position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.12);z-index:99;justify-content:center;align-items:center;">
        <div style="background:#fff;padding:36px 32px 28px 32px;border-radius:18px;box-shadow:0 6px 40px #8ab3e355;max-width:340px;text-align:center;">
          <div id="exit-modal-text" style="font-size:1.15em;color:#245196;margin-bottom:23px;">需要跳转到下一题！</div>
          <button id="btn-exit-close" style="background:#2ca65c;color:#fff;padding:8px 30px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:1.04em;">我知道了</button>
        </div>
      </div>
      <div class="divider-vertical"></div>
      <div class="right-col">
        <div class="right-title">Difficulty Space</div>
        <div id="cube3d"></div>
      </div>
    </div>
  </div>
      `;
    }
  
    // ============ 变量和流程 ============
    let cur = 0, inAux = false;
    let errorCount = [0,0,0,0,0];
    const auxTypes = [null, 'K', 'V', 'C', null];
  
    // ============ 渲染流程条 ============
    function renderProgress(active, auxStep = null) {
      let mainHtml = '', auxHtml = '';
      for(let i=0; i<flowIdx.length; ++i) {
        mainHtml += `<div class="prog-step${active===i?" active":""}">${demoData[flowIdx[i]].label}</div>`;
        auxHtml += auxTypes[i]
          ? `<div class="aux-dot${auxStep===i?' aux-dot-active':''}" data-type="${auxTypes[i]}">${auxTypes[i]}</div>`
          : `<div class="aux-dot-empty"></div>`;
        if(i<flowIdx.length-1){
          mainHtml += `<span class="prog-arrow">&#8594;</span>`;
          auxHtml += `<div class="aux-dash"></div>`;
        }
      }
      document.querySelector('#dcl-demo #progress-bar-main').innerHTML = mainHtml;
      document.querySelector('#dcl-demo #progress-bar-aux').innerHTML = auxHtml;
    }
  
    // ============ 主流程卡片 ============
    function renderCase(idx) {
      let d = demoData[flowIdx[idx]];
      let html = `<div class="case-title">Problem ${idx+1}</div>
      <div class="case-row">
        <img class="case-img" src="${d.img}" alt="" onerror="this.style.opacity=0;">
        <div class="case-content">
          <div class="case-q">${d.q}</div>
          <div class="case-meta"><b>Knowledge:</b> ${d.know}</div>
          <div class="case-ans"><b>Answer:</b> ${d.a}</div>
        </div>
      </div>`;
      document.querySelector('#dcl-demo #case-card').innerHTML = html;
    }
    function renderAux(idx, type) {
      let d = type === "Visual" ? extraData[0] : extraData[1];
      let auxBlock = document.querySelector('#dcl-demo #aux-block');
      auxBlock.style.display = "";
      auxBlock.innerHTML = 
        `<b>Auxiliary Learning:</b> ${type} Increment<br>
          <div class="case-row" style="margin:12px 0 7px 0;">
            <img class="case-img" src="${d.img}" alt="" onerror="this.style.opacity=0;">
            <div class="case-content">
              <div class="case-q" style="font-size:1.06em;">${d.q}</div>
              <div class="case-meta"><b>Knowledge:</b> ${d.know}</div>
            </div>
          </div>`;
      document.querySelector('#dcl-demo #btn-block').style.display = "none";
      document.querySelector('#dcl-demo #aux-btn-block').style.display = "";
      document.querySelector('#dcl-demo #msg-tip').textContent = `Complete the auxiliary learning, then retry this step.`;
    }
    function renderAuxAll() {
      let auxBlock = document.querySelector('#dcl-demo #aux-block');
      auxBlock.style.display = "";
      auxBlock.innerHTML = `
        <b>Auxiliary Learning:</b> Knowledge Increment<br>
        ${knowledgeAuxData.map(d => `
          <div class="case-row" style="margin:12px 0 7px 0;">
            <img class="case-img" src="${d.img}" alt="" onerror="this.style.opacity=0;">
            <div class="case-content">
              <div class="case-q" style="font-size:1.06em;">${d.q}</div>
              <div class="case-meta"><b>Knowledge:</b> ${d.know}</div>
              <div class="case-ans" style="color:#3b865b"><b>Answer:</b> ${d.a}</div>
            </div>
          </div>
        `).join('')}
      `;
      document.querySelector('#dcl-demo #btn-block').style.display = "none";
      document.querySelector('#dcl-demo #aux-btn-block').style.display = "";
      document.querySelector('#dcl-demo #msg-tip').textContent = `Complete all auxiliary learning, then retry this step.`;
    }
    function hideAux() {
      document.querySelector('#dcl-demo #aux-block').style.display="none";
      document.querySelector('#dcl-demo #aux-btn-block').style.display = "none";
      document.querySelector('#dcl-demo #btn-block').style.display = "";
    }
    function showExitModal(text="需要跳转到下一题！") {
      let modal = document.querySelector('#dcl-demo #exit-modal');
      document.querySelector('#dcl-demo #exit-modal-text').textContent = text;
      modal.style.display = "flex";
    }
    function closeExitModal() {
      document.querySelector('#dcl-demo #exit-modal').style.display = "none";
    }
  
    // ========== 交互 ============
    function userStep(isCorrect) {
      if(inAux) return;  // 正在辅助学习时禁止操作
      if(isCorrect) {
        if(cur < flowIdx.length-1) {
          cur++;
          renderProgress(cur);      // 只高亮主流程
          renderCase(cur);
          highlight3D(cur);
          document.querySelector('#dcl-demo #msg-tip').textContent = `Continue to the next step.`;
        } else {
          highlight3D(cur);
          document.querySelector('#dcl-demo #msg-tip').innerHTML = `<b style="color:#2ca65c">Model mastered all curriculum stages!</b>`;
          document.querySelector('#dcl-demo #btn-block').style.display = "none";
        }
      } else {
        // 1. 错误计数
        errorCount[cur] = (errorCount[cur] || 0) + 1;
        // 2. Seed或All错，直接跳出
        if(cur === 0 || cur === flowIdx.length-1) {
          showExitModal();
          return;
        }
        // 3. 中间step第二次错，直接跳出
        if(errorCount[cur] >= 2) {
          showExitModal();
          return;
        }
        // 4. 进入辅助
        let auxType = auxTypes[cur];
        inAux = true;
        renderProgress(cur, cur);  // 主流程和对应的辅助点都高亮
        if(auxType === 'K') {
          renderAuxAll(); // 一次性渲染所有知识点
          draw3D(flow2cube[cur], flow2cube[cur], 0);
        } else if(auxType === 'V') {
          renderAux(cur, "Visual");
          draw3D(flow2cube[cur], flow2cube[cur], 1);
        } else if(auxType === 'C') {
          renderAux(cur, "Context");
          draw3D(flow2cube[cur], flow2cube[cur], 2);
        } else {
          renderAux(cur, "Knowledge");
          highlight3D(cur);
        }
        document.querySelector('#dcl-demo #msg-tip').textContent = `Complete the auxiliary learning, then retry this step.`;
      }
    }
    function finishAux() {
      inAux = false;
      hideAux();
      document.querySelector('#dcl-demo #msg-tip').textContent = `Auxiliary learning completed. Please retry this step.`;
      highlight3D(cur);
    }
  
    // =========== Plotly 3D 难度空间 ==========
    function draw3D(highlightIdx, selectedIdx = highlightIdx, auxIdx = null) {
      const x = cubeData.map(d => d.coord[0]);
      const y = cubeData.map(d => d.coord[1]);
      const z = cubeData.map(d => d.coord[2]);
      const auxColor = '#FFD54F';
      const highlightColor = '#3788fa';
      const selectedColor = '#1c4aac';
      const defaultColor = '#b8c4e8';
      const colors = cubeData.map((d, i) =>
        auxIdx === i ? auxColor :
        (i === selectedIdx ? selectedColor : (i === highlightIdx ? highlightColor : defaultColor))
      );
      const sizes = cubeData.map((d, i) =>
        auxIdx === i ? 21 :
        (i === selectedIdx ? 16 : (i === highlightIdx ? 13 : 10))
      );
      const glows = cubeData.map((d, i) =>
        auxIdx === i || i === selectedIdx || i === highlightIdx ? 7 : 2
      );
      const glowColors = cubeData.map((d, i) =>
        auxIdx === i ? '#ffe28d' : (i === selectedIdx || i === highlightIdx ? '#b8d0ff' : '#e5eaf4')
      );
      const edges = [
        [0,1],[0,2],[0,4],
        [1,3],[1,5],
        [2,3],[2,6],
        [3,7],
        [4,5],[4,6],
        [5,7],
        [6,7]
      ];
      const lineX = [], lineY = [], lineZ = [];
      edges.forEach(([a, b]) => {
        lineX.push(x[a], x[b], null);
        lineY.push(y[a], y[b], null);
        lineZ.push(z[a], z[b], null);
      });
      const traceCube = {
        x: lineX, y: lineY, z: lineZ,
        mode: 'lines',
        type: 'scatter3d',
        line: { color: '#b8c4e8', width: 5 },
        hoverinfo: 'skip'
      };
      const tracePoints = {
        x: x, y: y, z: z,
        text: cubeData.map(d => d.label),
        mode: 'markers+text',
        type: 'scatter3d',
        marker: {
          size: sizes,
          color: colors,
          line: {
            width: glows,
            color: glowColors
          },
          symbol: 'circle'
        },
        textposition: "top center",
        textfont: { color: '#225194', size: 16, family: 'Noto Sans,sans-serif' },
        hoverinfo: 'none'
      };
      var layout = {
        margin: { l: 20, r: 20, b: 20, t: 20 },
        scene: {
          xaxis: {
            title: { text: 'Visual', standoff: 2, font: { size: 13 } },
            range: [-0.15, 1.15], tickvals: [-1, 1], showticklabels: false,
            backgroundcolor: '#fafdff'
          },
          yaxis: {
            title: { text: 'Contextual', standoff: 2, font: { size: 13 } },
            range: [-0.15, 1.15], tickvals: [-1, 1], showticklabels: false,
            backgroundcolor: '#fafdff'
          },
          zaxis: {
            title: { text: 'Step', standoff: 2, font: { size: 13 } },
            range: [-0.15, 1.15], tickvals: [-1, 1], showticklabels: false,
            backgroundcolor: '#fafdff'
          },
          camera: { eye: { x: 1.9, y: 1.35, z: 1.09 } },
          aspectratio: { x: 1.05, y: 1.05, z: 1.09 }
        },
        showlegend: false,
        paper_bgcolor: '#fafdff',
        plot_bgcolor: '#fafdff'
      };
      window.Plotly.newPlot(document.querySelector('#dcl-demo #cube3d'), [traceCube, tracePoints], layout, { displayModeBar: false, responsive: true })
        .then(() => {
          document.querySelector('#dcl-demo #cube3d').on('plotly_click', function (data) {
            const pt = data.points[0];
            if (pt && pt.traceIndex === 1) {
              const idx = pt.pointIndex;
              draw3D(highlightIdx, idx); // 点击只高亮点
            }
          });
        });
    }
    function highlight3D(curIdx) {
      draw3D(flow2cube[curIdx], flow2cube[curIdx]);
    }
  
    // ========== 初始化和事件 ===========
    function dclInitEvents(){
      // 按钮
      document.querySelector('#dcl-demo #btn-correct').onclick = function(){userStep(true);};
      document.querySelector('#dcl-demo #btn-wrong').onclick = function(){userStep(false);};
      document.querySelector('#dcl-demo #btn-aux-finish').onclick = function(){finishAux();};
      document.querySelector('#dcl-demo #btn-exit-close').onclick = function(){closeExitModal();};
    }
  
    window.addEventListener('DOMContentLoaded', function(){
      if(!document.getElementById('dcl-demo')) return;
      dclInsertMainHTML();
      renderProgress(0);
      renderCase(0);
      highlight3D(0);
      dclInitEvents();
    });
  })();
  