const crypto = require('crypto');

const getSessionCookieOptions = () => {
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const secureByConfig = process.env.COOKIE_SECURE === 'true';
  const secure = secureByConfig || sameSite === 'none' || process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const maxAgeDays = Number(process.env.CART_SESSION_DAYS || 30);

  return {
    expires: new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(domain ? { domain } : {})
  };
};

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
    const cookieOptions = getSessionCookieOptions();
    res.cookie('cartSessionId', sessionId, cookieOptions);
  }

  req.cartSessionId = sessionId;
  next();
};
