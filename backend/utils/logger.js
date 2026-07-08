const logger = {
  info: (message, data = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp}: ${message}`, data ? data : '');
  },
  error: (message, error = '') => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp}: ${message}`, error ? error : '');
  },
  warn: (message, data = '') => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp}: ${message}`, data ? data : '');
  },
  debug: (message, data = '') => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] ${timestamp}: ${message}`, data ? data : '');
    }
  },
};

export default logger;