/**
 * 중학교 과학 탐구 시뮬레이션 물리 및 캔버스 렌더링 엔진
 * - BoyleActivitySim (디지털 압력 센서 및 주사기)
 * - BoyleParticleSim (주사기 속 입자 충돌 및 부피)
 * - CharlesActivitySim (비커 속 플라스크, 디지털 온도계, 피펫 잉크 이동)
 * - CharlesParticleSim (온도에 따른 기체 입자 속도 및 충돌 세기)
 * - SimpleScienceChart (Canvas 기반 독립형 고해상도 그래프 렌더러)
 */

// =================== 1. Canvas 독립형 과학 그래프 렌더러 ===================
class SimpleScienceChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.xLabel = options.xLabel || 'X';
    this.yLabel = options.yLabel || 'Y';
    this.xMin = options.xMin ?? 0;
    this.xMax = options.xMax ?? 30;
    this.yMin = options.yMin ?? 0;
    this.yMax = options.yMax ?? 3;
    this.xStep = options.xStep ?? 5;
    this.yStep = options.yStep ?? 0.5;
    this.curveType = options.curveType || 'none'; // 'inverse' (보일), 'linear' (샤를)
    this.kValue = options.kValue || 20; // P*V = 20
    this.slope = options.slope || 0.05; // Charles slope
    this.intercept = options.intercept || 0;
    this.points = []; // [{x, y, label}]
    this.color = options.color || '#0284c7';
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 400) * dpr;
    this.canvas.height = (rect.height || 240) * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width || 400;
    this.h = rect.height || 240;
    this.padding = { top: 25, right: 30, bottom: 45, left: 55 };
    this.plotW = this.w - this.padding.left - this.padding.right;
    this.plotH = this.h - this.padding.top - this.padding.bottom;
    this.render();
  }

  setPoints(pts) {
    this.points = pts;
    this.render();
  }

  addPoint(x, y, label = '') {
    this.points.push({ x, y, label });
    this.points.sort((a, b) => a.x - b.x);
    this.render();
  }

  clearPoints() {
    this.points = [];
    this.render();
  }

  toScreenX(x) {
    return this.padding.left + ((x - this.xMin) / (this.xMax - this.xMin)) * this.plotW;
  }

  toScreenY(y) {
    return this.padding.top + (1 - (y - this.yMin) / (this.yMax - this.yMin)) * this.plotH;
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.w, this.h);

    // 그리드 & Y축 눈금
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let y = this.yMin; y <= this.yMax + 0.0001; y += this.yStep) {
      const sy = this.toScreenY(y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, sy);
      ctx.lineTo(this.w - this.padding.right, sy);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.fillText(Number(y.toFixed(2)).toString(), this.padding.left - 8, sy);
    }

    // 그리드 & X축 눈금
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = this.xMin; x <= this.xMax + 0.0001; x += this.xStep) {
      const sx = this.toScreenX(x);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, this.padding.top);
      ctx.lineTo(sx, this.h - this.padding.bottom);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.fillText(Number(x.toFixed(1)).toString(), sx, this.h - this.padding.bottom + 8);
    }

    // 축 선
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top);
    ctx.lineTo(this.padding.left, this.h - this.padding.bottom);
    ctx.lineTo(this.w - this.padding.right, this.h - this.padding.bottom);
    ctx.stroke();

    // 축 라벨
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.xLabel, this.padding.left + this.plotW / 2, this.h - 15);

    ctx.save();
    ctx.translate(15, this.padding.top + this.plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this.yLabel, 0, 0);
    ctx.restore();

    // 이론 곡선/직선 가이드 (데이터가 2개 이상일 때 보조선)
    if (this.points.length >= 2) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      if (this.curveType === 'inverse') {
        let first = true;
        for (let x = Math.max(5, this.xMin); x <= this.xMax; x += 0.5) {
          const y = this.kValue / x;
          if (y <= this.yMax && y >= this.yMin) {
            const sx = this.toScreenX(x);
            const sy = this.toScreenY(y);
            if (first) { ctx.moveTo(sx, sy); first = false; }
            else { ctx.lineTo(sx, sy); }
          }
        }
      } else if (this.curveType === 'linear') {
        const sx1 = this.toScreenX(this.xMin);
        const sy1 = this.toScreenY(this.intercept + this.slope * this.xMin);
        const sx2 = this.toScreenX(this.xMax);
        const sy2 = this.toScreenY(this.intercept + this.slope * this.xMax);
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 측정 데이터 포인트 렌더링
    this.points.forEach((pt) => {
      const sx = this.toScreenX(pt.x);
      const sy = this.toScreenY(pt.y);

      // 점 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.arc(sx + 1, sy + 1, 6, 0, Math.PI * 2);
      ctx.fill();

      // 점 외곽선 & 본체
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 수치 툴팁 라벨
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`(${pt.x}, ${pt.y})`, sx, sy - 10);
    });
  }
}

// =================== 2. 보일의 법칙: 활동하기 시뮬레이터 ===================
class BoyleActivitySim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.volume = 20; // 10 ~ 20 mL
    this.pressure = 1.00; // atm
    this.isSensorOn = true;
    this.particles = [];
    this.numParticles = 24;

    this.initParticles();
    this.resize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 600) * dpr;
    this.canvas.height = (rect.height || 380) * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width || 600;
    this.h = rect.height || 380;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 4.5
      });
    }
  }

  setVolume(vol) {
    this.volume = Math.max(10, Math.min(20, vol));
    // 보일의 법칙: P1 * V1 = P2 * V2 -> 1.00 * 20 = P * V
    this.pressure = +(20.0 / this.volume).toFixed(2);
    if (this.onUpdate) this.onUpdate(this.volume, this.pressure);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // 캔버스 내 피스톤 드래그 상호작용
    let isDragging = false;
    const handleMove = (clientX, clientY) => {
      if (!isDragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      // 피스톤 슬라이드 범위 매핑
      const minX = 220; // 10 mL 위치
      const maxX = 350; // 20 mL 위치
      const clampedX = Math.max(minX, Math.min(maxX, x));
      const frac = (clampedX - minX) / (maxX - minX);
      const newVol = +(10 + frac * 10).toFixed(1);
      this.setVolume(newVol);
    };

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => { isDragging = false; });

    // 터치 지원 (태블릿/스마트기기)
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        isDragging = true;
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
  }

  animate() {
    this.updateParticles();
    this.render();
    requestAnimationFrame(this.animate);
  }

  updateParticles() {
    this.particles.forEach((p) => {
      p.x += p.vx * 0.012;
      p.y += p.vy * 0.012;
      if (p.x < 0.05) { p.x = 0.05; p.vx *= -1; }
      if (p.x > 0.95) { p.x = 0.95; p.vx *= -1; }
      if (p.y < 0.08) { p.y = 0.08; p.vy *= -1; }
      if (p.y > 0.92) { p.y = 0.92; p.vy *= -1; }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // 1. 실험대 배경
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, this.w, this.h);

    // 바닥면 섀도우
    const gradient = ctx.createLinearGradient(0, this.h - 60, 0, this.h);
    gradient.addColorStop(0, '#e2e8f0');
    gradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.h - 50, this.w, 50);

    // 2. 스마트 기기 (태블릿 압력 센서 모니터 - 교과서 p1 재현)
    const tabletX = 40;
    const tabletY = 40;
    const tabletW = 220;
    const tabletH = 220;

    // 태블릿 외형 (베젤)
    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, tabletX, tabletY, tabletW, tabletH, 14);
    ctx.fill();

    // 태블릿 화면
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, tabletX + 10, tabletY + 10, tabletW - 20, tabletH - 20, 8);
    ctx.fill();

    // 태블릿 상단 바
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(tabletX + 10, tabletY + 10, tabletW - 20, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('디지털 압력 센서 v2.4', tabletX + 20, tabletY + 27);

    // 태블릿 디스플레이 내용
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('현재 측정 압력', tabletX + 22, tabletY + 62);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px monospace';
    const dispP = this.isSensorOn ? this.pressure.toFixed(2) : '---';
    ctx.fillText(dispP, tabletX + 22, tabletY + 105);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('atm', tabletX + 160, tabletY + 105);

    // 구분선
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(tabletX + 20, tabletY + 125);
    ctx.lineTo(tabletX + tabletW - 20, tabletY + 125);
    ctx.stroke();

    // 하단 정보: 부피 및 P*V
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('주사기 부피 (V):', tabletX + 22, tabletY + 150);
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${this.volume.toFixed(1)} mL`, tabletX + 130, tabletY + 150);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('압력 × 부피 (P×V):', tabletX + 22, tabletY + 175);
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 12px monospace';
    const pv = (this.pressure * this.volume).toFixed(1);
    ctx.fillText(`≈ ${pv}`, tabletX + 130, tabletY + 175);

    // 센서 연결 표시
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(tabletX + tabletW - 25, tabletY + 23, 4, 0, Math.PI * 2);
    ctx.fill();

    // 3. 센서 연결선 (태블릿 -> 주사기 노즐)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(tabletX + tabletW, tabletY + tabletH / 2);
    ctx.bezierCurveTo(tabletX + tabletW + 40, tabletY + tabletH / 2, 280, 200, 310, 180);
    ctx.stroke();

    // 4. 압력 센서 모듈
    const sensorX = 310;
    const sensorY = 160;
    ctx.fillStyle = '#334155';
    this.roundRect(ctx, sensorX, sensorY, 45, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('SENSOR', sensorX + 6, sensorY + 24);

    // 5. 플라스틱 주사기 (교과서 규격: 20 mL)
    const syringeX = 355;
    const syringeY = 145;
    const syringeW = 180;
    const syringeH = 70;

    // 주사기 노즐
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(syringeX, syringeY + syringeH / 2 - 8, 15, 16);

    // 주사기 몸체 (투명 플라스틱)
    ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, syringeX + 15, syringeY, syringeW, syringeH, 4);
    ctx.fill();
    ctx.stroke();

    // 주사기 속 공기 입자 렌더링 영역
    // 부피 10 mL일 때 피스톤 위치: 약 50% 지점, 20 mL일 때: 100% 지점
    const pistonRatio = (this.volume - 10) / 10; // 0 (10mL) ~ 1 (20mL)
    const airWidth = 70 + pistonRatio * 85;
    const airX = syringeX + 16;
    const airY = syringeY + 3;
    const airH = syringeH - 6;

    // 공기 챔버 배경 하이라이트
    ctx.fillStyle = 'rgba(186, 230, 253, 0.3)';
    ctx.fillRect(airX, airY, airWidth, airH);

    // 입자 그리기
    ctx.save();
    ctx.beginPath();
    ctx.rect(airX, airY, airWidth, airH);
    ctx.clip();

    this.particles.forEach((p) => {
      const px = airX + p.x * airWidth;
      const py = airY + p.y * airH;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // 입자 광택
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - 1.5, py - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 피스톤 고무 패킹 & 축
    const pistonHeadX = airX + airWidth;
    ctx.fillStyle = '#334155';
    this.roundRect(ctx, pistonHeadX, syringeY + 2, 16, syringeH - 4, 3);
    ctx.fill();

    // 피스톤 밀대 (플라스틱 막대)
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(pistonHeadX + 16, syringeY + syringeH / 2 - 12, 90, 24);
    ctx.strokeRect(pistonHeadX + 16, syringeY + syringeH / 2 - 12, 90, 24);

    // 피스톤 손잡이 (누르는 손)
    ctx.fillStyle = '#94a3b8';
    this.roundRect(ctx, pistonHeadX + 104, syringeY - 5, 16, syringeH + 10, 4);
    ctx.fill();

    // 압력 방향 화살표 표시
    if (this.volume < 20) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      const arrowX = pistonHeadX + 135;
      const arrowY = syringeY + syringeH / 2;
      ctx.beginPath();
      ctx.moveTo(arrowX + 25, arrowY);
      ctx.lineTo(arrowX, arrowY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + 10, arrowY - 8);
      ctx.lineTo(arrowX + 10, arrowY + 8);
      ctx.fill();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('누르는 힘(압력)', arrowX - 10, arrowY - 18);
    }

    // 주사기 눈금자 (교과서: 10, 12, 14, 16, 18, 20 mL)
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';

    const marks = [
      { vol: 10, frac: 0 },
      { vol: 12, frac: 0.2 },
      { vol: 14, frac: 0.4 },
      { vol: 16, frac: 0.6 },
      { vol: 18, frac: 0.8 },
      { vol: 20, frac: 1.0 }
    ];

    marks.forEach((m) => {
      const mx = airX + 70 + m.frac * 85;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx, syringeY);
      ctx.lineTo(mx, syringeY + 12);
      ctx.stroke();
      ctx.fillText(`${m.vol}`, mx, syringeY + 23);
    });

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#0369a1';
    ctx.fillText('20 mL 주사기', syringeX + 25, syringeY + syringeH + 20);

    // 손 드래그 안내 캡션
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('💡 피스톤을 마우스나 터치로 밀어 부피를 조절해 보세요!', syringeX - 30, syringeY + syringeH + 45);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// =================== 3. 보일의 법칙: 해보기 시뮬레이터 (입자 모형) ===================
class BoyleParticleSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mode = 'compare'; // 'compare' (가 vs 나 나란히) 또는 'interactive' (실시간 조절)
    this.volume = 60; // 30 ~ 60 mL
    this.numParticles = 10; // 교과서 그림에 10개 입자 등장!
    this.particles = [];
    this.particlesA = []; // 가: 60 mL
    this.particlesB = []; // 나: 30 mL
    this.collisionCountA = 0;
    this.collisionCountB = 0;
    this.collisionsLastSecA = 0;
    this.collisionsLastSecB = 0;
    this.lastTime = performance.now();

    this.initParticles();
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 600) * dpr;
    this.canvas.height = (rect.height || 400) * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width || 600;
    this.h = rect.height || 400;
  }

  createParticleSet(speed) {
    const arr = [];
    for (let i = 0; i < this.numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      arr.push({
        x: 0.15 + Math.random() * 0.7,
        y: 0.15 + Math.random() * 0.7,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7,
        flash: 0
      });
    }
    return arr;
  }

  initParticles() {
    // 온도가 일정하므로 기본 속도(운동 빠르기)는 양쪽 모두 2.0으로 동일함! (교과서 핵심 포인트)
    this.particlesA = this.createParticleSet(2.2);
    this.particlesB = this.createParticleSet(2.2);
  }

  animate(now) {
    const dt = (now - this.lastTime) / 1000;
    if (dt >= 1.0) {
      this.collisionsLastSecA = Math.round(this.collisionCountA / dt);
      this.collisionsLastSecB = Math.round(this.collisionCountB / dt);
      this.collisionCountA = 0;
      this.collisionCountB = 0;
      this.lastTime = now;
      if (this.onCollisionUpdate) {
        this.onCollisionUpdate(this.collisionsLastSecA, this.collisionsLastSecB);
      }
    }

    this.updateParticles(this.particlesA, 1.0, 'A'); // 부피 60 mL
    this.updateParticles(this.particlesB, 0.5, 'B'); // 부피 30 mL

    this.render();
    requestAnimationFrame(this.animate);
  }

  updateParticles(arr, volumeScale, which) {
    arr.forEach((p) => {
      p.x += p.vx * 0.006;
      p.y += p.vy * 0.006;

      let hit = false;
      // 좌우 벽면
      if (p.x < 0.08) { p.x = 0.08; p.vx *= -1; hit = true; }
      if (p.x > 0.92) { p.x = 0.92; p.vx *= -1; hit = true; }
      // 상하 벽면 (volumeScale에 따라 높이 제한)
      if (p.y < 0.08) { p.y = 0.08; p.vy *= -1; hit = true; }
      if (p.y > volumeScale * 0.92) { p.y = volumeScale * 0.92; p.vy *= -1; hit = true; }

      if (hit) {
        p.flash = 1.0;
        if (which === 'A') this.collisionCountA++;
        if (which === 'B') this.collisionCountB++;
      }
      if (p.flash > 0) p.flash -= 0.08;
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const halfW = this.w / 2;

    // (가) 피스톤 누르기 전 (60 mL)
    this.renderSyringe(ctx, 30, 20, halfW - 40, this.h - 50, '(가) 피스톤을 누르기 전', '부피: 60 mL (1기압)', 1.0, this.particlesA, false);

    // (나) 피스톤을 누른 후 (30 mL)
    this.renderSyringe(ctx, halfW + 10, 20, halfW - 40, this.h - 50, '(나) 피스톤을 누른 후', '부피: 30 mL (2기압)', 0.5, this.particlesB, true);
  }

  renderSyringe(ctx, x, y, w, h, title, subtitle, volRatio, particles, isPressed) {
    // 카드 배경
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // 제목 라벨
    ctx.fillStyle = isPressed ? '#0369a1' : '#334155';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(title, x + 15, y + 25);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(subtitle, x + 15, y + 42);

    // 주사기 기둥 박스
    const syrW = w * 0.65;
    const syrH = h - 130;
    const syrX = x + (w - syrW) / 2;
    const syrY = y + 60;

    // 주사기 외형 (아래쪽 팁)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(syrX + syrW / 2 - 12, syrY + syrH, 24, 20);

    // 주사기 실린더 벽
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(240, 249, 255, 0.6)';
    ctx.strokeRect(syrX, syrY, syrW, syrH);
    ctx.fillRect(syrX, syrY, syrW, syrH);

    // 피스톤 위치 계산
    const chamberH = syrH * volRatio;
    const pistonY = syrY + (syrH - chamberH);

    // 피스톤 헤드
    ctx.fillStyle = '#475569';
    ctx.fillRect(syrX + 2, pistonY - 14, syrW - 4, 14);

    // 피스톤 밀대 (위쪽으로 뻗음)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(syrX + syrW / 2 - 15, y + 5, 30, pistonY - y - 10);

    // 피스톤 손잡이
    ctx.fillStyle = '#94a3b8';
    this.roundRect(ctx, syrX + syrW / 2 - 35, y + 5, 70, 10, 3);
    ctx.fill();

    // 누르는 힘 화살표 (isPressed 일 때)
    if (isPressed) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      const arrowX = syrX + syrW / 2;
      const arrowY = y + 20;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX, arrowY + 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 22);
      ctx.lineTo(arrowX - 6, arrowY + 14);
      ctx.lineTo(arrowX + 6, arrowY + 14);
      ctx.fill();
    }

    // 주사기 눈금 (교과서처럼 20, 40, 60 mL 표시)
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    const marks = [
      { vol: 60, ratio: 1.0 },
      { vol: 40, ratio: 0.66 },
      { vol: 20, ratio: 0.33 }
    ];
    marks.forEach(m => {
      const my = syrY + syrH * (1 - m.ratio);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(syrX, my);
      ctx.lineTo(syrX + 12, my);
      ctx.stroke();
      ctx.fillText(`${m.vol}`, syrX - 4, my + 3);
    });
    ctx.textAlign = 'left';

    // 기체 입자 렌더링 (챔버 내부 클리핑)
    ctx.save();
    ctx.beginPath();
    ctx.rect(syrX + 3, pistonY, syrW - 6, chamberH - 2);
    ctx.clip();

    particles.forEach((p) => {
      const px = syrX + 8 + p.x * (syrW - 16);
      const py = pistonY + 6 + (p.y / volRatio) * (chamberH - 12);

      // 충돌 반짝임 이펙트
      if (p.flash > 0) {
        ctx.fillStyle = `rgba(56, 189, 248, ${p.flash * 0.6})`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 입자 본체
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // 입자 하이라이트
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // 속도 벡터 화살표 (화살표 길이는 온도가 같으므로 동일!)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + p.vx * 6, py + p.vy * 6);
      ctx.stroke();
    });
    ctx.restore();

    // 하단 상태 배지
    const badgeY = h - 22;
    ctx.fillStyle = isPressed ? '#e0f2fe' : '#f1f5f9';
    this.roundRect(ctx, x + 12, badgeY, w - 24, 24, 6);
    ctx.fill();

    ctx.fillStyle = isPressed ? '#0369a1' : '#475569';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    const collCount = isPressed ? this.collisionsLastSecB : this.collisionsLastSecA;
    ctx.fillText(`입자 수: 10개 | 충돌 횟수: 약 ${collCount * 3}회/초`, x + w / 2, badgeY + 15);
    ctx.textAlign = 'left';
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// =================== 4. 샤를의 법칙: 활동하기 시뮬레이터 ===================
class CharlesActivitySim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.temp = 20; // 10 ~ 60 ℃
    this.pipetteVal = 0.0; // 0.0 ~ 5.0 mL
    this.bubbles = [];

    this.calculatePipette();
    this.initBubbles();
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 600) * dpr;
    this.canvas.height = (rect.height || 400) * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width || 600;
    this.h = rect.height || 400;
  }

  initBubbles() {
    this.bubbles = [];
    for (let i = 0; i < 8; i++) {
      this.bubbles.push({
        x: Math.random(),
        y: Math.random(),
        r: 1.5 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.8
      });
    }
  }

  setTemperature(t) {
    this.temp = Math.max(10, Math.min(60, t));
    this.calculatePipette();
    if (this.onUpdate) this.onUpdate(this.temp, this.pipetteVal);
  }

  calculatePipette() {
    // 10℃일 때 0.0 mL, 60℃일 때 약 3.8 mL (선형 비례 팽창)
    // 샤를의 법칙 V = V0(1 + t/273)
    const baseT = 10;
    const deltaT = this.temp - baseT;
    this.pipetteVal = +(deltaT * 0.075).toFixed(2);
  }

  animate() {
    // 비커 물 기포 애니메이션
    this.bubbles.forEach((b) => {
      b.y -= (0.003 * b.speed) * (this.temp / 25);
      if (b.y < 0) { b.y = 1.0; b.x = Math.random(); }
    });

    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // 1. 실험대 배경
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, this.w, this.h);

    // 테이블 면
    const grad = ctx.createLinearGradient(0, this.h - 50, 0, this.h);
    grad.addColorStop(0, '#fed7aa');
    grad.addColorStop(1, '#fdba74');
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.h - 50, this.w, 50);

    // 2. 실험 스탠드 철봉
    const standBaseX = 40;
    const standBaseY = this.h - 50;
    ctx.fillStyle = '#475569';
    ctx.fillRect(standBaseX, standBaseY - 8, 120, 8); // 스탠드 받침
    ctx.fillRect(standBaseX + 25, 30, 10, standBaseY - 38); // 기둥

    // 3. 500 mL 비커 & 물 (중앙 배치)
    const beakerX = 180;
    const beakerY = this.h - 230;
    const beakerW = 190;
    const beakerH = 175;

    // 비커 속 물 색상 (온도에 따라 푸른빛 -> 붉은빛)
    const tempFrac = (this.temp - 10) / 50; // 0 ~ 1
    const waterR = Math.round(180 + tempFrac * 60);
    const waterG = Math.round(220 - tempFrac * 80);
    const waterB = Math.round(250 - tempFrac * 120);

    ctx.fillStyle = `rgba(${waterR}, ${waterG}, ${waterB}, 0.55)`;
    ctx.fillRect(beakerX + 6, beakerY + 30, beakerW - 12, beakerH - 32);

    // 비커 수면 파동 및 기포
    ctx.fillStyle = `rgba(${waterR - 20}, ${waterG - 20}, ${waterB - 20}, 0.7)`;
    ctx.fillRect(beakerX + 6, beakerY + 28, beakerW - 12, 4);

    // 기포
    if (this.temp > 35) {
      this.bubbles.forEach((b) => {
        const bx = beakerX + 15 + b.x * (beakerW - 30);
        const by = beakerY + 35 + b.y * (beakerH - 45);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // 비커 외곽 유리벽
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(beakerX, beakerY);
    ctx.lineTo(beakerX, beakerY + beakerH);
    ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
    ctx.lineTo(beakerX + beakerW, beakerY);
    ctx.stroke();

    // 비커 눈금
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      const my = beakerY + beakerH - i * 32;
      ctx.beginPath();
      ctx.moveTo(beakerX + beakerW - 20, my);
      ctx.lineTo(beakerX + beakerW, my);
      ctx.stroke();
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText('500 mL 비커', beakerX + beakerW - 75, beakerY + 20);

    // 4. 물속 20 mL 유리병 (삼각플라스크 / 둥근 병)
    const flaskX = beakerX + 50;
    const flaskY = beakerY + 65;
    const flaskW = 80;
    const flaskH = 100;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // 플라스크 몸통
    ctx.moveTo(flaskX + 25, flaskY);
    ctx.lineTo(flaskX + 55, flaskY);
    ctx.lineTo(flaskX + flaskW, flaskY + flaskH);
    ctx.lineTo(flaskX, flaskY + flaskH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('유리병 (20 mL)', flaskX + 12, flaskY + flaskH - 12);

    // 고무마개
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(flaskX + 26, flaskY - 14, 28, 14);

    // 5. 플라스틱 피펫 (5 mL 눈금관) - 고무마개를 뚫고 위로 길게 솟음
    const pipX = flaskX + 38;
    const pipY = 30;
    const pipW = 10;
    const pipH = flaskY - 30;

    // 피펫 관 본체
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(pipX, pipY, pipW, pipH);
    ctx.strokeRect(pipX, pipY, pipW, pipH);

    // 피펫 눈금 그리기
    for (let mL = 0; mL <= 5; mL++) {
      const my = pipY + pipH - 15 - mL * 24;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pipX, my);
      ctx.lineTo(pipX + 6, my);
      ctx.stroke();
    }

    // 피펫 속 액체 색소 방울 (빨간 잉크)
    // 0.0 mL일 때 아래쪽(pipY + pipH - 15), 5.0 mL일 때 위쪽(pipY + 10)
    const maxDropTravel = 120;
    const dropTravelY = (this.pipetteVal / 5.0) * maxDropTravel;
    const dropY = pipY + pipH - 22 - dropTravelY;

    // 빨간 색소 방울
    ctx.fillStyle = '#dc2626';
    this.roundRect(ctx, pipX + 1, dropY, pipW - 2, 14, 3);
    ctx.fill();

    // 스탠드 클램프 (피펫 고정 집게)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(standBaseX + 30, pipY + 80, pipX - (standBaseX + 30), 8);
    ctx.fillRect(pipX - 4, pipY + 76, 18, 16);

    // 6. 디지털 온도계 (비커 물에 꽂힘)
    const thermX = beakerX + 145;
    const thermY = beakerY - 50;

    // 온도계 프로브 봉
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(thermX + 8, thermY + 40, 6, 120);

    // 디지털 본체
    ctx.fillStyle = '#dc2626';
    this.roundRect(ctx, thermX - 10, thermY, 44, 45, 6);
    ctx.fill();

    // 온도계 LCD 창
    ctx.fillStyle = '#0f172a';
    this.roundRect(ctx, thermX - 6, thermY + 6, 36, 24, 4);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.temp.toFixed(1)}`, thermX + 12, thermY + 22);
    ctx.textAlign = 'left';

    // 7. 우측 상단: 피펫 눈금 확대경 뷰 (Magnifier View)
    const magX = 405;
    const magY = 35;
    const magW = 165;
    const magH = 210;

    // 확대경 컨테이너
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 2;
    this.roundRect(ctx, magX, magY, magW, magH, 12);
    ctx.fill();
    ctx.stroke();

    // 돋보기 헤더
    ctx.fillStyle = '#ea580c';
    this.roundRect(ctx, magX, magY, magW, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('🔍 피펫 눈금 정밀 확대경', magX + 12, magY + 17);

    // 확대경 내부 관
    const tubeX = magX + 65;
    const tubeY = magY + 35;
    const tubeW = 28;
    const tubeH = 135;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.fillRect(tubeX, tubeY, tubeW, tubeH);
    ctx.strokeRect(tubeX, tubeY, tubeW, tubeH);

    // 확대 눈금 (현재 값 주변을 크게 표시)
    ctx.fillStyle = '#1e293b';
    ctx.font = '10px sans-serif';

    const centerVal = this.pipetteVal;
    for (let delta = -2; delta <= 2; delta += 0.5) {
      const v = +(centerVal + delta).toFixed(1);
      if (v < 0 || v > 5) continue;
      const my = tubeY + tubeH / 2 - delta * 24;
      if (my >= tubeY && my <= tubeY + tubeH) {
        ctx.strokeStyle = Number.isInteger(v) ? '#0f172a' : '#94a3b8';
        ctx.lineWidth = Number.isInteger(v) ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(tubeX, my);
        ctx.lineTo(tubeX + (Number.isInteger(v) ? 14 : 7), my);
        ctx.stroke();

        ctx.fillText(`${v}`, tubeX - 25, my + 4);
      }
    }

    // 확대경 속 액체 색소 위치
    const magDropY = tubeY + tubeH / 2 - 10;
    ctx.fillStyle = '#ef4444';
    this.roundRect(ctx, tubeX + 2, magDropY, tubeW - 4, 20, 4);
    ctx.fill();

    // 돋보기 기준선 화살표
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(tubeX + tubeW + 8, tubeY + tubeH / 2);
    ctx.lineTo(tubeX + tubeW + 18, tubeY + tubeH / 2 - 6);
    ctx.lineTo(tubeX + tubeW + 18, tubeY + tubeH / 2 + 6);
    ctx.fill();

    // 확대경 하단 수치 캡션
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`현재 눈금: ${this.pipetteVal.toFixed(2)} mL`, magX + magW / 2, magY + magH - 12);
    ctx.textAlign = 'left';

    // 8. 하단 안내문
    ctx.fillStyle = '#7c2d12';
    ctx.font = '11px sans-serif';
    ctx.fillText('💡 온도가 올라가면 플라스크 속 공기가 팽창하여 피펫 속 색소 방울을 밀어 올립니다.', 40, this.h - 18);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// =================== 5. 샤를의 법칙: 해보기 시뮬레이터 (입자 운동 빠르기) ===================
class CharlesParticleSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.numParticles = 10; // 교과서 그림 10개 입자
    this.particlesA = []; // 가: 고온 (60℃)
    this.particlesB = []; // 나: 저온 (15℃)

    this.initParticles();
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 600) * dpr;
    this.canvas.height = (rect.height || 400) * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width || 600;
    this.h = rect.height || 400;
  }

  createParticleSet(speed) {
    const arr = [];
    for (let i = 0; i < this.numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      arr.push({
        x: 0.15 + Math.random() * 0.7,
        y: 0.15 + Math.random() * 0.7,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed: speed,
        radius: 7,
        flash: 0
      });
    }
    return arr;
  }

  initParticles() {
    // (가) 고온(60℃): 입자 운동이 매우 빠름 (화살표 길고 활발!)
    // (나) 저온(15℃): 입자 운동이 둔하고 느림 (화살표 짧고 둔함!)
    this.particlesA = this.createParticleSet(3.4);
    this.particlesB = this.createParticleSet(1.2);
  }

  animate() {
    this.updateParticles(this.particlesA);
    this.updateParticles(this.particlesB);
    this.render();
    requestAnimationFrame(this.animate);
  }

  updateParticles(arr) {
    arr.forEach((p) => {
      p.x += p.vx * 0.005;
      p.y += p.vy * 0.005;

      let hit = false;
      if (p.x < 0.1) { p.x = 0.1; p.vx *= -1; hit = true; }
      if (p.x > 0.9) { p.x = 0.9; p.vx *= -1; hit = true; }
      if (p.y < 0.1) { p.y = 0.1; p.vy *= -1; hit = true; }
      if (p.y > 0.9) { p.y = 0.9; p.vy *= -1; hit = true; }

      if (hit) p.flash = 1.0;
      if (p.flash > 0) p.flash -= 0.08;
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const halfW = this.w / 2;

    // (가) 온도가 내려가기 전 (60 ℃)
    this.renderFlaskModel(
      ctx,
      25, 20, halfW - 35, this.h - 45,
      '(가) 온도가 내려가기 전',
      '수온: 60 ℃ (고온)',
      this.particlesA,
      3.4,
      'high'
    );

    // (나) 온도가 내려간 후 (15 ℃)
    this.renderFlaskModel(
      ctx,
      halfW + 10, 20, halfW - 35, this.h - 45,
      '(나) 온도가 내려간 후',
      '수온: 15 ℃ (저온)',
      this.particlesB,
      1.2,
      'low'
    );
  }

  renderFlaskModel(ctx, x, y, w, h, title, subtitle, particles, speed, tempType) {
    const isHigh = tempType === 'high';

    // 카드 배경
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = isHigh ? '#fed7aa' : '#e2e8f0';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // 타이틀
    ctx.fillStyle = isHigh ? '#ea580c' : '#0369a1';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(title, x + 15, y + 25);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(subtitle, x + 15, y + 42);

    // 유리병 실루엣 (교과서 p3 그림 형태)
    const bottleW = w * 0.65;
    const bottleH = h - 145;
    const bottleX = x + (w - bottleW) / 2;
    const bottleY = y + 70;

    // 유리병 위 피펫 관 및 잉크 위치
    const pipW = 10;
    const pipH = 45;
    const pipX = bottleX + bottleW / 2 - pipW / 2;
    const pipY = bottleY - pipH;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(pipX, pipY, pipW, pipH);
    ctx.strokeRect(pipX, pipY, pipW, pipH);

    // 피펫 잉크 위치 (고온일 때 위쪽, 저온일 때 아래쪽!)
    const inkY = isHigh ? pipY + 8 : pipY + 28;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(pipX + 1, inkY, pipW - 2, 10);

    // 고무마개
    ctx.fillStyle = '#334155';
    ctx.fillRect(pipX - 4, bottleY - 6, pipW + 8, 8);

    // 유리병 본체
    ctx.fillStyle = isHigh ? 'rgba(255, 237, 213, 0.4)' : 'rgba(240, 249, 255, 0.5)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, bottleX, bottleY, bottleW, bottleH, 16);
    ctx.fill();
    ctx.stroke();

    // 입자 렌더링 영역 (유리병 내부 클리핑)
    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, bottleX + 4, bottleY + 4, bottleW - 8, bottleH - 8, 12);
    ctx.clip();

    particles.forEach((p) => {
      const px = bottleX + 15 + p.x * (bottleW - 30);
      const py = bottleY + 15 + p.y * (bottleH - 30);

      // 충돌 반짝임
      if (p.flash > 0) {
        ctx.fillStyle = isHigh ? `rgba(239, 68, 68, ${p.flash * 0.6})` : `rgba(56, 189, 248, ${p.flash * 0.6})`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 입자 본체
      ctx.fillStyle = isHigh ? '#ea580c' : '#0284c7';
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // 광택
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // 속도 벡터 화살표 (고온은 화살표가 2배 길고 굵음!)
      const arrowLen = isHigh ? 10 : 4;
      ctx.strokeStyle = isHigh ? '#dc2626' : '#0284c7';
      ctx.lineWidth = isHigh ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + p.vx * arrowLen, py + p.vy * arrowLen);
      ctx.stroke();

      // 화살촉
      const headAngle = Math.atan2(p.vy, p.vx);
      const tipX = px + p.vx * arrowLen;
      const tipY = py + p.vy * arrowLen;
      ctx.fillStyle = isHigh ? '#dc2626' : '#0284c7';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - 5 * Math.cos(headAngle - 0.4), tipY - 5 * Math.sin(headAngle - 0.4));
      ctx.lineTo(tipX - 5 * Math.cos(headAngle + 0.4), tipY - 5 * Math.sin(headAngle + 0.4));
      ctx.fill();
    });
    ctx.restore();

    // 하단 상태 메트릭
    const badgeY = h - 22;
    ctx.fillStyle = isHigh ? '#ffedd5' : '#e0f2fe';
    this.roundRect(ctx, x + 10, badgeY, w - 20, 24, 6);
    ctx.fill();

    ctx.fillStyle = isHigh ? '#c2410c' : '#0369a1';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    const textSpeed = isHigh ? '매우 빠름 (활발)' : '느림 (둔함)';
    const textForce = isHigh ? '매우 큼 (강하게 침)' : '작음 (약하게 침)';
    ctx.fillText(`빠르기: ${textSpeed} | 충돌 세기: ${textForce}`, x + w / 2, badgeY + 15);
    ctx.textAlign = 'left';
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// 브라우저 전역에 노출
window.SimpleScienceChart = SimpleScienceChart;
window.BoyleActivitySim = BoyleActivitySim;
window.BoyleParticleSim = BoyleParticleSim;
window.CharlesActivitySim = CharlesActivitySim;
window.CharlesParticleSim = CharlesParticleSim;
