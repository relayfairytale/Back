const jwt = require('jsonwebtoken');
const { Users } = require('../models');

module.exports = async (req, res, next) => {
  const { authorization } = req.cookies;

  if (!authorization) {
    return res.status(401).json({ errorMessage: '로그인 후 사용하세요.' });
  }

  const [tokenType, tokenValue] = authorization.split(' ');

  if (tokenType !== 'Bearer' || !tokenValue) {
    return res
      .status(401)
      .json({ errorMessage: '전달된 쿠키에서 오류가 발생하였습니다.' });
  }

  try {
    const decodedToken = jwt.verify(tokenValue, 'customized-secret-key');
    const userId = decodedToken.userId;
    const user = await Users.findOne({ where: { userId } });

    if (!user) {
      return res.status(401).json({ errorMessage: '로그인 후 사용하세요.' });
    }

    res.locals.user = user;
    next();
  } catch (err) {
    res.status(401).json({ errorMessage: '비정상적인 접근입니다.' });
  }
};
