/**
 * Tests for the logger utility
 */

const logger = require('../src/utils/logger');

// Mock console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  // Clear all mocks before each test
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore original console methods after each test
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  
  // Reset NODE_ENV to default
  delete process.env.NODE_ENV;
});

describe('Logger Utility', () => {
  test('should log info messages in development mode', () => {
    process.env.NODE_ENV = 'development';
    logger.info('Test message');
    expect(console.log).toHaveBeenCalledWith('[INFO]', 'Test message');
  });

  test('should log warning messages in development mode', () => {
    process.env.NODE_ENV = 'development';
    logger.warn('Test warning');
    expect(console.warn).toHaveBeenCalledWith('[WARN]', 'Test warning');
  });

  test('should log error messages in development mode', () => {
    process.env.NODE_ENV = 'development';
    logger.error('Test error');
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'Test error');
  });

  test('should log debug messages in development mode', () => {
    process.env.NODE_ENV = 'development';
    logger.debug('Test debug');
    expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'Test debug');
  });

  test('should not log messages in production mode', () => {
    process.env.NODE_ENV = 'production';
    logger.info('Test message');
    logger.warn('Test warning');
    logger.error('Test error');
    logger.debug('Test debug');
    
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  test('should log messages when NODE_ENV is not set (development by default)', () => {
    delete process.env.NODE_ENV; // Ensure it's not set
    logger.info('Test message');
    expect(console.log).toHaveBeenCalledWith('[INFO]', 'Test message');
  });
});
