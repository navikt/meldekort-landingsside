import winston from 'winston';

const logFormat =
  process.env.NODE_ENV === 'development'
    ? winston.format.simple()
    : winston.format.combine(winston.format.timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: 'info', // Log alt fra info og oppover (info, warn, error)
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: logFormat,
    }),
  ],
});
