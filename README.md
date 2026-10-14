# 차미 당도 연구소

Vite와 바닐라 JavaScript로 만든 미니게임 사이트입니다. 익명 방문 쿠키로 방문자를 구분하고 PostgreSQL에 연구 기록과 트로피를 저장합니다.

## 실행

Node.js 20.6 이상이 필요합니다. 프로젝트 루트의 `.env.local`에 `DATABASE_URL`을 설정한 뒤 실행합니다.

```sh
npm install
npm run dev
```

개발 실행은 Vite와 API 서버를 함께 시작합니다. API 서버가 시작될 때 `db/schema.js`을 적용합니다. 스키마는 반복 적용해도 기존 기록을 삭제하지 않습니다.

## 배포

정적 파일만 올리는 호스팅 대신 Node.js 서버를 실행할 수 있는 호스팅을 사용합니다. 배포 환경 변수에 `DATABASE_URL`을 등록하고 다음 명령으로 실행합니다.

```sh
npm install
npm run build
npm start
```

서버는 `PORT` 환경 변수를 사용하며 기본 포트는 4173입니다. `npm run preview`는 정적 Vite 미리보기만 실행하므로 API와 DB 저장이 필요한 배포 확인에는 `npm start`를 사용합니다.

## 방문자와 저장 데이터

- 서버는 400일 만료의 `HttpOnly`, `SameSite=Lax` 익명 쿠키를 발급합니다. HTTPS에서는 `Secure`도 설정합니다.
- DB에는 쿠키 원문 대신 SHA-256 해시를 저장합니다. 쿠키를 지우면 새 방문자로 시작합니다.
- 당도 연구와 세 미니게임 기록, 14개 트로피 달성 시각을 PostgreSQL에 저장합니다.
- 브라우저 로컬 저장소는 API를 사용할 수 없을 때의 임시 기록으로만 씁니다. 서버에 연결되면 해당 쿠키 방문자의 DB 기록을 표시합니다.
- 게임 기록은 로그인 없이 전송되므로 보안상 신뢰 가능한 경쟁 점수나 보상으로 사용하면 안 됩니다.

`.env.local`은 Git에서 제외되어 있습니다. DB 접속 정보를 클라이언트 코드나 `VITE_` 환경 변수에 넣지 마세요.

## 주요 파일

- `src/main.js`: 게임 화면과 브라우저 동작
- `src/style.css`: 반응형 UI와 애니메이션
- `server.js`: 익명 방문자 쿠키, API, PostgreSQL 연결
- `db/schema.js`: 방문자, 연구 통계, 트로피 테이블
- `vite.config.js`: 개발 환경 API 프록시
