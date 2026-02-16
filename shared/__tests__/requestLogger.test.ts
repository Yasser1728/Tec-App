import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../middleware/requestLogger';

describe('requestLogger middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let setHeaderSpy: jest.Mock;
  let onSpy: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
    };
    
    setHeaderSpy = jest.fn();
    onSpy = jest.fn((event: string, callback: Function) => {
      if (event === 'finish') {
        // Simulate response finish
        setTimeout(() => callback(), 0);
      }
    });
    
    mockResponse = {
      setHeader: setHeaderSpy,
      on: onSpy,
      statusCode: 200,
    };
    
    nextFunction = jest.fn();
    
    // Spy on console.log
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set X-Request-ID header', () => {
    const middleware = requestLogger('test-service');
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(setHeaderSpy).toHaveBeenCalled();
    const callArgs = setHeaderSpy.mock.calls[0];
    expect(callArgs[0]).toBe('X-Request-ID');
    expect(callArgs[1]).toBeDefined();
  });

  it('should use existing request ID from header', () => {
    mockRequest.headers = {
      ...mockRequest.headers,
      'x-request-id': 'existing-request-id',
    };

    const middleware = requestLogger('test-service');
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(setHeaderSpy).toHaveBeenCalledWith('X-Request-ID', 'existing-request-id');
  });

  it('should call next function', () => {
    const middleware = requestLogger('test-service');
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should log request details on response finish', async () => {
    const middleware = requestLogger('test-service');
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Wait for async callback
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(console.log).toHaveBeenCalled();
    const loggedData = JSON.parse((console.log as jest.Mock).mock.calls[0][0]);
    
    expect(loggedData.service).toBe('test-service');
    expect(loggedData.level).toBe('info');
    expect(loggedData.message).toBe('HTTP Request');
    expect(loggedData.method).toBe('GET');
    expect(loggedData.url).toBe('/test');
    expect(loggedData.statusCode).toBe(200);
    expect(loggedData.responseTime).toBeDefined();
    expect(loggedData.requestId).toBeDefined();
  });
});
