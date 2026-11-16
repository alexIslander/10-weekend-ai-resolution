/**
 * User profile interface
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * User profile details
 */
export interface UserProfile {
  id: string;
  total_xp: number;
  created_at: string;
}

/**
 * Module interface
 */
export interface Module {
  id: string;
  name: string;
  items: ModuleItem[];
}

/**
 * Module item interface
 */
export interface ModuleItem {
  id: string;
  title: string;
  description?: string;
}

/**
 * Completion mapping interface
 */
export interface CompletionMap {
  [key: string]: boolean;
}

/**
 * Streak interface
 */
export interface Streak {
  user_id: string;
  days_count: number;
}