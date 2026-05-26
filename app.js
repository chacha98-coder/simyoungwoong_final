document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const bottomNavButtons = document.querySelectorAll(".bottom-nav .nav-btn");

  const basicForm = document.getElementById("riskForm");
  const advancedForm = document.getElementById("advancedRiskForm");

  const resultCard = document.getElementById("resultCard");
  const resultModelName = document.getElementById("resultModelName");
  const resultGrade = document.getElementById("resultGrade");
  const resultBadge = document.getElementById("resultBadge");
  const resultText = document.getElementById("resultText");
  const factorList = document.getElementById("factorList");
  const urgentAlert = document.getElementById("urgentAlert");
  const gaugeLabel = document.getElementById("gaugeLabel");

  const homeGrade = document.getElementById("homeGrade");
  const homeMessage = document.getElementById("homeMessage");

  const reportBmi = document.getElementById("reportBmi");
  const bmiStatus = document.getElementById("bmiStatus");
  const reportHtn = document.getElementById("reportHtn");
  const reportSmoke = document.getElementById("reportSmoke");
  const reportFamily = document.getElementById("reportFamily");
  const healthScore = document.getElementById("healthScore");
  const scoreMessage = document.getElementById("scoreMessage");
  const alertList = document.getElementById("alertList");

  const MODEL_CONFIG = {
    basic: {
      label: "기본모델 분석 결과",
      gradeCuts: {
        good: 0.01,
        caution: 0.02,
        warning: 0.029023,
        danger: 0.08,
      },
    },

    advanced: {
      label: "심화모델 분석 결과",
      gradeCuts: {
        good: 0.01,
        caution: 0.02,
        warning: 0.0256,
        danger: 0.08,
      },
    },
  };

  function showPage(pageName) {
    screens.forEach((screen) => {
      screen.classList.remove("active");
    });

    const targetScreen = document.getElementById("page-" + pageName);

    if (targetScreen) {
      targetScreen.classList.add("active");
    }

    bottomNavButtons.forEach((btn) => {
      btn.classList.toggle("active-nav", btn.dataset.page === pageName);
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");

    if (!button) {
      return;
    }

    event.preventDefault();

    const pageName = button.dataset.page;

    if (!pageName) {
      return;
    }

    showPage(pageName);
  });

  function toNumber(id) {
    const element = document.getElementById(id);
    return element ? Number(element.value) : 0;
  }

  function checked(id) {
    const element = document.getElementById(id);
    return element && element.checked ? 1 : 0;
  }

  function calculateBMI(heightCm, weightKg) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  function sigmoid(logit) {
    return Math.exp(logit) / (1 + Math.exp(logit));
  }

  function getAgeDummies(age) {
    return {
      age40s: age >= 40 && age <= 49 ? 1 : 0,
      age50s: age >= 50 && age <= 59 ? 1 : 0,
      age60s: age >= 60 && age <= 69 ? 1 : 0,
      age70s: age >= 70 && age <= 79 ? 1 : 0,
      age80plus: age >= 80 ? 1 : 0,
    };
  }

  function getSmokingText(value) {
    if (value === "past") {
      return "과거흡연";
    }

    if (value === "current") {
      return "현재흡연";
    }

    return "비흡연";
  }

  function getEmergencyCount(formElement) {
    if (!formElement) {
      return 0;
    }

    return Array.from(formElement.querySelectorAll(".emergency")).filter((item) => item.checked).length;
  }

  function calculateBasicRiskProbability(data) {
    const age = getAgeDummies(data.age);

    const smokingPast = data.smoking === "past" ? 1 : 0;
    const smokingCurrent = data.smoking === "current" ? 1 : 0;

    const logit =
      -10.1944
      + 2.7592 * age.age40s
      + 3.9980 * age.age50s
      + 4.9085 * age.age60s
      + 5.6602 * age.age70s
      + 5.7334 * age.age80plus
      + 0.4277 * data.male
      + 0.0421 * data.bmi
      + 0.3759 * data.hypertension
      + 0.4107 * data.diabetes
      + 0.6572 * data.dyslipidemia
      + 0.5930 * data.stroke
      + 0.4333 * smokingPast
      + 0.4352 * smokingCurrent
      + 0.4237 * data.stress
      + 1.0754 * data.ihdFamily;

    return sigmoid(logit);
  }

  function calculateAdvancedRiskProbability(data) {
    const age = getAgeDummies(data.age);

    const bmiOver = data.bmi >= 25 && data.bmi < 30 ? 1 : 0;
    const bmiObese = data.bmi >= 30 ? 1 : 0;

    const bpHigh = data.sbp >= 140 || data.dbp >= 90 || data.bpMedication ? 1 : 0;

    const hbLow =
      (data.male === 1 && data.hb < 13.0) ||
      (data.male === 0 && data.hb < 12.0)
        ? 1
        : 0;

    const gluPre = data.glu >= 100 && data.glu < 126 ? 1 : 0;
    const gluDm = data.glu >= 126 ? 1 : 0;

    const hdlLow = data.hdl < 40 ? 1 : 0;
    const hdlMid = data.hdl >= 40 && data.hdl < 60 ? 1 : 0;

    const smokingPast = data.smoking === "past" ? 1 : 0;
    const smokingCurrent = data.smoking === "current" ? 1 : 0;

    const logit =
      -9.4889
      + 2.7821 * age.age40s
      + 4.1065 * age.age50s
      + 5.0844 * age.age60s
      + 5.8464 * age.age70s
      + 5.6842 * age.age80plus
      + 0.3104 * data.male
      + 0.6129 * data.stroke
      + 0.2744 * bmiOver
      + 0.5001 * bmiObese
      + 0.3413 * bpHigh
      + 0.4896 * hbLow
      + 0.1823 * gluPre
      + 0.2992 * gluDm
      + 0.3920 * hdlLow
      + 0.2758 * hdlMid
      + 1.1204 * data.ihdFamily
      + 0.4427 * smokingPast
      + 0.4045 * smokingCurrent
      + 0.4410 * data.stress;

    return sigmoid(logit);
  }

  function getRiskGrade(probability, modelType) {
    const cuts = MODEL_CONFIG[modelType].gradeCuts;

    if (probability < cuts.good) {
      return {
        level: 1,
        title: "양호 단계",
        message: "현재 위험도는 낮은 편입니다. 지금의 생활습관을 꾸준히 유지해 주세요.",
        gauge: "양호",
        score: 92,
      };
    }

    if (probability < cuts.caution) {
      return {
        level: 2,
        title: "주의 단계",
        message: "다소 주의가 필요합니다. 운동, 수면, 식습관을 점검해 보세요.",
        gauge: "주의",
        score: 78,
      };
    }

    if (probability < cuts.warning) {
      return {
        level: 3,
        title: "경고 단계",
        message: "위험군 기준 직전 단계입니다. 정기검진과 생활습관 개선을 권장합니다.",
        gauge: "경고",
        score: 62,
      };
    }

    if (probability < cuts.danger) {
      return {
        level: 4,
        title: "위험 단계",
        message: "위험군 기준에 해당합니다. 가까운 의료기관 또는 심장내과 상담을 권장합니다.",
        gauge: "위험",
        score: 45,
      };
    }

    return {
      level: 5,
      title: "매우 위험 단계",
      message: "높은 위험군으로 분류됩니다. 빠른 시일 내 의료기관 상담을 권장합니다.",
      gauge: "매우 위험",
      score: 28,
    };
  }

  function updateGradePills(grade) {
    const pills = document.querySelectorAll(".grade-pill");

    pills.forEach((pill) => {
      pill.classList.remove("active-pill");
    });

    const index = Math.max(0, grade.level - 1);

    if (pills[index]) {
      pills[index].classList.add("active-pill");
    }
  }

  function getBasicRiskFactors(data) {
    const factors = [];

    if (data.age >= 70) {
      factors.push(["연령", "70세 이상"]);
    } else if (data.age >= 60) {
      factors.push(["연령", "60세 이상"]);
    } else if (data.age >= 50) {
      factors.push(["연령", "50세 이상"]);
    }

    if (data.male) {
      factors.push(["성별", "남성"]);
    }

    if (data.bmi >= 25) {
      factors.push(["BMI", "비만 범위"]);
    }

    if (data.hypertension) {
      factors.push(["고혈압", "의사진단 있음"]);
    }

    if (data.diabetes) {
      factors.push(["당뇨병", "의사진단 있음"]);
    }

    if (data.dyslipidemia) {
      factors.push(["이상지질혈증", "의사진단 있음"]);
    }

    if (data.stroke) {
      factors.push(["뇌졸중", "의사진단 있음"]);
    }

    if (data.smoking === "past") {
      factors.push(["흡연상태", "과거흡연"]);
    }

    if (data.smoking === "current") {
      factors.push(["흡연상태", "현재흡연"]);
    }

    if (data.stress) {
      factors.push(["스트레스", "있음"]);
    }

    if (data.ihdFamily) {
      factors.push(["허혈성심질환 가족력", "있음"]);
    }

    if (factors.length === 0) {
      factors.push(["주요 위험요인", "뚜렷한 위험요인 없음"]);
    }

    return factors;
  }

  function getAdvancedRiskFactors(data) {
    const factors = [];

    if (data.age >= 70) {
      factors.push(["연령", "70세 이상"]);
    } else if (data.age >= 60) {
      factors.push(["연령", "60세 이상"]);
    } else if (data.age >= 50) {
      factors.push(["연령", "50세 이상"]);
    }

    if (data.male) {
      factors.push(["성별", "남성"]);
    }

    if (data.bmi >= 30) {
      factors.push(["BMI", "비만"]);
    } else if (data.bmi >= 25) {
      factors.push(["BMI", "과체중"]);
    }

    if (data.sbp >= 140 || data.dbp >= 90 || data.bpMedication) {
      factors.push(["혈압", "고혈압 또는 약 복용"]);
    }

    if (
      (data.male === 1 && data.hb < 13.0) ||
      (data.male === 0 && data.hb < 12.0)
    ) {
      factors.push(["혈색소", "낮음"]);
    }

    if (data.glu >= 126) {
      factors.push(["공복혈당", "당뇨병 의심"]);
    } else if (data.glu >= 100) {
      factors.push(["공복혈당", "공복혈당장애 의심"]);
    }

    if (data.hdl < 40) {
      factors.push(["HDL 콜레스테롤", "낮음"]);
    } else if (data.hdl < 60) {
      factors.push(["HDL 콜레스테롤", "보통"]);
    }

    if (data.stroke) {
      factors.push(["뇌졸중", "의사진단 있음"]);
    }

    if (data.ihdFamily) {
      factors.push(["허혈성심질환 가족력", "있음"]);
    }

    if (data.smoking === "past") {
      factors.push(["흡연상태", "과거흡연"]);
    }

    if (data.smoking === "current") {
      factors.push(["흡연상태", "현재흡연"]);
    }

    if (data.stress) {
      factors.push(["스트레스", "있음"]);
    }

    if (factors.length === 0) {
      factors.push(["주요 위험요인", "뚜렷한 위험요인 없음"]);
    }

    return factors;
  }

  function updateReport(data, grade, modelType) {
    if (reportBmi) {
      reportBmi.textContent = data.bmi.toFixed(1);
    }

    if (bmiStatus) {
      if (data.bmi >= 25) {
        bmiStatus.textContent = "주의";
        bmiStatus.className = "caution-text";
      } else {
        bmiStatus.textContent = "정상";
        bmiStatus.className = "ok";
      }
    }

    if (reportHtn) {
      if (modelType === "advanced") {
        const bpHigh = data.sbp >= 140 || data.dbp >= 90 || data.bpMedication;
        reportHtn.textContent = bpHigh ? "혈압 높음" : "정상 범위";
      } else {
        reportHtn.textContent = data.hypertension ? "있음" : "없음";
      }
    }

    if (reportSmoke) {
      reportSmoke.textContent = getSmokingText(data.smoking);
    }

    if (reportFamily) {
      reportFamily.textContent = data.ihdFamily ? "있음" : "없음";
    }

    if (healthScore) {
      healthScore.innerHTML = `${grade.score}<span>/100</span>`;
    }

    if (scoreMessage) {
      if (grade.level <= 2) {
        scoreMessage.textContent = "현재는 비교적 안정적인 상태입니다. 좋은 습관을 유지해 주세요.";
      } else if (grade.level === 3) {
        scoreMessage.textContent = "경고 단계입니다. 생활습관 개선과 정기검진을 권장합니다.";
      } else {
        scoreMessage.textContent = "위험군에 해당합니다. 의료기관 상담을 권장합니다.";
      }
    }
  }

  function updateAlert(grade, emergencyCount, modelType) {
    if (!alertList) {
      return;
    }

    let emergencyHtml = "";

    if (emergencyCount >= 2) {
      emergencyHtml = `
        <div class="alert-card red">
          <span>🚨</span>
          <div>
            <strong>응급 증상 경고</strong>
            <p>응급 의심 증상이 2개 이상입니다. 즉시 119 또는 가까운 응급실 방문을 권고합니다.</p>
          </div>
          <small>긴급</small>
        </div>
      `;
    }

    alertList.innerHTML = `
      ${emergencyHtml}

      <div class="alert-card red">
        <span>❤</span>
        <div>
          <strong>${MODEL_CONFIG[modelType].label}</strong>
          <p>${grade.message}</p>
        </div>
        <small>방금</small>
      </div>

      <div class="alert-card blue">
        <span>🏥</span>
        <div>
          <strong>진료 안내</strong>
          <p>위험 또는 매우 위험 단계는 심장내과 상담을 권장합니다.</p>
        </div>
        <small>안내</small>
      </div>

      <div class="alert-card green">
        <span>📈</span>
        <div>
          <strong>생활습관 관리</strong>
          <p>걷기, 금연, 저염식, 혈압관리, 스트레스 관리는 심혈관 건강관리에 도움이 됩니다.</p>
        </div>
        <small>오늘</small>
      </div>
    `;
  }

  function updateResultCardColor(grade) {
    if (!resultCard) {
      return;
    }

    resultCard.classList.remove(
      "grade-good",
      "grade-caution",
      "grade-warning",
      "grade-danger",
      "grade-severe"
    );

    const gradeClassMap = {
      1: "grade-good",
      2: "grade-caution",
      3: "grade-warning",
      4: "grade-danger",
      5: "grade-severe",
    };

    resultCard.classList.add(gradeClassMap[grade.level]);
  }

  function updateResultUI({ modelType, grade, factors, emergencyCount, data }) {
    if (resultModelName) {
      resultModelName.textContent = MODEL_CONFIG[modelType].label;
    }

    if (resultGrade) {
      resultGrade.textContent = grade.title;
    }

    if (resultBadge) {
      resultBadge.textContent = `${grade.level}단계`;
    }

    if (resultText) {
      resultText.textContent = grade.message;
    }

    if (gaugeLabel) {
      gaugeLabel.textContent = grade.gauge;
    }

    if (homeGrade) {
      homeGrade.textContent = grade.title;
    }

    if (homeMessage) {
      homeMessage.textContent = grade.message;
    }

    if (urgentAlert) {
      urgentAlert.classList.toggle("hidden", emergencyCount < 2);
    }

    if (factorList) {
      factorList.innerHTML = "<h3>주요 요인</h3>";

      factors.forEach(([name, value]) => {
        const row = document.createElement("div");
        row.className = "factor-item";
        row.innerHTML = `
          <span>${name}</span>
          <em>${value}</em>
        `;
        factorList.appendChild(row);
      });
    }

    updateResultCardColor(grade);
    updateGradePills(grade);
    updateReport(data, grade, modelType);
    updateAlert(grade, emergencyCount, modelType);
  }

  if (basicForm) {
    basicForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const age = toNumber("age");
      const height = toNumber("height");
      const weight = toNumber("weight");

      if (age < 19) {
        alert("본 모델은 19세 이상 성인을 기준으로 설계되었습니다.");
        return;
      }

      const bmi = calculateBMI(height, weight);

      const data = {
        age,
        bmi,
        male: document.getElementById("sex").value === "male" ? 1 : 0,
        hypertension: checked("hypertension"),
        diabetes: checked("diabetes"),
        dyslipidemia: checked("dyslipidemia"),
        stroke: checked("stroke"),
        stress: checked("stress"),
        ihdFamily: checked("family"),
        smoking: document.getElementById("smoking").value,
      };

      const probability = calculateBasicRiskProbability(data);
      const grade = getRiskGrade(probability, "basic");
      const factors = getBasicRiskFactors(data);
      const emergencyCount = getEmergencyCount(basicForm);

      updateResultUI({
        modelType: "basic",
        grade,
        factors,
        emergencyCount,
        data,
      });

      showPage("result");
    });
  }

  if (advancedForm) {
    advancedForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const age = toNumber("advAge");
      const height = toNumber("advHeight");
      const weight = toNumber("advWeight");

      if (age < 19) {
        alert("본 모델은 19세 이상 성인을 기준으로 설계되었습니다.");
        return;
      }

      const bmi = calculateBMI(height, weight);

      const data = {
        age,
        bmi,
        male: document.getElementById("advSex").value === "male" ? 1 : 0,
        sbp: toNumber("advSbp"),
        dbp: toNumber("advDbp"),
        hb: toNumber("advHb"),
        glu: toNumber("advGlu"),
        hdl: toNumber("advHdl"),
        bpMedication: checked("advBpMed"),
        stroke: checked("advStroke"),
        stress: checked("advStress"),
        ihdFamily: checked("advFamily"),
        smoking: document.getElementById("advSmoking").value,
      };

      const probability = calculateAdvancedRiskProbability(data);
      const grade = getRiskGrade(probability, "advanced");
      const factors = getAdvancedRiskFactors(data);
      const emergencyCount = getEmergencyCount(advancedForm);

      updateResultUI({
        modelType: "advanced",
        grade,
        factors,
        emergencyCount,
        data,
      });

      showPage("result");
    });
  }

  showPage("start");
});
