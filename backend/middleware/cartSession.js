const crypto = require('crypto');

module.exports = (req, res, next) => {
  let sessionId;

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('cartSessionId='));
    if (sessionCookie) {
      sessionId = sessionCookie.split('=')[1].trim();
    }
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };
    res.cookie('cartSessionId', sessionId, cookieOptions);
  }

  req.cartSessionId = sessionId;
  next();
};
