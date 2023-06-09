# 베이스 이미지 선택
FROM node:alpine

# 작업 디렉토리 생성
WORKDIR /app

# 종속성 설치
COPY package*.json ./
RUN npm install --production

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3018

# 컨테이너 시작 시 실행할 명령어
CMD [ "npm", "start" ]
