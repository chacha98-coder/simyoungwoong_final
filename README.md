# 심영웅 VSCode 실행 구조

## 파일 구조

```text
simyoungwoong_vscode/
├─ index.html
├─ style.css
└─ app.js
```

## 실행 방법

1. VSCode에서 폴더 열기
2. Live Server 확장 프로그램 설치
3. `index.html` 우클릭 → `Open with Live Server`

## 반영 내용

- 19세 미만 모델 적용 제외
- 나이 숫자 입력 후 자동 연령군 분류
- 기본모델 로지스틱 회귀식 반영
- 예측확률은 화면에 표시하지 않음
- 위험등급: 양호, 주의, 경고, 위험, 매우 위험
- 응급 의심 증상 2개 이상이면 즉시 병원 방문 권고
