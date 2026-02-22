type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatLog(level: LogLevel, message: string, meta?: object): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && { meta }),
  };
  return JSON.stringify(entry);
}

const logger = {
  info(message: string, meta?: object) {
    console.log(formatLog('INFO', message, meta));
  },

  warn(message: string, meta?: object) {
    console.warn(formatLog('WARN', message, meta));
  },

  error(message: string, error?: Error | unknown, meta?: object) {
    const errorMeta =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
    console.error(formatLog('ERROR', message, errorMeta));
  },

  debug(message: string, meta?: object) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog('DEBUG', message, meta));
    }
  },
};

export default logger;
