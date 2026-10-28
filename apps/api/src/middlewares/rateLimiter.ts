import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Juda ko'p urinish amalga oshirildi. Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring.",
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
