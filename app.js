const express = require('express');
const cookieParser = require('cookie-parser');
const usersRouter = require('./routes/users.route');
const storiesRouter = require('./routes/stories.route');
const relaysRouter = require('./routes/relays.route');
const likesRouter = require('./routes/likes.route');
const kakaoRouter = require('./routes/kakao.route');
const passport = require('passport');
const { swaggerUi, swaggerSpec } = require('./swagger/swagger');
const cors = require('cors');
const session = require('express-session');
const kakao = require('./passport/kakaoStrategy');
const { Users } = require('./models');
require('dotenv').config();

app.use(express.json());
app.use(cookieParser());

// app.use('/', [usersRouter, storiesRouter]);
// app.use('/stories/', [relaysRouter, likesRouter]);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// app.use('/kakao', kakaoRouter);

app.use(
  session({
     secret: process.env.SESSION_SECRET, // 세션 암호화에 사용할 키입니다. 실제로는 .env 등에 저장하는 것이 좋습니다.
     resave: false,
     saveUninitialized: false,
  }),
);


app.use(passport.initialize()); // Passport를 초기화합니다.
app.use(passport.session()); // Passport 세션을 사용합니다.

passport.serializeUser((user, done) => {
  console.log('serializeUser', user);
  done(null, user.dataValues.userId);
});

passport.deserializeUser(async (userId, done) => {
  console.log('deserializeUser', userId);
  try {
    const user = await Users.findOne({ where: { UserId: userId } });
    console.log('Found user', user);
    done(null, user);
  } catch (error) {
    console.error('Error in deserializeUser' ,error);
    done(error);
  }
}); 

kakao();

app.use('/', [usersRouter, storiesRouter]);
app.use('/stories/', [relaysRouter, likesRouter]);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/kakao', kakaoRouter);

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
