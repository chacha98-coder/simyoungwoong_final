function $(id) {
  return document.getElementById(id);
}

function value(id) {
  return $(id).value;
}

function num(id) {
  var v = parseFloat($(id).value);
  return Number.isFinite(v) ? v : null;
}

function mapSex(v) {
  return {
    male: '남성',
    female: '여성'
  }[v] || '미입력';
}

function getAgeGroup(age) {
  if (age === null || age === undefined || Number.isNaN(age)) return '';
  if (age < 19) return 'under19';
  if (age < 40) return 'lt40';
  if (age <= 49) return '40s';
  if (age <= 59) return '50s';
  if (age <= 69) return '60s';
  if (age <= 79) return '70s';
  return '80plus';
}

function mapAgeGroup(v) {
  return {
    under19: '19세 미만',
    lt40: '19~39세',
    '40s': '40~49세',
    '50s': '50~59세',
    '60s': '60~69세',
    '70s': '70~79세',
    '80plus': '80세 이상'
  }[v] || '미입력';
}

function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  var m = heightCm / 100;
  return weightKg / (m * m);
}

function collect() {
  var height = num('height');
  var weight = num('weight');
  var age = num('age');
  var bmi = calculateBmi(height, weight);
  var ageGroup = getAgeGroup(age);

  return {
    sex: value('sex'),
    age: age,
    ageGroup: ageGroup,
    height: height,
    weight: weight,
    bmi: bmi !== null ? Number(bmi.toFixed(2)) : null,

    hypertension: value('hypertension'),
    diabetes: value('diabetes'),
    dyslipidemia: value('dyslipidemia'),
    familyHistory: value('familyHistory'),

    smokingStatus: value('smokingStatus'),
    stress: value('stress'),

    emergencyChestPain: value('emergencyChestPain'),
    radiatingPain: value('radiatingPain'),
    shortnessBreath: value('shortnessBreath'),
    coldSweat: value('coldSweat')
  };
}

function essentialMissing(data) {
  var names = [
    ['sex', '성별'],
    ['age', '나이'],
    ['height', '키'],
    ['weight', '몸무게'],
    ['bmi', 'BMI 계산값'],
    ['hypertension', '고혈압 여부'],
    ['diabetes', '당뇨병 여부'],
    ['dyslipidemia', '이상지질혈증 여부'],
    ['smokingStatus', '흡연 상태'],
    ['stress', '스트레스 여부'],
    ['familyHistory', '가족력 여부']
  ];

  return names.filter(function (item) {
    var key = item[0];
    return data[key] === '' || data[key] === null || data[key] === undefined || Number.isNaN(data[key]);
  }).map(function (item) {
    return item[1];
  });
}

function evaluate(data) {
  var reasons = [];
  var actions = [];
  var missing = essentialMissing(data);

  var emergencySymptomCount =
    (data.emergencyChestPain === 'yes' ? 1 : 0) +
    (data.radiatingPain === 'yes' ? 1 : 0) +
    (data.shortnessBreath === 'yes' ? 1 : 0) +
    (data.coldSweat === 'yes' ? 1 : 0);

  var emergency = emergencySymptomCount >= 2;

  if (emergency) {
    reasons.push('응급 의심 증상이 2개 이상 확인되었습니다.');
    actions.push('즉시 병원 방문을 권고합니다.');
    actions.push('증상이 심하거나 지속된다면 119 또는 가까운 응급실을 이용하세요.');
    actions.push('혼자 이동하지 말고 보호자나 구급대 도움을 받는 것이 안전합니다.');

    return {
      level: 'emergency',
      title: '즉시 병원 방문 권고',
      summary: '응급 의심 증상이 2개 이상 확인되어 예측모델 계산보다 의료기관 방문이 우선입니다.',
      reasons: reasons,
      actions: actions,
      missing: missing,
      gradeLabel: '즉시 병원 방문 권고',
      riskFactorCount: null
    };
  }

  if (missing.length > 0) {
    actions.push('기본모델 계산을 위해 필수 항목을 모두 입력해 주세요.');

    return {
      level: 'insufficient',
      title: '입력 부족',
      summary: '기본모델 위험등급 계산에 필요한 필수 항목이 아직 입력되지 않았습니다.',
      reasons: ['미입력 항목이 있습니다.'],
      actions: actions,
      missing: missing,
      gradeLabel: '입력 부족',
      riskFactorCount: null
    };
  }

  if (data.ageGroup === 'under19') {
    return {
      level: 'insufficient',
      title: '모델 적용 제외',
      summary: '19세 미만은 본 기본모델의 분석대상에 포함되지 않아 위험등급을 산출하지 않습니다.',
      reasons: ['입력 나이가 19세 미만입니다.'],
      actions: ['19세 이상 성인 대상자에게만 본 모델을 적용할 수 있습니다.'],
      missing: [],
      gradeLabel: '모델 적용 제외',
      riskFactorCount: null
    };
  }

  var cutBasic80 = 0.029557;
  var bmiValue = data.bmi;

  var age2 = data.ageGroup === '40s' ? 1 : 0;
  var age3 = data.ageGroup === '50s' ? 1 : 0;
  var age4 = data.ageGroup === '60s' ? 1 : 0;
  var age5 = data.ageGroup === '70s' ? 1 : 0;
  var age6 = data.ageGroup === '80plus' ? 1 : 0;

  var male = data.sex === 'male' ? 1 : 0;

  var htn = data.hypertension === 'yes' ? 1 : 0;
  var dm = data.diabetes === 'yes' ? 1 : 0;
  var dlp = data.dyslipidemia === 'yes' ? 1 : 0;

  var smoke2 = data.smokingStatus === 'former' ? 1 : 0;
  var smoke3 = data.smokingStatus === 'current' ? 1 : 0;

  var stress = data.stress === 'yes' ? 1 : 0;
  var family = data.familyHistory === 'yes' ? 1 : 0;

  var logit =
    -10.1802
    + 2.7446 * age2
    + 3.9811 * age3
    + 4.8979 * age4
    + 5.6760 * age5
    + 5.7476 * age6
    + 0.3941 * male
    + 0.0421 * bmiValue
    + 0.3969 * htn
    + 0.4243 * dm
    + 0.6661 * dlp
    + 0.5039 * smoke2
    + 0.4795 * smoke3
    + 0.4226 * stress
    + 1.0678 * family;

  var probability = Math.exp(logit) / (1 + Math.exp(logit));

  var grade;
  var gradeLabel;
  var level;

  if (probability < 0.01) {
    grade = 1;
    gradeLabel = '양호';
    level = 'low';
  } else if (probability < cutBasic80) {
    grade = 2;
    gradeLabel = '주의';
    level = 'medium';
  } else if (probability < cutBasic80 * 2) {
    grade = 3;
    gradeLabel = '경고';
    level = 'medium';
  } else if (probability < cutBasic80 * 4) {
    grade = 4;
    gradeLabel = '위험';
    level = 'high';
  } else {
    grade = 5;
    gradeLabel = '매우 위험';
    level = 'high';
  }

  var riskFactorCount =
    htn +
    dm +
    dlp +
    smoke3 +
    stress +
    family +
    (bmiValue >= 30 ? 1 : 0);

  var youngManageLabel = null;

  if (data.ageGroup === 'lt40') {
    if (riskFactorCount <= 1) {
      youngManageLabel = '젊은층 양호';
    } else if (riskFactorCount === 2) {
      youngManageLabel = '젊은층 주의';
    } else if (riskFactorCount >= 3 && riskFactorCount <= 4) {
      youngManageLabel = '젊은층 경고';
    } else {
      youngManageLabel = '젊은층 집중관리';
    }
  }

  reasons.push(data.age + '세로 입력되어 ' + mapAgeGroup(data.ageGroup) + ' 연령군으로 분류되었습니다.');

  if (male) {
    reasons.push('남성으로 응답했습니다.');
  } else {
    reasons.push('여성 기준군으로 입력되었습니다.');
  }

  if (bmiValue >= 30) {
    reasons.push('BMI가 ' + bmiValue.toFixed(2) + '로 비만 범위입니다.');
  } else if (bmiValue >= 25) {
    reasons.push('BMI가 ' + bmiValue.toFixed(2) + '로 과체중 범위입니다.');
  } else if (bmiValue < 18.5) {
    reasons.push('BMI가 ' + bmiValue.toFixed(2) + '로 저체중 범위입니다.');
  } else {
    reasons.push('BMI는 ' + bmiValue.toFixed(2) + '로 정상 범위입니다.');
  }

  if (htn) reasons.push('고혈압 진단력이 있습니다.');
  if (dm) reasons.push('당뇨병 진단력이 있습니다.');
  if (dlp) reasons.push('이상지질혈증 진단력이 있습니다.');
  if (smoke2) reasons.push('과거흡연력으로 입력되었습니다.');
  if (smoke3) reasons.push('현재흡연 상태입니다.');
  if (stress) reasons.push('스트레스를 많이 느끼는 것으로 응답했습니다.');
  if (family) reasons.push('허혈성심질환 가족력이 있습니다.');

  if (!htn && !dm && !dlp && !smoke2 && !smoke3 && !stress && !family) {
    reasons.push('고혈압, 당뇨, 이상지질혈증, 흡연, 스트레스, 가족력은 확인되지 않았습니다.');
  }

  reasons.push('주요 위험요인 개수는 ' + riskFactorCount + '개입니다.');

  if (grade === 1) {
    actions.push('현재 위험등급은 양호입니다. 정기적인 건강검진은 유지하세요.');
  } else if (grade === 2) {
    actions.push('주의 단계입니다. 생활습관 관리와 정기검진이 권장됩니다.');
  } else if (grade === 3) {
    actions.push('경고 단계입니다. 혈압, 혈당, 지질 수치 확인을 권장합니다.');
  } else if (grade === 4) {
    actions.push('위험 단계입니다. 가까운 의료기관에서 상담을 받아보는 것이 좋습니다.');
  } else {
    actions.push('매우 위험 단계입니다. 빠른 시일 내 의료기관 상담을 권장합니다.');
  }

  if (youngManageLabel && probability < cutBasic80 && riskFactorCount >= 3) {
    actions.push('19~39세에서 위험요인이 많아 ' + youngManageLabel + '으로 함께 안내됩니다.');
  }

  if (smoke3) actions.push('금연 상담 또는 금연지원 프로그램 이용을 권장합니다.');
  if (htn) actions.push('혈압 관리와 약물 복용 여부를 점검하세요.');
  if (dm) actions.push('혈당 관리와 정기 추적검사를 권장합니다.');
  if (dlp) actions.push('지질 수치 관리와 약물 치료 여부를 확인하세요.');
  if (family) actions.push('가족력이 있으므로 정기적인 심혈관 검진을 권장합니다.');

  return {
    level: level,
    title: gradeLabel,
    summary:
      '기본모델을 바탕으로 산출한 최종 위험등급은 ' + gradeLabel + '입니다.' +
      (youngManageLabel ? ' 19~39세 보완 관리등급은 ' + youngManageLabel + '입니다.' : ''),
    reasons: reasons,
    actions: actions,
    missing: [],
    grade: grade,
    gradeLabel: gradeLabel,
    riskFactorCount: riskFactorCount,
    youngManageLabel: youngManageLabel
  };
}

function setList(id, items) {
  var el = $(id);
  el.innerHTML = '';
  items.forEach(function (text) {
    var li = document.createElement('li');
    li.textContent = text;
    el.appendChild(li);
  });
}

function setPills(missing) {
  var wrap = $('missingWrap');
  wrap.innerHTML = '';

  if (!missing || missing.length === 0) return;

  var title = document.createElement('div');
  title.className = 'pill';
  title.textContent = '미입력: ' + missing.join(', ');
  wrap.appendChild(title);
}

function render(data, result) {
  var banner = $('resultBanner');
  banner.className = 'result-banner ' + result.level;
  banner.textContent = result.title;

  var bmiText = data && data.bmi !== null && data.bmi !== undefined
    ? ('BMI ' + data.bmi.toFixed(2))
    : 'BMI 미입력';

  var ageText = data && data.age ? data.age + '세' : '나이 미입력';

  $('resultSummary').textContent =
    result.summary +
    ' 입력 요약: ' + ageText + ', ' + mapSex(data.sex || '') + ', ' + bmiText + '.';

  $('metricGrade').textContent = result.gradeLabel || '-';

  $('metricRiskCount').textContent =
    result.riskFactorCount === null || result.riskFactorCount === undefined ? '-' : result.riskFactorCount + '개';

  setList('reasonList', result.reasons || []);
  setList('actionList', result.actions || []);
  setPills(result.missing || []);

  setTimeout(function () {
    $('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

function runEvaluation() {
  var data = collect();
  var result = evaluate(data);
  render(data, result);
}

function setFormValues(obj) {
  Object.keys(obj).forEach(function (key) {
    if ($(key)) $(key).value = obj[key];
  });
}

function fillSampleLow() {
  resetForm(false);

  setFormValues({
    sex: 'male',
    age: '70',
    height: '175',
    weight: '70',
    hypertension: 'no',
    diabetes: 'no',
    dyslipidemia: 'no',
    familyHistory: 'no',
    smokingStatus: 'never',
    stress: 'no',
    emergencyChestPain: 'no',
    radiatingPain: 'no',
    shortnessBreath: 'no',
    coldSweat: 'no'
  });

  runEvaluation();
}

function fillSampleYoungHigh() {
  resetForm(false);

  setFormValues({
    sex: 'male',
    age: '30',
    height: '175',
    weight: '110',
    hypertension: 'yes',
    diabetes: 'yes',
    dyslipidemia: 'yes',
    familyHistory: 'yes',
    smokingStatus: 'current',
    stress: 'yes',
    emergencyChestPain: 'no',
    radiatingPain: 'no',
    shortnessBreath: 'no',
    coldSweat: 'no'
  });

  runEvaluation();
}

function resetForm(shouldRender) {
  var fields = [
    'sex',
    'age',
    'height',
    'weight',
    'hypertension',
    'diabetes',
    'dyslipidemia',
    'familyHistory',
    'smokingStatus',
    'stress'
  ];

  fields.forEach(function (id) {
    $(id).value = '';
  });

  $('emergencyChestPain').value = 'no';
  $('radiatingPain').value = 'no';
  $('shortnessBreath').value = 'no';
  $('coldSweat').value = 'no';

  if (shouldRender !== false) {
    render({
      age: null,
      sex: '',
      bmi: null
    }, {
      level: 'insufficient',
      title: '아직 계산 전',
      summary: '필수 항목을 입력한 뒤 계산하기를 누르면 기본모델 위험등급이 표시됩니다.',
      reasons: [],
      actions: [],
      missing: [],
      gradeLabel: '-',
      riskFactorCount: null
    });
  }
}

resetForm();
