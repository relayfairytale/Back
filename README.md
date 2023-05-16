# Fairytale Relay

Fairytale Relay은 사용자들이 협력적으로 이야기를 만들고 공유할 수 있는 프로젝트로 이 레포는 백엔드 API를 포함합니다.

### 목차

- [프로젝트 구조와 ERD](#프로젝트-구조와-erd)
- [설치 및 실행](#설치-및-실행)
- [Docker 이미지 빌드 및 실행](#docker-이미지-빌드-및-실행)
- [API 문서 (Swagger)](#api-문서swagger)


## 프로젝트 구조와 ERD

### 프로젝트의 디렉토리 구조는 다음과 같습니다:

```
Fairytale Relay
Back
├─ .prettierrc.js
├─ app.js
├─ middlewares
│  └─ auth-middleware.js
├─ migrations
│  ├─ 20230513053612-create-users.js
│  ├─ 20230513053913-create-stories.js
│  ├─ 20230513054118-create-relays.js
│  └─ 20230513062606-create-likes.js
├─ models
│  ├─ index.js
│  ├─ likes.js
│  ├─ relays.js
│  ├─ stories.js
│  └─ users.js
├─ package-lock.json
├─ package.json
├─ README.md
├─ routes
│  ├─ index.js
│  ├─ likes.route.js
│  ├─ relays.route.js
│  ├─ stories.route.js
│  └─ users.route.js
└─ swagger
   └─ swagger.js
```

### ERD
![ERD](https://github.com/relayfairytale/Back/blob/main/ERD_Fairytale_Relay.png)

## 설치 및 실행

1. 해당 프로젝트를 클론합니다.
2. 프로젝트 루트 디렉토리에서 다음 명령을 실행하여 의존성을 설치합니다.
```bash
npm install
```

3. 다음 명령으로 서버를 실행합니다.
```bash
npm start
```

4. 브라우저에서 http://localhost:3018 으로 접속하여 Fairytale Relay 백엔드 API를 사용할 수 있습니다.

## Docker 이미지 빌드 및 실행
1. Docker가 설치되어 있는지 확인합니다.
2. 프로젝트 루트 디렉토리에서 다음 명령을 실행하여 Docker 이미지를 빌드합니다:
```bash
docker build -t fairytale-relay:latest .
```
3. 이미지 빌드가 완료되면, 다음 명령으로 컨테이너를 실행합니다:
```bash
docker run -p 3018:3018 -d fairytale-relay:latest
```
4. 브라우저에서 http://localhost:3018 으로 접속하여 Fairytale Relay를 사용할 수 있습니다.

## API 문서(Swagger)

API 문서는 스웨거를 통해 제공됩니다. 서버를 실행한 후, 브라우저에서 http://localhost:3018/api-docs/ 로 접속하면 API 문서를 확인할 수 있습니다. 스웨거를 통해 API 엔드포인트, 요청과 응답 형식, 인증 등의 정보를 자세히 확인할 수 있습니다.
