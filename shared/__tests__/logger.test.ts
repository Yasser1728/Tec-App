import { createLogger, LogLevel } from '../utils/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    
    // Clear any environment variables that might affect logging
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  describe('createLogger', () => {
    it('should create a logger with service name', () => {
      const logger = createLogger('test-service');
      expect(logger).toBeDefined();
    });

    it('should log info messages', () => {
      const logger = createLogger('test-service');
      logger.info('Test message');

      expect(console.info).toHaveBeenCalled();
      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.service).toBe('test-service');
      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Test message');
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should log error messages', () => {
      const logger = createLogger('test-service');
      logger.error('Error message');

      expect(console.error).toHaveBeenCalled();
      const loggedData = JSON.parse((console.error as jest.Mock).mock.calls[0][0]);
      expect(loggedData.service).toBe('test-service');
      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('Error message');
    });

    it('should log warn messages', () => {
      const logger = createLogger('test-service');
      logger.warn('Warning message');

      expect(console.warn).toHaveBeenCalled();
      const loggedData = JSON.parse((console.warn as jest.Mock).mock.calls[0][0]);
      expect(loggedData.service).toBe('test-service');
      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Warning message');
    });

    it('should log debug messages', () => {
      // Set LOG_LEVEL to DEBUG to enable debug logging BEFORE creating the logger
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';
      
      const logger = createLogger('test-service');
      logger.debug('Debug message');

      expect(console.debug).toHaveBeenCalled();
      const loggedData = JSON.parse((console.debug as jest.Mock).mock.calls[0][0]);
      expect(loggedData.service).toBe('test-service');
      expect(loggedData.level).toBe('debug');
      expect(loggedData.message).toBe('Debug message');
      
      // Restore original level
      if (originalLevel) {
        process.env.LOG_LEVEL = originalLevel;
      } else {
        delete process.env.LOG_LEVEL;
      }
    });

    it('should include metadata in logs', () => {
      const logger = createLogger('test-service');
      logger.info('Test message', { userId: '123', requestId: 'abc' });

      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.metadata?.userId).toBe('123');
      expect(loggedData.metadata?.requestId).toBe('abc');
    });

    it('should include error stack in error logs', () => {
      const logger = createLogger('test-service');
      const error = new Error('Test error');
      logger.error('Error occurred', {}, error);

      const loggedData = JSON.parse((console.error as jest.Mock).mock.calls[0][0]);
      expect(loggedData.stack).toBeDefined();
      expect(loggedData.stack).toContain('Test error');
    });

    it('should respect log level filtering', () => {
      // Set LOG_LEVEL to warn BEFORE creating the logger
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'warn';
      
      const logger = createLogger('test-service');

      logger.info('Info message');
      logger.debug('Debug message');
      logger.warn('Warn message');
      logger.error('Error message');

      // Info and debug should not be logged
      expect(console.info).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();

      // Warn and error should be logged
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();

      // Restore original level
      if (originalLevel) {
        process.env.LOG_LEVEL = originalLevel;
      } else {
        delete process.env.LOG_LEVEL;
      }
    });
  });
});
