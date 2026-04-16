import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info', // Log alt fra info og oppover (info, warn, error)
  format: process.env.NODE_ENV === 'development' ? winston.format.simple() : winston.format.json(),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? winston.format.simple()
          : winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});
