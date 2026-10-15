/**
 * 학생 탐구 노트(노트테이킹) 및 데이터 관리 시스템
 * - LocalStorage 자동 저장 및 복원
 * - 시뮬레이션 측정값 표 자동 기록
 * - 서술형 및 퀴즈 답안 관리
 * - 종합 탐구 보고서 출력 및 PDF 인쇄
 */

const STORAGE_KEY = 'science_gas_laws_notebook_v1';

// 기본 데이터 모델
const defaultNotebookData = {
  student: {
    grade: '중학교 1',
    classNum: '1',
    studentNum: '1',
    name: '학생'
  },
  boyleActivity: {
    table: [
      { vol: 20, press: 1.00, pv: 20.0 },
      { vol: 18, press: 1.11, pv: 20.0 },
      { vol: 16, press: 1.25, pv: 20.0 },
      { vol: 14, press: 1.43, pv: 20.0 },
      { vol: 12, press: 1.67, pv: 20.0 },
      { vol: 10, press: 2.00, pv: 20.0 }
    ],
    q1: '기체의 부피가 줄어들수록 압력 센서의 압력 값은 점점 커진다.',
    q2: '압력과 부피를 곱한 값(P × V)은 약 20으로 거의 일정하게 유지된다.',
    q3: '온도가 일정할 때 일정량의 기체의 부피는 압력에 반비례한다 (보일의 법칙).'
  },
  boyleParticle: {
    table: {
      size: '변하지 않는다',
      count: '변하지 않는다',
      speed: '변하지 않는다',
      collision: '많아진다 (증가한다)'
    },
    description: '피스톤을 누르는 압력이 커지면 기체 입자의 개수나 운동 빠르기는 변하지 않지만, 기체의 부피가 줄어들어 기체 입자가 주사기 안의 벽면에 충돌하는 횟수가 증가하므로 기체의 압력이 커진다.',
    quiz1: '줄어들',
    quiz2: '늘어난'
  },
  charlesActivity: {
    table: [
      { temp: 10, pipette: 0.00 },
      { temp: 20, pipette: 0.75 },
      { temp: 30, pipette: 1.50 },
      { temp: 40, pipette: 2.25 },
      { temp: 50, pipette: 3.00 },
      { temp: 60, pipette: 3.75 }
    ],
    q1: '물의 온도가 높아질수록 피펫 속 색소 방울이 위로 올라가 눈금 값이 커지고, 온도가 낮아지면 색소 방울이 아래로 내려온다.',
    q2: '온도가 높아지면 기체의 부피가 일정하게 증가하고, 온도가 낮아지면 부피가 일정하게 감소한다.',
    q3: '압력이 일정할 때 일정량의 기체의 부피는 온도에 비례하여 증가한다 (샤를의 법칙).'
  },
  charlesParticle: {
    table: {
      size: '변하지 않는다',
      count: '변하지 않는다',
      speed: '온도가 높을수록 빨라진다',
      collisionForce: '온도가 높을수록 세진다'
    },
    description: '기체의 온도가 높아지면 기체 입자의 개수는 변하지 않지만, 기체 입자 운동의 빠르기가 빨라지면서 입자가 유리병 안의 벽면에 충돌하는 세기가 커져 밖으로 밀어내므로 기체의 부피가 늘어난다.',
    quiz1: '빨라',
    quiz2: '커',
    quiz3: '늘어난'
  }
};

class NotebookManager {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    // 기본 데이터 복제
    return JSON.parse(JSON.stringify(defaultNotebookData));
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notifySaveStatus();
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  notifySaveStatus() {
    document.querySelectorAll('.save-status').forEach((el) => {
      el.textContent = '✓ 실시간 자동 저장됨';
      el.style.opacity = '1';
      setTimeout(() => {
        el.style.opacity = '0.7';
      }, 1500);
    });
  }

  resetAll() {
    if (confirm('모든 실험 데이터와 작성한 탐구 노트를 처음 상태로 초기화할까요?')) {
      this.data = JSON.parse(JSON.stringify(defaultNotebookData));
      this.saveData();
      location.reload();
    }
  }

  // 보일 활동하기 표에 데이터 추가/업데이트
  addBoyleRecord(vol, press) {
    const pv = +(vol * press).toFixed(2);
    // 기존 부피와 같은 게 있으면 업데이트, 없으면 추가
    const existingIndex = this.data.boyleActivity.table.findIndex(item => item.vol === vol);
    if (existingIndex >= 0) {
      this.data.boyleActivity.table[existingIndex] = { vol, press, pv };
    } else {
      this.data.boyleActivity.table.push({ vol, press, pv });
      this.data.boyleActivity.table.sort((a, b) => b.vol - a.vol); // 부피 내림차순
    }
    this.saveData();
  }

  // 샤를 활동하기 표에 데이터 추가/업데이트
  addCharlesRecord(temp, pipette) {
    const existingIndex = this.data.charlesActivity.table.findIndex(item => item.temp === temp);
    if (existingIndex >= 0) {
      this.data.charlesActivity.table[existingIndex] = { temp, pipette };
    } else {
      this.data.charlesActivity.table.push({ temp, pipette });
      this.data.charlesActivity.table.sort((a, b) => a.temp - b.temp); // 온도 오름차순
    }
    this.saveData();
  }
}

window.notebookManager = new NotebookManager();
