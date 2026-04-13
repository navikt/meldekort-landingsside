import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Custom format for serializing Error objects in metadata
 * Error properties (message, stack) are non-enumerable and won't be serialized by JSON.stringify
 */
const serializeErrors = winston.format((info) => {
  // Helper function to serialize an Error object
  const serializeError = (error: Error): Record<string, unknown> => {
    const serialized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if (error.cause) {
      serialized.cause = error.cause instanceof Error ? serializeError(error.cause) : error.cause;
    }

    return serialized;
  };

  // Process all metadata fields
  for (const key of Object.keys(info)) {
    if (info[key] instanceof Error) {
      info[key] = serializeError(info[key]);
    }
  }

  return info;
});

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
    serializeErrors(),
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
