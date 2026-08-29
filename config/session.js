import 'dotenv/config';

import session from 'express-session';

const sessionMiddleware = session({
  name: 'nxtplay.sid',

  secret:
    process.env.SESSION_SECRET ||
    'chave-apenas-para-desenvolvimento-local',

  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
});

export default sessionMiddleware;
