import { NextResponse } from 'next/server';

import { logApiResponse } from './logger';

/**
 * Wraps NextResponse.json to automatically log API responses
 */
export function createLoggedResponse(
  data: any,
  init?: ResponseInit & { 
    method?: string; 
    url?: string; 
    startTime?: number; 
    userId?: string;
  }
) {
  const response = NextResponse.json(data, init);
  
  if (init?.method && init?.url && init?.startTime) {
    const duration = Date.now() - init.startTime;
    const statusCode = init.status || 200;
    const responseSize = JSON.stringify(data).length;
    
    logApiResponse(
      init.method,
      init.url,
      statusCode,
      duration,
      init.userId,
      responseSize
    );
  }
  
  return response;
}

/**
 * Higher-order function to wrap API route handlers with automatic request/response logging
 */
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options?: { skipRequestLog?: boolean; skipResponseLog?: boolean }
): T {
  return (async (...args: any[]) => {
    const request = args[0] as Request;
    const startTime = Date.now();
    
    // Extract request info
    const method = request.method;
    const url = new URL(request.url).pathname;
    
    try {
      const response = await handler(...args);
      
      // Log successful response if not skipped
      if (!options?.skipResponseLog) {
        const duration = Date.now() - startTime;
        const statusCode = response.status;
        
        logApiResponse(method, url, statusCode, duration);
      }
      
      return response;
    } catch (error) {
      // Error logging is handled by individual route error handlers
      throw error;
    }
  }) as T;
}