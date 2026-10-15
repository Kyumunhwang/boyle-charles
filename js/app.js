/**
 * 중학교 과학 탐구 시뮬레이션 메인 컨트롤러 (app.js)
 * 페이지 전환, 시뮬레이터 인스턴스 관리, 차트 및 탐구 노트 실시간 연동
 */

document.addEventListener('DOMContentLoaded', () => {
  const nm = window.notebookManager;

  // 시뮬레이터 인스턴스 저장소
  let boyleActSim = null;
  let boylePartSim = null;
  let charlesActSim = null;
  let charlesPartSim = null;

  let boyleChart = null;
  let charlesChart = null;

  // ================= 1. 페이지 내비게이션 & 라우팅 =================
  const views = {
    'home': document.getElementById('view-home'),
    'boyle-activity': document.getElementById('view-boyle-activity'),
    'boyle-particle': document.getElementById('view-boyle-particle'),
    'charles-activity': document.getElementById('view-charles-activity'),
    'charles-particle': document.getElementById('view-charles-particle'),
    'full-notebook': document.getElementById('view-full-notebook')
  };

  const navButtons = document.querySelectorAll('[data-route]');

  function navigateTo(route) {
    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].classList.toggle('active', key === route);
      }
    });

    // 상단 네비게이션 버튼 active 클래스 갱신
    navButtons.forEach(btn => {
      const target = btn.getAttribute('data-route');
      const isLawMatch = (route.startsWith('boyle') && target === 'boyle') ||
                         (route.startsWith('charles') && target === 'charles') ||
                         (route === target);
      btn.classList.toggle('active', isLawMatch);
    });

    // 화면 진입 시 해당 시뮬레이터 리사이즈 및 초기화
    setTimeout(() => {
      if (route === 'boyle-activity') {
        if (!boyleActSim) initBoyleActivity();
        else boyleActSim.resize();
        if (boyleChart) boyleChart.resize();
      } else if (route === 'boyle-particle') {
        if (!boylePartSim) initBoyleParticle();
        else boylePartSim.resize();
      } else if (route === 'charles-activity') {
        if (!charlesActSim) initCharlesActivity();
        else charlesActSim.resize();
        if (charlesChart) charlesChart.resize();
      } else if (route === 'charles-particle') {
        if (!charlesPartSim) initCharlesParticle();
        else charlesPartSim.resize();
      } else if (route === 'full-notebook') {
        renderFullNotebook();
      }
    }, 50);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // data-route 클릭 리스너 연결
  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const route = el.getAttribute('data-route');
      if (route === 'boyle') navigateTo('boyle-activity');
      else if (route === 'charles') navigateTo('charles-activity');
      else navigateTo(route);
    });
  });

  // ================= 2. 학생 정보 관리 =================
  const studentGradeInput = document.getElementById('student-grade');
  const studentNameInput = document.getElementById('student-name');

  if (studentGradeInput && studentNameInput) {
    studentGradeInput.value = `${nm.data.student.grade} ${nm.data.student.classNum}반 ${nm.data.student.studentNum}번`;
    studentNameInput.value = nm.data.student.name;

    studentNameInput.addEventListener('input', (e) => {
      nm.data.student.name = e.target.value;
      nm.saveData();
    });
  }

  // ================= 3. 보일의 법칙: 활동하기 초기화 =================
  function initBoyleActivity() {
    boyleActSim = new BoyleActivitySim('canvas-boyle-act');

    // 차트 초기화
    boyleChart = new SimpleScienceChart('canvas-boyle-chart', {
      xLabel: '부피 V (mL)',
      yLabel: '압력 P (atm)',
      xMin: 8,
      xMax: 24,
      yMin: 0.5,
      yMax: 2.5,
      xStep: 2,
      yStep: 0.5,
      curveType: 'inverse',
      kValue: 20,
      color: '#0284c7'
    });

    const slider = document.getElementById('slider-boyle-vol');
    const valDisplay = document.getElementById('val-boyle-vol');
    const presDisplay = document.getElementById('val-boyle-pres');
    const pvDisplay = document.getElementById('val-boyle-pv');

    // 시뮬레이터 업데이트 콜백
    boyleActSim.onUpdate = (vol, pres) => {
      if (slider) slider.value = vol;
      if (valDisplay) valDisplay.textContent = `${vol.toFixed(1)} mL`;
      if (presDisplay) presDisplay.innerHTML = `${pres.toFixed(2)} <span class="meter-unit">atm</span>`;
      if (pvDisplay) pvDisplay.textContent = `${(vol * pres).toFixed(1)}`;
      const dispV = document.getElementById('disp-boyle-v');
      if (dispV) dispV.innerHTML = `${vol.toFixed(1)} <span class="meter-unit">mL</span>`;
    };

    // 슬라이더 입력 시
    if (slider) {
      slider.addEventListener('input', (e) => {
        boyleActSim.setVolume(parseFloat(e.target.value));
      });
    }

    // 프리셋 버튼
    document.querySelectorAll('[data-boyle-vol]').forEach(btn => {
      btn.addEventListener('click', () => {
        const vol = parseFloat(btn.getAttribute('data-boyle-vol'));
        boyleActSim.setVolume(vol);
        document.querySelectorAll('[data-boyle-vol]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // 데이터 기록 버튼
    const btnRecord = document.getElementById('btn-boyle-record');
    if (btnRecord) {
      btnRecord.addEventListener('click', () => {
        nm.addBoyleRecord(boyleActSim.volume, boyleActSim.pressure);
        updateBoyleTable();
      });
    }

    // 힌트 토글
    setupHintToggles('view-boyle-activity');

    // 노트 입력 필드 바인딩
    bindNoteTextarea('boyle-q1', nm.data.boyleActivity, 'q1');
    bindNoteTextarea('boyle-q2', nm.data.boyleActivity, 'q2');
    bindNoteTextarea('boyle-q3', nm.data.boyleActivity, 'q3');

    updateBoyleTable();
  }

  function updateBoyleTable() {
    const tbody = document.getElementById('tbody-boyle-act');
    if (!tbody) return;

    tbody.innerHTML = '';
    const pts = [];

    nm.data.boyleActivity.table.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${row.vol} mL</strong></td>
        <td>${row.press.toFixed(2)}</td>
        <td><span style="color:#16a34a; font-weight:bold;">${row.pv.toFixed(1)}</span></td>
        <td><button class="btn-del" data-boyle-del="${idx}" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:11px;">✕</button></td>
      `;
      tbody.appendChild(tr);
      pts.push({ x: row.vol, y: row.press });
    });

    if (boyleChart) {
      boyleChart.setPoints(pts);
    }

    // 삭제 버튼 리스너
    tbody.querySelectorAll('[data-boyle-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-boyle-del'));
        nm.data.boyleActivity.table.splice(idx, 1);
        nm.saveData();
        updateBoyleTable();
      });
    });
  }

  // ================= 4. 보일의 법칙: 해보기 초기화 =================
  function initBoyleParticle() {
    boylePartSim = new BoyleParticleSim('canvas-boyle-part');

    // 셀렉트 박스 바인딩 (입자의 크기, 개수, 운동 빠르기, 충돌 횟수)
    bindNoteSelect('boyle-part-size', nm.data.boyleParticle.table, 'size');
    bindNoteSelect('boyle-part-count', nm.data.boyleParticle.table, 'count');
    bindNoteSelect('boyle-part-speed', nm.data.boyleParticle.table, 'speed');
    bindNoteSelect('boyle-part-collision', nm.data.boyleParticle.table, 'collision');

    // 서술형 텍스트 박스
    bindNoteTextarea('boyle-part-desc', nm.data.boyleParticle, 'description');

    // 스스로 평가하기 퀴즈 셀렉트
    bindNoteSelect('boyle-quiz-1', nm.data.boyleParticle, 'quiz1', checkBoyleQuiz);
    bindNoteSelect('boyle-quiz-2', nm.data.boyleParticle, 'quiz2', checkBoyleQuiz);

    setupHintToggles('view-boyle-particle');
    checkBoyleQuiz();
  }

  function checkBoyleQuiz() {
    const q1 = document.getElementById('boyle-quiz-1');
    const q2 = document.getElementById('boyle-quiz-2');
    const feedback = document.getElementById('boyle-quiz-feedback');
    if (!q1 || !q2 || !feedback) return;

    if (q1.value === '줄어들' && q2.value === '늘어난') {
      feedback.textContent = '🎉 정답입니다! 압력이 커지면 부피는 줄어들고, 압력이 작아지면 부피는 늘어납니다.';
      feedback.style.color = '#16a34a';
    } else {
      feedback.textContent = '선택한 보기를 확인해 보세요. (압력이 커질 때와 작아질 때의 부피 변화)';
      feedback.style.color = '#64748b';
    }
  }

  // ================= 5. 샤를의 법칙: 활동하기 초기화 =================
  function initCharlesActivity() {
    charlesActSim = new CharlesActivitySim('canvas-charles-act');

    // 샤를 차트 (온도 vs 피펫 눈금 선형 그래프)
    charlesChart = new SimpleScienceChart('canvas-charles-chart', {
      xLabel: '온도 T (℃)',
      yLabel: '피펫 눈금 V (mL)',
      xMin: 0,
      xMax: 70,
      yMin: 0,
      yMax: 5.0,
      xStep: 10,
      yStep: 1.0,
      curveType: 'linear',
      slope: 0.075,
      intercept: -0.75,
      color: '#ea580c'
    });

    const slider = document.getElementById('slider-charles-temp');
    const valDisplay = document.getElementById('val-charles-temp');
    const pipDisplay = document.getElementById('val-charles-pip');

    charlesActSim.onUpdate = (temp, pip) => {
      if (slider) slider.value = temp;
      if (valDisplay) valDisplay.textContent = `${temp.toFixed(1)} ℃`;
      if (pipDisplay) pipDisplay.innerHTML = `${pip.toFixed(2)} <span class="meter-unit">mL</span>`;
      const dispT = document.getElementById('disp-charles-t');
      if (dispT) dispT.innerHTML = `${temp.toFixed(1)} <span class="meter-unit">℃</span>`;
      const valExp = document.getElementById('val-charles-exp');
      if (valExp) valExp.innerHTML = `+${pip.toFixed(2)} <span class="meter-unit">mL</span>`;
    };

    if (slider) {
      slider.addEventListener('input', (e) => {
        charlesActSim.setTemperature(parseFloat(e.target.value));
      });
    }

    // 프리셋 버튼
    document.querySelectorAll('[data-charles-temp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = parseFloat(btn.getAttribute('data-charles-temp'));
        charlesActSim.setTemperature(t);
        document.querySelectorAll('[data-charles-temp]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // 데이터 기록 버튼
    const btnRecord = document.getElementById('btn-charles-record');
    if (btnRecord) {
      btnRecord.addEventListener('click', () => {
        nm.addCharlesRecord(charlesActSim.temp, charlesActSim.pipetteVal);
        updateCharlesTable();
      });
    }

    setupHintToggles('view-charles-activity');

    // 질문지 바인딩
    bindNoteTextarea('charles-q1', nm.data.charlesActivity, 'q1');
    bindNoteTextarea('charles-q2', nm.data.charlesActivity, 'q2');
    bindNoteTextarea('charles-q3', nm.data.charlesActivity, 'q3');

    updateCharlesTable();
  }

  function updateCharlesTable() {
    const tbody = document.getElementById('tbody-charles-act');
    if (!tbody) return;

    tbody.innerHTML = '';
    const pts = [];

    nm.data.charlesActivity.table.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${row.temp} ℃</strong></td>
        <td><span style="color:#ea580c; font-weight:bold;">${row.pipette.toFixed(2)} mL</span></td>
        <td><button class="btn-del" data-charles-del="${idx}" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:11px;">✕</button></td>
      `;
      tbody.appendChild(tr);
      pts.push({ x: row.temp, y: row.pipette });
    });

    if (charlesChart) {
      charlesChart.setPoints(pts);
    }

    tbody.querySelectorAll('[data-charles-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-charles-del'));
        nm.data.charlesActivity.table.splice(idx, 1);
        nm.saveData();
        updateCharlesTable();
      });
    });
  }

  // ================= 6. 샤를의 법칙: 해보기 초기화 =================
  function initCharlesParticle() {
    charlesPartSim = new CharlesParticleSim('canvas-charles-part');

    // 4대 관찰표 바인딩
    bindNoteSelect('charles-part-size', nm.data.charlesParticle.table, 'size');
    bindNoteSelect('charles-part-count', nm.data.charlesParticle.table, 'count');
    bindNoteSelect('charles-part-speed', nm.data.charlesParticle.table, 'speed');
    bindNoteSelect('charles-part-force', nm.data.charlesParticle.table, 'collisionForce');

    // 서술형
    bindNoteTextarea('charles-part-desc', nm.data.charlesParticle, 'description');

    // 스스로 평가하기 퀴즈
    bindNoteSelect('charles-quiz-1', nm.data.charlesParticle, 'quiz1', checkCharlesQuiz);
    bindNoteSelect('charles-quiz-2', nm.data.charlesParticle, 'quiz2', checkCharlesQuiz);
    bindNoteSelect('charles-quiz-3', nm.data.charlesParticle, 'quiz3', checkCharlesQuiz);

    setupHintToggles('view-charles-particle');
    checkCharlesQuiz();
  }

  function checkCharlesQuiz() {
    const q1 = document.getElementById('charles-quiz-1');
    const q2 = document.getElementById('charles-quiz-2');
    const q3 = document.getElementById('charles-quiz-3');
    const feedback = document.getElementById('charles-quiz-feedback');
    if (!q1 || !q2 || !q3 || !feedback) return;

    if (q1.value === '빨라' && q2.value === '커' && q3.value === '늘어난') {
      feedback.textContent = '🎉 정답입니다! 온도가 높아지면 입자 운동이 빨라지고 충돌 세기가 커져 부피가 늘어납니다.';
      feedback.style.color = '#16a34a';
    } else {
      feedback.textContent = '선택한 보기를 확인해 보세요. (온도 상승 시 입자의 운동, 충돌 세기, 부피 변화)';
      feedback.style.color = '#64748b';
    }
  }

  // ================= 7. 전체 탐구 노트 (종합 학습지) 렌더링 =================
  function renderFullNotebook() {
    const container = document.getElementById('report-content-body');
    if (!container) return;

    const data = nm.data;

    // 메타데이터 갱신
    const repNum = document.getElementById('rep-student-num');
    const repName = document.getElementById('rep-student-name');
    const repDate = document.getElementById('rep-date');
    if (repNum) {
      const gInput = document.getElementById('student-grade');
      repNum.textContent = gInput ? gInput.value : `${data.student.grade} ${data.student.classNum}반 ${data.student.studentNum}번`;
    }
    if (repName) {
      const nInput = document.getElementById('student-name');
      repName.textContent = nInput ? nInput.value : data.student.name;
    }
    if (repDate) {
      const now = new Date();
      repDate.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    }

    let boyleTableRows = '';
    data.boyleActivity.table.forEach(r => {
      boyleTableRows += `<tr><td>${r.vol} mL</td><td>${r.press.toFixed(2)} atm</td><td>${r.pv.toFixed(1)}</td></tr>`;
    });

    let charlesTableRows = '';
    data.charlesActivity.table.forEach(r => {
      charlesTableRows += `<tr><td>${r.temp} ℃</td><td>${r.pipette.toFixed(2)} mL</td></tr>`;
    });

    container.innerHTML = `
      <div class="report-section">
        <h3 class="report-section-title" style="border-color: #0284c7;">1. 보일의 법칙 (기체의 압력과 부피 관계)</h3>
        
        <div class="report-sub-box">
          <h4>[탐구 활동하기] 디지털 압력 센서를 이용한 기체의 부피 변화</h4>
          <p style="font-size:0.85rem; color:#475569; margin-bottom:8px;"><strong>실험 데이터 표:</strong></p>
          <table class="note-table" style="margin-bottom:12px;">
            <thead>
              <tr><th>주사기 부피 (mL)</th><th>측정 압력 (atm)</th><th>압력 × 부피 (P × V)</th></tr>
            </thead>
            <tbody>${boyleTableRows}</tbody>
          </table>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Q1. 부피에 따른 압력 변화:</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">${escapeHtml(data.boyleActivity.q1)}</div>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Q2. 압력과 부피의 곱(P × V)의 특징:</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">${escapeHtml(data.boyleActivity.q2)}</div>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Q3. 결론 (기체의 압력과 부피 관계):</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem;">${escapeHtml(data.boyleActivity.q3)}</div>
        </div>

        <div class="report-sub-box">
          <h4>[탐구 해보기] 기체의 압력에 따른 부피 변화를 입자 모형으로 해석하기</h4>
          <table class="note-table" style="margin-bottom:12px;">
            <thead>
              <tr><th>구분</th><th>입자의 크기</th><th>입자의 개수</th><th>입자의 운동 빠르기</th><th>벽면 충돌 횟수</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>(가) → (나) 변화</td>
                <td><strong>${data.boyleParticle.table.size}</strong></td>
                <td><strong>${data.boyleParticle.table.count}</strong></td>
                <td><strong>${data.boyleParticle.table.speed}</strong></td>
                <td><strong>${data.boyleParticle.table.collision}</strong></td>
              </tr>
            </tbody>
          </table>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>과학적 설명 (핵심 용어 포함):</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem; line-height:1.6;">${escapeHtml(data.boyleParticle.description)}</div>
        </div>
      </div>

      <div class="report-section">
        <h3 class="report-section-title" style="border-color: #ea580c;">2. 샤를의 법칙 (기체의 온도와 부피 관계)</h3>
        
        <div class="report-sub-box">
          <h4>[탐구 활동하기] 온도에 따른 기체의 부피 변화 (피펫 색소 이동)</h4>
          <p style="font-size:0.85rem; color:#475569; margin-bottom:8px;"><strong>실험 데이터 표:</strong></p>
          <table class="note-table" style="margin-bottom:12px;">
            <thead>
              <tr><th>물의 온도 (℃)</th><th>피펫 눈금 (mL)</th></tr>
            </thead>
            <tbody>${charlesTableRows}</tbody>
          </table>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Q1. 온도에 따른 피펫 색소 위치 변화:</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">${escapeHtml(data.charlesActivity.q1)}</div>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Q2. 온도가 낮아지거나 높아질 때 부피 변화:</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">${escapeHtml(data.charlesActivity.q2)}</div>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Q3. 결론 (기체의 온도와 부피 관계):</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem;">${escapeHtml(data.charlesActivity.q3)}</div>
        </div>

        <div class="report-sub-box">
          <h4>[탐구 해보기] 기체의 온도에 따른 부피 변화를 입자 모형으로 해석하기</h4>
          <table class="note-table" style="margin-bottom:12px;">
            <thead>
              <tr><th>구분</th><th>입자의 크기</th><th>입자의 개수</th><th>입자의 운동 빠르기</th><th>벽면 충돌 세기</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>(가) → (나) 변화</td>
                <td><strong>${data.charlesParticle.table.size}</strong></td>
                <td><strong>${data.charlesParticle.table.count}</strong></td>
                <td><strong>${data.charlesParticle.table.speed}</strong></td>
                <td><strong>${data.charlesParticle.table.collisionForce}</strong></td>
              </tr>
            </tbody>
          </table>
          <p style="font-size:0.85rem; margin-bottom:4px;"><strong>과학적 설명 (핵심 용어 포함):</strong></p>
          <div style="background:#fff; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:0.85rem; line-height:1.6;">${escapeHtml(data.charlesParticle.description)}</div>
        </div>
      </div>
    `;
  }

  // ================= 8. 유틸리티 함수 =================
  function bindNoteTextarea(id, obj, prop) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = obj[prop] || '';
    el.addEventListener('input', (e) => {
      obj[prop] = e.target.value;
      nm.saveData();
    });
  }

  function bindNoteSelect(id, obj, prop, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = obj[prop] || '';
    el.addEventListener('change', (e) => {
      obj[prop] = e.target.value;
      nm.saveData();
      if (callback) callback();
    });
  }

  function setupHintToggles(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.hint-toggle-btn').forEach(btn => {
      btn.onclick = () => {
        const hint = btn.nextElementSibling;
        if (hint && hint.classList.contains('hint-content')) {
          hint.classList.toggle('open');
          btn.innerHTML = hint.classList.contains('open') ? '💡 힌트/예시 답안 닫기 ▲' : '💡 힌트/예시 답안 확인 ▼';
        }
      };
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/\n/g, '<br>');
  }

  // 인쇄 버튼 리스너
  const btnPrint = document.getElementById('btn-print-report');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // 초기화 버튼
  const btnReset = document.getElementById('btn-reset-all');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      nm.resetAll();
    });
  }

  // 초기 페이지 설정 (기본은 'home')
  navigateTo('home');
});
