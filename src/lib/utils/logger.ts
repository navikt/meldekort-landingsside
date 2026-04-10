import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Winston logger konfigurasjon
 *
 * Development: Farget output med timestamps for bedre lesbarhet
 * Production: Strukturert JSON for log aggregering (f.eks. Kibana)
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isDevelopment
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${meta}`;
          }),
        )
      : winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
  // Ikke exit ved uncaught exceptions - la Astro håndtere det
  exitOnError: false,
});
