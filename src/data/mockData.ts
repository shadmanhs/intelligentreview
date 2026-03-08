import { PR, ReviewComment, ChecklistItem } from "@/types/review";

export const mockPRs: PR[] = [
  {
    id: 1,
    number: 342,
    title: "Add user authentication with OAuth2 support",
    author: "sarah-chen",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    repo: "acme/web-platform",
    status: "open",
    draft: false,
    additions: 847,
    deletions: 123,
    changedFiles: 14,
    createdAt: "2026-03-06T14:30:00Z",
    updatedAt: "2026-03-07T09:15:00Z",
    labels: ["feature", "auth"],
    reviewers: ["mike-d", "alex-k"],
    description: "Implements OAuth2 authentication flow with support for Google and GitHub providers. Includes token refresh, session management, and secure cookie handling.",
  },
  {
    id: 2,
    number: 338,
    title: "Fix race condition in WebSocket reconnection logic",
    author: "mike-d",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    repo: "acme/realtime-engine",
    status: "open",
    draft: false,
    additions: 42,
    deletions: 18,
    changedFiles: 3,
    createdAt: "2026-03-05T11:00:00Z",
    updatedAt: "2026-03-07T16:45:00Z",
    labels: ["bug", "critical"],
    reviewers: ["sarah-chen"],
    description: "Fixes a race condition where multiple reconnection attempts could fire simultaneously, causing duplicate event listeners and memory leaks.",
  },
  {
    id: 3,
    number: 335,
    title: "Migrate database queries to prepared statements",
    author: "alex-k",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    repo: "acme/api-server",
    status: "open",
    draft: true,
    additions: 234,
    deletions: 198,
    changedFiles: 8,
    createdAt: "2026-03-04T08:20:00Z",
    updatedAt: "2026-03-06T13:30:00Z",
    labels: ["security", "refactor"],
    reviewers: [],
    description: "Converts all raw SQL queries to use prepared statements to prevent SQL injection vulnerabilities.",
  },
  {
    id: 4,
    number: 330,
    title: "Add dark mode support to component library",
    author: "jordan-w",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    repo: "acme/ui-kit",
    status: "open",
    draft: false,
    additions: 562,
    deletions: 89,
    changedFiles: 22,
    createdAt: "2026-03-03T15:10:00Z",
    updatedAt: "2026-03-07T11:00:00Z",
    labels: ["feature", "design-system"],
    reviewers: ["sarah-chen", "alex-k"],
    description: "Adds comprehensive dark mode support across all components using CSS custom properties and a theme provider.",
  },
];

export const mockFiles = [
  {
    path: "src/auth/oauth.ts",
    language: "typescript",
    additions: 145,
    deletions: 12,
    status: "modified" as const,
    oldContent: `import { config } from '../config';

export class AuthService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = config.authUrl;
  }

  async login(username: string, password: string) {
    const response = await fetch(\`\${this.baseUrl}/login\`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  }

  async logout() {
    await fetch(\`\${this.baseUrl}/logout\`, { method: 'POST' });
  }
}`,
    newContent: `import { config } from '../config';
import { TokenManager } from './token-manager';
import { SessionStore } from './session-store';

export interface OAuthProvider {
  name: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export class AuthService {
  private baseUrl: string;
  private tokenManager: TokenManager;
  private sessionStore: SessionStore;
  
  constructor() {
    this.baseUrl = config.authUrl;
    this.tokenManager = new TokenManager();
    this.sessionStore = new SessionStore();
  }

  async loginWithOAuth(provider: OAuthProvider): Promise<void> {
    const state = crypto.randomUUID();
    this.sessionStore.set('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      scope: provider.scopes.join(' '),
      state,
      response_type: 'code',
    });

    window.location.href = \`\${this.baseUrl}/oauth/\${provider.name}/authorize?\${params}\`;
  }

  async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    const savedState = this.sessionStore.get('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state parameter');
    }

    const response = await fetch(\`\${this.baseUrl}/oauth/token\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('OAuth token exchange failed');
    }

    const { accessToken, refreshToken, expiresIn } = await response.json();
    this.tokenManager.store(accessToken, refreshToken, expiresIn);
    return true;
  }

  async refreshSession(): Promise<boolean> {
    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(\`\${this.baseUrl}/oauth/refresh\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) return false;

      const { accessToken, refreshToken: newRefresh, expiresIn } = await response.json();
      this.tokenManager.store(accessToken, newRefresh, expiresIn);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    this.tokenManager.clear();
    this.sessionStore.clear();
    await fetch(\`\${this.baseUrl}/logout\`, {
      method: 'POST',
      credentials: 'include',
    });
  }
}`,
  },
  {
    path: "src/auth/token-manager.ts",
    language: "typescript",
    additions: 58,
    deletions: 0,
    status: "added" as const,
    oldContent: "",
    newContent: `const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';
const EXPIRY_KEY = 'auth_token_expiry';

export class TokenManager {
  store(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiry = Date.now() + expiresIn * 1000;
    
    // Use httpOnly cookies in production
    document.cookie = \`\${TOKEN_KEY}=\${accessToken}; path=/; secure; samesite=strict\`;
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  isExpired(): boolean {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry, 10);
  }

  clear(): void {
    document.cookie = \`\${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970\`;
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
}`,
  },
  {
    path: "src/auth/session-store.ts",
    language: "typescript",
    additions: 24,
    deletions: 0,
    status: "added" as const,
    oldContent: "",
    newContent: `export class SessionStore {
  private prefix = 'auth_session_';

  set(key: string, value: string): void {
    sessionStorage.setItem(this.prefix + key, value);
  }

  get(key: string): string | null {
    return sessionStorage.getItem(this.prefix + key);
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => sessionStorage.removeItem(k));
  }
}`,
  },
  {
    path: "src/middleware/auth-guard.ts",
    language: "typescript",
    additions: 32,
    deletions: 8,
    status: "modified" as const,
    oldContent: `export function authGuard(req: Request): boolean {
  const token = req.headers.get('Authorization');
  return !!token;
}`,
    newContent: `import { TokenManager } from '../auth/token-manager';
import { AuthService } from '../auth/oauth';

const tokenManager = new TokenManager();
const authService = new AuthService();

export async function authGuard(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) return false;
  
  // Check if token is expired and try refresh
  if (tokenManager.isExpired()) {
    const refreshed = await authService.refreshSession();
    if (!refreshed) return false;
  }

  try {
    const response = await fetch('/api/auth/verify', {
      headers: { Authorization: \`Bearer \${token}\` },
    });
    return response.ok;
  } catch {
    return false;
  }
}`,
  },
  {
    path: "tests/auth/oauth.test.ts",
    language: "typescript",
    additions: 89,
    deletions: 0,
    status: "added" as const,
    oldContent: "",
    newContent: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/auth/oauth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.restoreAllMocks();
  });

  describe('handleOAuthCallback', () => {
    it('should reject mismatched state parameters', async () => {
      await expect(
        authService.handleOAuthCallback('code', 'wrong-state')
      ).rejects.toThrow('Invalid OAuth state parameter');
    });

    it('should exchange code for tokens', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'at_123',
          refreshToken: 'rt_456',
          expiresIn: 3600,
        }),
      });
      global.fetch = mockFetch;
      
      // ... test implementation
    });
  });

  describe('refreshSession', () => {
    it('should return false when no refresh token exists', async () => {
      const result = await authService.refreshSession();
      expect(result).toBe(false);
    });
  });
});`,
  },
];

export const defaultChecklist: ChecklistItem[] = [
  { id: "arch-1", category: "Architecture & Design", label: "Change belongs in the right layer/module", checked: false },
  { id: "arch-2", category: "Architecture & Design", label: "No new coupling or circular dependencies", checked: false },
  { id: "arch-3", category: "Architecture & Design", label: "Appropriate scope (not doing too much/too little)", checked: false },
  { id: "qual-1", category: "Code Quality", label: "Handles edge cases, null/empty, race conditions", checked: false },
  { id: "qual-2", category: "Code Quality", label: "Security: input sanitization, no injection vectors", checked: false },
  { id: "qual-3", category: "Code Quality", label: "Failure modes: handles DB down, large inputs", checked: false },
  { id: "qual-4", category: "Code Quality", label: "Readability: understandable at 2am during incident", checked: false },
  { id: "qual-5", category: "Code Quality", label: "Tests cover worried cases, test behavior not lines", checked: false },
  { id: "comp-1", category: "Completeness", label: "Error handling paths exist", checked: false },
  { id: "comp-2", category: "Completeness", label: "Related files updated (clients, configs, migrations)", checked: false },
  { id: "comp-3", category: "Completeness", label: "Documentation updated if needed", checked: false },
];

export const mockAISummary = {
  summary: "This PR implements OAuth2 authentication with support for Google and GitHub providers. It replaces the existing username/password login with a secure OAuth flow that includes token management, session handling, and automatic token refresh.",
  keyChanges: [
    { category: "API Changes", items: ["New OAuth endpoints for authorize, callback, and token refresh"] },
    { category: "Security", items: ["Token storage with httpOnly cookies", "CSRF protection via state parameter", "Automatic token refresh"] },
    { category: "Architecture", items: ["New TokenManager and SessionStore classes", "Updated auth guard middleware to support OAuth tokens"] },
  ],
  riskLevel: "medium" as const,
  riskReasons: [
    "Authentication is security-critical infrastructure",
    "Touches middleware layer affecting all authenticated routes",
    "Token storage in localStorage for refresh tokens (consider httpOnly cookies)",
  ],
  missingElements: [
    { type: "warning" as const, message: "No rate limiting on OAuth callback endpoint", file: "src/auth/oauth.ts", line: 42 },
    { type: "warning" as const, message: "Refresh token stored in localStorage — consider httpOnly cookie", file: "src/auth/token-manager.ts", line: 12 },
    { type: "info" as const, message: "No PKCE implementation for OAuth — recommended for SPAs", file: "src/auth/oauth.ts", line: 30 },
    { type: "warning" as const, message: "Missing test for token refresh flow", file: "tests/auth/oauth.test.ts" },
  ],
};
