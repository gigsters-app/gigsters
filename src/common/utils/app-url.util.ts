import { ConfigService } from '@nestjs/config';
import { RequestStore } from '../interceptors/request-info.interceptor';

/**
 * Determines the backend API URL for the application across different environments
 * This is used for generating activation/reset links that point to the API server
 * NOT the frontend application
 */
export function getBaseUrl(configService?: ConfigService): string {
  // First priority: Check BACKEND_URL environment variable
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl) {
    return backendUrl;
  }

  // Second priority: Get the current request server URL
  const req = RequestStore.getRequest();
  if (req) {
    if (req.headers.host) {
      const protocol = req.secure || (req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      return `${protocol}://${req.headers.host}`;
    }
  }

  // Third priority: Check NODE_ENV and provide appropriate fallback
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    return 'https://gigsters-production.up.railway.app';
  }
  
  // Default fallback for development
  return 'http://localhost:3000';
} 