(function(){
  // ======== 主流程数据 ========
  const demoData = [
    { label: "Seed", q: "The base area of ​​the prism is 4 and the height is 4. What is the volume of the prism?", a: "16", know: "Volume of Prism", img: "static/image_3/3805.png" },
    { label: "Step↑", q: "The base of the prism is a rectangle with a diagonal length of $L=2\\sqrt{2}$. The height of the prism is known to be h, $\\frac{2L}{h}=\\sqrt{2}$. What is the volume of the prism?", a: "16", know: "Volume of Prism, Structural Features of Prism, Area of Square, Properties of Square, Calculation of Proportion, Pythagorean Theorem", img: "static/image_3/3805_X6.png" },
    { label: "Step↑+Visual↑", q: "The base of the prism is a square. Inside it is a regular tetrahedron with the same base and height as the prism. The side edge length of the tetrahedron is known to be $A = 3\\sqrt{2}$. What is the volume of the prism?", a: "16", know: "Volume of Prism, Structural Features of Prism, Area of Square, Properties of Square, Calculation of Proportion, Pythagorean Theorem", img: "static/image_3/3805_X6Y.png" },
    { label: "Step↑+Context↑", q: "An architect is selecting a decorative prism. After measurement, the base of the prism is a rectangle with a diagonal length of $L=2\\sqrt{2}$. The height of the prism is known to be h, $\\frac{2L}{h}=\\sqrt{2}$. Please help the architect calculate the volume of the prism to determine whether it is suitable for decoration.", a: "16", know: "Volume of Prism, Structural Features of Prism, Area of Square, Properties of Square, Calculation of Proportion, Pythagorean Theorem", img: "static/image_3/3805_X6.png" },
    { label: "Step↑+Visual↑+Context↑", q: "An architect is selecting a decorative component, he carved a regular tetrahedron from a prism. After measurement, the side length of the regular tetrahedron is $A = 3\\sqrt{2}$. In order to better evaluate the utilization rate of materials, please help the architect calculate the volume of the original prism.", a: "16", know: "Volume of Prism, Structural Features of Prism, Area of Square, Properties of Square, Calculation of Proportion, Pythagorean Theorem", img: "static/image_3/3805_X6Y.png" }
  ];

  // ======== 辅助数据 ========
  const extraData = [
    { label: "Visual↑", q: "The base area of ​​the prism is 4 and the height is 4. What is the volume of the prism?", a: "16", know: "Volume of Prism", img: "static/image_3/3805_Y.png" },
    { label: "Context↑", q: "An architect is selecting a decorative prism. It is known that the base area of ​​the component is 4 and the height is 4. What is the volume of the component?", a: "16", know: "Volume of Prism", img: "static/image_3/3805.png" }
  ];
  const extraDataVC = {
    label: "Visual↑+Context↑",
    q: "An architect is selecting a decorative prism. The component shown in the figure has a base area of ​​4 and a height of 4. What is the volume of the component?",
    a: "16",
    know: "Volume of Prism",
    img: "static/image_3/3805_X6.png"
  };

  const knowledgeAuxData = [
    { label: "Properties of Square", q: "As shown in the figure, how many axes of symmetry does square $OACD$ have?", a: "4", know: "Properties of Square", img: "static/image_3/k1.jpg" },
    { label: "Pythagorean Theorem", q: "Find the length of $AC$.", a: "5", know: "Pythagorean Theorem", img: "static/image_3/k2.jpg" },
    { label: "Calculation of Proportion", q: "As shown in the figure, the height to side $c$ of the triangle is $f$, and the height to side $a$ is $g$. Based on this information, which of the following proportions is correct? A. $c:a = f:g$ B. $a:c = f:g$ C. $a:f = g:c$", a: "B", know: "Calculation of Proportion", img: "static/image_3/k3.jpg" },
  ];

  // ======== 3D 难度空间点 ========
  const cubeData = [
    { label: "Seed", q: "", img: "static/image_3/3805.png", coord: [0,0,0] },
    { label: "Visual↑", q: "", img: "static/image_3/3805_Y.png", coord: [1,0,0] },
    { label: "Context↑", q: "", img: "static/image_3/3805.png", coord: [0,1,0] },
    { label: "Visual↑+Context↑", q: "", img: "static/image_3/3805_Y.png", coord: [1,1,0] },
    { label: "Step↑", q: "", img: "static/image_3/3805_X6.png", coord: [0,0,1] },
    { label: "Step↑+Visual↑", q: "", img: "static/image_3/3805_X6Y.png", coord: [1,0,1] },
    { label: "Step↑+Context↑", q: "", img: "static/image_3/3805_X6.png", coord: [0,1,1] },
    { label: "All↑", q: "", img: "static/image_3/3805_X6Y.png", coord: [1,1,1] }
  ];
  const flow2cube = [0,4,5,6,7];
  const flowIdx = [0,1,2,3,4];

  // ======== DOM 注入 ========
  function dclInsertMainHTML(){
    document.getElementById('dcl-demo').innerHTML = `
<div class="super-card">
  <div class="progress-bar-wrap">
    <div class="progress-bar-horizontal" id="progress-bar-main"></div>
    <div class="progress-bar-aux" id="progress-bar-aux"></div>
  </div>
  <div class="flex-container">
    <div class="left-col">
      <div class="left-title">Case Demonstration</div>
      <div class="case-card" id="case-card"></div>
      <div id="aux-block" class="aux-block" style="display:none;"></div>
      <div class="msg-tip" id="msg-tip">Click one of the buttons below to start the step-by-step demonstration.</div>
      <div id="btn-block">
        <button class="control-btn" id="btn-correct">Model Correct</button>
        <button class="control-btn" id="btn-wrong">Model Wrong</button>
      </div>
      <div id="aux-btn-block" style="display:none;">
        <button class="control-btn" id="btn-aux-finish">Finish Auxiliary Learning</button>
        <button class="control-btn" id="btn-aux-still-wrong" style="margin-left:8px; background:#f0594a;color:#fff; display:none;">Still Wrong</button>
        <button class="control-btn" id="btn-aux-correct" style="margin-left:8px; background:#2ca65c;color:#fff; display:none;">Model Correct</button>
      </div>
    </div>
    <div id="exit-modal" style="display:none; position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.12);z-index:99;justify-content:center;align-items:center;">
      <div style="background:#fff;padding:36px 32px 28px 32px;border-radius:18px;box-shadow:0 6px 40px #8ab3e355;max-width:340px;text-align:center;">
        <div id="exit-modal-text" style="font-size:1.15em;color:#245196;margin-bottom:23px;">Advance to the next seed question.</div>
        <button id="btn-exit-close" style="background:#2ca65c;color:#fff;padding:8px 30px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:1.04em;">Finish</button>
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

  // ======== 状态 ========
  let cur = 0, inAux = false;
  let errorCount = [0,0,0,0,0]; // 仅主流程错时累加
  const auxTypes = [null, 'K', 'V', 'C', null];

  // 辅助阶段状态（仅 cur===3 使用）
  let auxStage = null;          // 'VC' | 'C' | null
  let vcFinalCheck = false;     // VC 是否处于“最终检查”

  // ======== 工具 ========
  function showAuxButtons(showStillWrong = false, showCorrect = false, showFinish = true) {
    const block = document.querySelector('#dcl-demo #aux-btn-block');
    const btnStillWrong = document.querySelector('#dcl-demo #btn-aux-still-wrong');
    const btnFinish = document.querySelector('#dcl-demo #btn-aux-finish');
    const btnCorrect = document.querySelector('#dcl-demo #btn-aux-correct');
    block.style.display = "";
    btnStillWrong.style.display = showStillWrong ? "" : "none";
    btnCorrect.style.display = showCorrect ? "" : "none";
    btnFinish.style.display = showFinish ? "" : "none";
    document.querySelector('#dcl-demo #btn-block').style.display = "none";
  }

  function renderProgress(active, auxStep = null) {
    let mainHtml = '', auxHtml = '';
    const activeAuxSet = new Set(auxStep == null ? [] : (Array.isArray(auxStep) ? auxStep : [auxStep]));
    for(let i=0; i<flowIdx.length; ++i) {
      mainHtml += `<div class="prog-step${active===i?" active":""}">${demoData[flowIdx[i]].label}</div>`;
      auxHtml += auxTypes[i]
        ? `<div class="aux-dot${activeAuxSet.has(i)?' aux-dot-active':''}" data-type="${auxTypes[i]}">${auxTypes[i]}</div>`
        : `<div class="aux-dot-empty"></div>`;
      if(i<flowIdx.length-1){
        mainHtml += `<span class="prog-arrow">&#8594;</span>`;
        auxHtml += `<div class="aux-dash"></div>`;
      }
    }
    document.querySelector('#dcl-demo #progress-bar-main').innerHTML = mainHtml;
    document.querySelector('#dcl-demo #progress-bar-aux').innerHTML = auxHtml;
  }

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

  // ======== 辅助渲染 ========
  function renderAux(idx, type, showStillWrong=false) {
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
    showAuxButtons(showStillWrong, false, true);
    document.querySelector('#dcl-demo #msg-tip').textContent = `Complete the auxiliary learning, then retry this step.`;
  }

  function renderAuxVC() {
    const d = extraDataVC;
    let auxBlock = document.querySelector('#dcl-demo #aux-block');
    auxBlock.style.display = "";
    auxBlock.innerHTML = `
      <b>Auxiliary Learning:</b> Visual↑ + Context↑ ${vcFinalCheck ? '' : ''}<br>
      <div class="case-row" style="margin:12px 0 7px 0;">
        <img class="case-img" src="${d.img}" alt="" onerror="this.style.opacity=0;">
        <div class="case-content">
          <div class="case-q" style="font-size:1.06em;">${d.q}</div>
          <div class="case-meta"><b>Knowledge:</b> ${d.know}</div>
        </div>
      </div>
    `;
    showAuxButtons(true, false, true);
    document.querySelector('#dcl-demo #msg-tip').textContent = `If still wrong, click "Still Wrong".`;
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
    showAuxButtons(false, false, true);
    document.querySelector('#dcl-demo #msg-tip').textContent = `Complete all auxiliary learning, then retry this step.`;
  }

  function hideAux() {
    document.querySelector('#dcl-demo #aux-block').style.display="none";
    document.querySelector('#dcl-demo #aux-btn-block').style.display = "none";
    document.querySelector('#dcl-demo #btn-block').style.display = "";
    document.querySelector('#dcl-demo #btn-aux-still-wrong').style.display = "none";
    document.querySelector('#dcl-demo #btn-aux-correct').style.display = "none";
  }

  function showExitModal(text="Advance to the next seed question.") {
    let modal = document.querySelector('#dcl-demo #exit-modal');
    document.querySelector('#dcl-demo #exit-modal-text').textContent = text;
    modal.style.display = "flex";
  }
  function closeExitModal() {
    document.querySelector('#dcl-demo #exit-modal').style.display = "none";
  }

  // ======== 辅助阶段流转（仅 cur===3 用） ========
  function goToVC(finalCheck=false) {
    inAux = true;
    auxStage = 'VC';
    vcFinalCheck = !!finalCheck;
    renderProgress(cur, [2,3]);
    renderAuxVC();
    draw3D(flow2cube[cur], flow2cube[cur], 3);
  }
  function goToContext() {
    inAux = true;
    auxStage = 'C';
    vcFinalCheck = false;
    renderProgress(cur, 3);
    const d = extraData[1];
    let auxBlock = document.querySelector('#dcl-demo #aux-block');
    auxBlock.style.display = "";
    auxBlock.innerHTML =
      `<b>Auxiliary Learning:</b> Context Increment<br>
        <div class="case-row" style="margin:12px 0 7px 0;">
          <img class="case-img" src="${d.img}" alt="" onerror="this.style.opacity=0;">
          <div class="case-content">
            <div class="case-q" style="font-size:1.06em;">${d.q}</div>
            <div class="case-meta"><b>Knowledge:</b> ${d.know}</div>
          </div>
        </div>`;
    showAuxButtons(true, true, false); // Still Wrong + I Got It
    draw3D(flow2cube[cur], flow2cube[cur], 2);
    document.querySelector('#dcl-demo #msg-tip').textContent = `If correct, click "Model Correct". If still wrong, you'll exit.`;
  }

  // ======== 主交互 ========
  function userStep(isCorrect) {
    // 辅助阶段内交互
    if (inAux && cur === 3) {
      if (auxStage === 'VC') {
        if (isCorrect) {
          finishAux();
        } else {
          // *** 修复点 1：VC 处于 Final Check 且判错 -> 直接退出 ***
          if (vcFinalCheck) { showExitModal(); }
          else { goToContext(); }
        }
      } else if (auxStage === 'C') {
        if (isCorrect) {
          goToVC(true);
        } else {
          showExitModal();
        }
      }
      return;
    }
    if (inAux) return;

    // 主流程
    if (isCorrect) {
      if (cur < flowIdx.length - 1) {
        cur++;
        renderProgress(cur);
        renderCase(cur);
        highlight3D(cur);
        document.querySelector('#dcl-demo #msg-tip').textContent = `Continue to the next step.`;
      } else {
        highlight3D(cur);
        document.querySelector('#dcl-demo #msg-tip').innerHTML = `<b style="color:#2ca65c">All stages for this seed question completed! Proceeding to the next seed question! 🏆</b>`;
        document.querySelector('#dcl-demo #btn-block').style.display = "none";
      }
    } else {
      errorCount[cur] = (errorCount[cur] || 0) + 1;
      if (cur === 0 || cur === flowIdx.length-1) { showExitModal(); return; }
      if (errorCount[cur] >= 2) { showExitModal(); return; }
      if (cur === 3) { goToVC(false); return; }

      let auxType = auxTypes[cur];
      inAux = true;
      renderProgress(cur, cur);
      if(auxType === 'K') {
        renderAuxAll();
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

  // 结束辅助 -> 返回主流程
  function finishAux() {
    inAux = false;
    auxStage = null;
    vcFinalCheck = false;
    hideAux();
    document.querySelector('#dcl-demo #msg-tip').textContent = `Auxiliary learning completed. Please retry this step.`;
    highlight3D(cur);
  }

  // ======== 按钮：仍然错误 / 我做对了 ========
  function stillWrong() {
    if (!inAux || cur !== 3) return;
    if (auxStage === 'VC') {
      // *** 修复点 2：VC 处于 Final Check 且“仍然错误” -> 直接退出 ***
      if (vcFinalCheck) showExitModal();
      else goToContext();
    } else if (auxStage === 'C') {
      showExitModal();
    }
  }
  function cMarkCorrect() {
    if (!inAux || cur !== 3) return;
    if (auxStage === 'C') goToVC(true);
  }

  // ======== 3D 渲染 ========
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
      hoverinfo: "none"
    };
    var layout = {
      margin: { l: 20, r: 20, b: 20, t: 20 },
      scene: {
        xaxis: { title: { text: 'Visual', standoff: 2, font: { size: 13 } }, range: [-0.15, 1.15], tickvals: [-1, 1], showticklabels: false, backgroundcolor: '#fafdff' },
        yaxis: { title: { text: 'Contextual', standoff: 2, font: { size: 13 } }, range: [-0.15, 1.15], tickvals: [-1, 1], showticklabels: false, backgroundcolor: '#fafdff' },
        zaxis: { title: { text: 'Step', standoff: 2, font: { size: 13 } }, range: [-0.15, 1.15], tickvals: [-1, 1], showticklabels: false, backgroundcolor: '#fafdff' },
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
            draw3D(highlightIdx, idx);
          }
        });
      });
  }
  function highlight3D(curIdx) {
    draw3D(flow2cube[curIdx], flow2cube[curIdx]);
  }

  // ======== 事件 ========
  function dclInitEvents(){
    document.querySelector('#dcl-demo #btn-correct').onclick = function(){userStep(true);};
    document.querySelector('#dcl-demo #btn-wrong').onclick = function(){userStep(false);};
    document.querySelector('#dcl-demo #btn-aux-finish').onclick = function(){finishAux();};
    document.querySelector('#dcl-demo #btn-aux-still-wrong').onclick = function(){stillWrong();};
    document.querySelector('#dcl-demo #btn-aux-correct').onclick = function(){cMarkCorrect();};
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