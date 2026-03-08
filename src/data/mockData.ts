import { PR, AIConcern, ReviewSession, FileChange } from "@/types/review";

export const mockPRs: PR[] = [
  {
    id: 1,
    number: 342,
    title: "Add user authentication with OAuth2 support",
    author: "sarah-chen",
    repo: "acme/web-platform",
    status: "open",
    draft: false,
    additions: 847,
    deletions: 123,
    changedFiles: 14,
    createdAt: "2026-03-06T14:30:00Z",
    updatedAt: "2026-03-07T09:15:00Z",
    labels: ["feature", "auth"],
    description: "Implements OAuth2 authentication flow with support for Google and GitHub providers.",
    riskLevel: "high",
    estimatedMinutes: 8,
  },
  {
    id: 2,
    number: 338,
    title: "Fix race condition in WebSocket reconnection logic",
    author: "mike-d",
    repo: "acme/realtime-engine",
    status: "open",
    draft: false,
    additions: 42,
    deletions: 18,
    changedFiles: 3,
    createdAt: "2026-03-05T11:00:00Z",
    updatedAt: "2026-03-07T16:45:00Z",
    labels: ["bug", "critical"],
    description: "Fixes a race condition where multiple reconnection attempts could fire simultaneously.",
    riskLevel: "high",
    estimatedMinutes: 4,
  },
  {
    id: 3,
    number: 335,
    title: "Migrate database queries to prepared statements",
    author: "alex-k",
    repo: "acme/api-server",
    status: "open",
    draft: true,
    additions: 234,
    deletions: 198,
    changedFiles: 8,
    createdAt: "2026-03-04T08:20:00Z",
    updatedAt: "2026-03-06T13:30:00Z",
    labels: ["security", "refactor"],
    description: "Converts all raw SQL queries to use prepared statements.",
    riskLevel: "medium",
    estimatedMinutes: 6,
  },
  {
    id: 4,
    number: 330,
    title: "Add dark mode support to component library",
    author: "jordan-w",
    repo: "acme/ui-kit",
    status: "open",
    draft: false,
    additions: 562,
    deletions: 89,
    changedFiles: 22,
    createdAt: "2026-03-03T15:10:00Z",
    updatedAt: "2026-03-07T11:00:00Z",
    labels: ["feature", "design-system"],
    description: "Adds comprehensive dark mode support across all components.",
    riskLevel: "low",
    estimatedMinutes: 10,
  },
];

export const mockConcerns: Record<number, AIConcern[]> = {
  1: [
    {
      id: "c1",
      severity: "critical",
      title: "Refresh token stored in localStorage",
      explanation: "The refresh token is stored in localStorage which is accessible to any JavaScript running on the page. An XSS vulnerability would allow an attacker to steal the refresh token and maintain persistent access. This should use an httpOnly cookie instead.",
      file: "src/auth/token-manager.ts",
      lineStart: 10,
      lineEnd: 14,
      codeSnippet: `    // Use httpOnly cookies in production\n    document.cookie = \`\${TOKEN_KEY}=\${accessToken}; path=/; secure; samesite=strict\`;\n    localStorage.setItem(REFRESH_KEY, refreshToken);\n    localStorage.setItem(EXPIRY_KEY, expiry.toString());`,
      draftComment: "The refresh token should not be stored in localStorage — it's vulnerable to XSS. Consider using an httpOnly cookie set by the server, or at minimum using sessionStorage with a shorter expiry.",
      status: "pending",
    },
    {
      id: "c2",
      severity: "critical",
      title: "No PKCE implementation for OAuth flow",
      explanation: "This is a single-page application but the OAuth flow doesn't implement PKCE (Proof Key for Code Exchange). Without PKCE, the authorization code can be intercepted. This is required by OAuth 2.1 for public clients.",
      file: "src/auth/oauth.ts",
      lineStart: 28,
      lineEnd: 38,
      codeSnippet: `    const params = new URLSearchParams({\n      client_id: provider.clientId,\n      redirect_uri: provider.redirectUri,\n      scope: provider.scopes.join(' '),\n      state,\n      response_type: 'code',\n    });`,
      draftComment: "This OAuth flow is missing PKCE which is required for SPAs per OAuth 2.1. You'll need to generate a code_verifier, compute the code_challenge, and include both in the authorize and token exchange requests.",
      status: "pending",
    },
    {
      id: "c3",
      severity: "warning",
      title: "OAuth callback doesn't validate redirect URI",
      explanation: "The callback handler exchanges the code for tokens but doesn't verify that the redirect URI matches what was originally sent. An attacker could potentially manipulate the redirect URI to capture authorization codes.",
      file: "src/auth/oauth.ts",
      lineStart: 42,
      lineEnd: 52,
      codeSnippet: `    const response = await fetch(\`\${this.baseUrl}/oauth/token\`, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ code, state }),\n      credentials: 'include',\n    });`,
      draftComment: "The token exchange should include the original redirect_uri for validation. Without it, you're relying entirely on the state parameter for security, which doesn't protect against redirect URI manipulation.",
      status: "pending",
    },
    {
      id: "c4",
      severity: "warning",
      title: "No rate limiting on token refresh",
      explanation: "The refreshSession method can be called repeatedly without any backoff or rate limiting. A bug in the refresh logic could cause an infinite loop of refresh requests, overwhelming the auth server.",
      file: "src/auth/oauth.ts",
      lineStart: 60,
      lineEnd: 78,
      codeSnippet: `  async refreshSession(): Promise<boolean> {\n    const refreshToken = this.tokenManager.getRefreshToken();\n    if (!refreshToken) return false;\n\n    try {\n      const response = await fetch(\`\${this.baseUrl}/oauth/refresh\`, {`,
      draftComment: "Consider adding exponential backoff or a minimum interval between refresh attempts. Without it, a refresh loop could hammer your auth server.",
      status: "pending",
    },
    {
      id: "c5",
      severity: "suggestion",
      title: "Test coverage missing for token refresh flow",
      explanation: "The test file has a placeholder for the code exchange test and no test for the refresh flow's success path. Given this is auth infrastructure, these are the most important paths to test.",
      file: "tests/auth/oauth.test.ts",
      lineStart: 20,
      lineEnd: 35,
      codeSnippet: `    it('should exchange code for tokens', async () => {\n      const mockFetch = vi.fn().mockResolvedValue({\n        ok: true,\n        json: () => Promise.resolve({\n          accessToken: 'at_123',\n          ...\n        }),\n      });\n      global.fetch = mockFetch;\n      \n      // ... test implementation\n    });`,
      draftComment: "The token exchange test is incomplete (placeholder comment) and the refresh success path has no test. For auth code, I'd like to see both paths fully tested before merging.",
      status: "pending",
    },
    {
      id: "c6",
      severity: "note",
      title: "SessionStore clear() iterates all sessionStorage keys",
      explanation: "The clear method iterates over all sessionStorage keys and filters by prefix. This works but is slightly wasteful. Not a blocker, but a targeted approach tracking known keys would be cleaner.",
      file: "src/auth/session-store.ts",
      lineStart: 17,
      lineEnd: 21,
      codeSnippet: `  clear(): void {\n    Object.keys(sessionStorage)\n      .filter(k => k.startsWith(this.prefix))\n      .forEach(k => sessionStorage.removeItem(k));\n  }`,
      draftComment: "Nit: Consider tracking the keys you set rather than scanning all of sessionStorage. Minor, not blocking.",
      status: "pending",
    },
  ],
  2: [
    {
      id: "c7",
      severity: "critical",
      title: "Race condition fix uses setTimeout instead of proper lock",
      explanation: "The fix adds a 100ms debounce via setTimeout, but this is a timing-based fix that will still fail under load. A proper mutex or connection state machine would be more reliable.",
      file: "src/ws/reconnect.ts",
      lineStart: 15,
      lineEnd: 22,
      codeSnippet: `    // Debounce reconnection attempts\n    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);\n    this.reconnectTimer = setTimeout(() => {\n      this.doReconnect();\n    }, 100);`,
      draftComment: "A setTimeout debounce is a timing-based fix — it'll still race under high load or slow networks. Consider a state machine (disconnected → connecting → connected) that rejects reconnect calls in the wrong state.",
      status: "pending",
    },
    {
      id: "c8",
      severity: "warning",
      title: "Event listeners not cleaned up on disconnect",
      explanation: "When the connection drops, old event listeners aren't removed before new ones are added during reconnection. This causes duplicate handlers.",
      file: "src/ws/reconnect.ts",
      lineStart: 30,
      lineEnd: 38,
      codeSnippet: `    this.ws = new WebSocket(this.url);\n    this.ws.onopen = () => this.onConnected();\n    this.ws.onclose = () => this.onDisconnected();\n    this.ws.onerror = (e) => this.onError(e);`,
      draftComment: "The old WebSocket's handlers aren't being cleaned up before creating a new one. You should null out or remove handlers on the old instance, or ensure the old instance is fully closed.",
      status: "pending",
    },
  ],
  3: [
    {
      id: "c9",
      severity: "warning",
      title: "Parameterized queries still concatenate table names",
      explanation: "While the values are now parameterized, table and column names are still being interpolated from variables. These should use a whitelist approach.",
      file: "src/db/queries.ts",
      lineStart: 12,
      lineEnd: 16,
      codeSnippet: `    const query = \`SELECT * FROM \${tableName} WHERE id = $1\`;`,
      draftComment: "Table names can't be parameterized in SQL, but they should be validated against an allowlist rather than interpolated directly from input.",
      status: "pending",
    },
  ],
  4: [
    {
      id: "c10",
      severity: "suggestion",
      title: "CSS custom properties not scoped to theme class",
      explanation: "The dark mode variables are set on a .dark class but there's no mechanism to prevent them from leaking into nested theme contexts.",
      file: "src/theme/variables.css",
      lineStart: 45,
      lineEnd: 52,
      codeSnippet: `  .dark {\n    --color-bg: #1a1a1a;\n    --color-text: #e5e5e5;\n  }`,
      draftComment: "Consider using data-theme attribute or CSS layers for better scoping, especially if components need to opt out of the parent theme.",
      status: "pending",
    },
  ],
};

export const mockSummaries: Record<number, string> = {
  1: "Replaces username/password login with OAuth2 (Google + GitHub). Adds token management with auto-refresh, session handling via sessionStorage, and updates the auth guard middleware. This is security-critical infrastructure that touches every authenticated route.",
  2: "Attempts to fix duplicate WebSocket reconnection by adding a debounce timer. The root cause was multiple onclose events firing simultaneously. Changes are small but the fix approach has issues.",
  3: "Systematic migration from raw SQL string concatenation to parameterized queries across 8 files. Reduces SQL injection surface area significantly, though some dynamic table references remain.",
  4: "Adds CSS custom properties for theming and a ThemeProvider context. Touches 22 component files to replace hardcoded colors with variables. Low risk — purely visual, no logic changes.",
};

export const mockFiles: FileChange[] = [
  {
    path: "src/auth/oauth.ts",
    language: "typescript",
    additions: 145,
    deletions: 12,
    status: "modified",
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
    status: "added",
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
    status: "added",
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
];
