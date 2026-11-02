// Environment configuration
// This file defines environment variables and the USE_MOCK_ENGINE toggle

// Backend API URL - points to our core engine
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_API_BASE_URL || 'http://192.168.1.7:5000/api/v1';

// Set to false to connect to production backend, true for mock data
export const USE_MOCK_ENGINE = process.env.EXPO_PUBLIC_USE_MOCK !== 'false' && process.env.EXPO_USE_MOCK !== 'false';

// Tenant ID for multi-tenant routing
export const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || process.env.EXPO_TENANT_ID || 'dating_app_v1';

// Environment modes
export const ENV = {
  development: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  production: process.env.NODE_ENV === 'production',
  test: process.env.NODE_ENV === 'test'
};
