const express = require('express');
const cookieParser = require('cookie-parser');
const usersRouter = require('./routes/users.route');
const storiesRouter = require('./routes/stories.route');
const relaysRouter = require('./routes/relays.route');
const likesRouter = require('./routes/likes.route');
// express 미들웨어 선언
const app = express();
// Swagger 설정
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));
// CORS 설정
const cors = require('cors');
app.use(
    cors({
        origin: ['http://localhost:3000', 'https://front-pi-smoky.vercel.app', 'http://rft.ysizuku.com'],
        credentials: true,
    })
);
// 미들웨어 사용
app.use(express.json());
app.use(cookieParser());
// 라우트 설정
app.use('/', [usersRouter, storiesRouter]);
app.use('/stories/', [relaysRouter, likesRouter]);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 랜딩페이지 눈부심 방지
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
    <html>
    <head>
        <title>릴레이 동화</title>
    </head>
    <body style="background-color: black; color: white;">
        <h1>mini project</h1>
        <small>1조</small>
    </body>
    </html>`);
});
// 포트 설정
const PORT = 3018;
// 앱 실행
app.listen(PORT, () => {
    console.log(PORT, '포트 번호로 서버가 실행되었습니다.');
});
