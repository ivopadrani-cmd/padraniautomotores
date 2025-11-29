// Replaced Base44 with local client
import { localClient } from './localClient';

// Export as base44 for backward compatibility with existing code
export const base44 = localClient;
