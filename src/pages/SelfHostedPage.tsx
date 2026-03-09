import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Server, Copy, Check, Shield, Database, Lock, Globe, Terminal, Download } from "lucide-react";
import { toast } from "sonner";

const DOCKER_COMPOSE = `version: '3.8'

services:
  # PostgreSQL database
  db:
    image: supabase/postgres:15.1.1.61
    restart: unless-stopped
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: reviewlens
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  # Supabase Studio (optional admin UI)
  studio:
    image: supabase/studio:20240101
    restart: unless-stopped
    ports:
      - "\${STUDIO_PORT:-3000}:3000"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      SUPABASE_URL: http://kong:8000
      SUPABASE_REST_URL: http://kong:8000/rest/v1/

  # GoTrue auth server
  auth:
    image: supabase/gotrue:v2.143.0
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: \${API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:\${POSTGRES_PASSWORD}@db:5432/reviewlens
      GOTRUE_SITE_URL: \${SITE_URL}
      GOTRUE_JWT_SECRET: \${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_DISABLE_SIGNUP: "false"

  # PostgREST API
  rest:
    image: postgrest/postgrest:v12.0.1
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://postgres:\${POSTGRES_PASSWORD}@db:5432/reviewlens
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \${JWT_SECRET}

  # Kong API Gateway
  kong:
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - "\${API_PORT:-8000}:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml

  # ReviewLens Frontend
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "\${APP_PORT:-8080}:80"
    environment:
      VITE_SUPABASE_URL: http://kong:8000
      VITE_SUPABASE_PUBLISHABLE_KEY: \${ANON_KEY}
      VITE_SELF_HOSTED: "true"

volumes:
  db_data:
`;

const DOCKERFILE = `# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

const ENV_TEMPLATE = `# ReviewLens Self-Hosted Configuration
# Copy this to .env and fill in your values

# Database
POSTGRES_PASSWORD=your-super-secret-password
POSTGRES_PORT=5432

# Auth
JWT_SECRET=your-jwt-secret-min-32-characters-long
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:8080

# API
API_PORT=8000
ANON_KEY=your-anon-key

# App
APP_PORT=8080
STUDIO_PORT=3000

# GitHub (for PR reviews)
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=

# AI Provider (for code analysis)
OPENAI_API_KEY=

# Stripe (optional, for billing)
STRIPE_SECRET_KEY=
`;

const SETUP_SCRIPT = `#!/bin/bash
set -e

echo "🔍 ReviewLens Self-Hosted Setup"
echo "================================"

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required"; exit 1; }

# Generate secrets if not set
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cp .env.example .env
  
  # Generate random secrets
  JWT_SECRET=$(openssl rand -base64 32)
  POSTGRES_PASSWORD=$(openssl rand -base64 24)
  
  sed -i "s/your-jwt-secret-min-32-characters-long/$JWT_SECRET/" .env
  sed -i "s/your-super-secret-password/$POSTGRES_PASSWORD/" .env
  
  echo "✅ Generated secure secrets"
fi

echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "✅ ReviewLens is running!"
echo "   App:    http://localhost:\${APP_PORT:-8080}"
echo "   API:    http://localhost:\${API_PORT:-8000}"
echo "   Studio: http://localhost:\${STUDIO_PORT:-3000}"
echo ""
echo "📖 Next steps:"
echo "   1. Configure your GitHub token in the app"
echo "   2. Set up your AI provider API key"
echo "   3. Invite your team members"
`;

function CopyBlock({ content, label }: { content: string; label: string }) {
  const [copied, setCopied] = useState(false);
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success(`${label} copied`);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
        >
          {copied ? <Check className="h-3 w-3 text-success" strokeWidth={2} /> : <Copy className="h-3 w-3" strokeWidth={1.5} />}
        </button>
      </div>
      <pre className="text-[10px] font-mono bg-secondary/50 border rounded-lg p-3 overflow-x-auto max-h-48 text-foreground leading-relaxed">
        {content.slice(0, 500)}{content.length > 500 ? "\n..." : ""}
      </pre>
    </div>
  );
}

export default function SelfHostedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "setup" | "files">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "setup" as const, label: "Setup Guide" },
    { id: "files" as const, label: "Configuration Files" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <button
          onClick={() => navigate("/settings")}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Back to settings
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Server className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          <div>
            <h1 className="text-lg font-medium tracking-tight text-foreground">Self-Hosted Deployment</h1>
            <p className="text-xs text-muted-foreground">Run ReviewLens on your own infrastructure for maximum data privacy.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px ${
                activeTab === tab.id 
                  ? "text-foreground border-foreground" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, title: "Air-gapped security", desc: "No data leaves your network. All code analysis happens locally." },
                { icon: Database, title: "Your database", desc: "Full PostgreSQL with your backup strategy and compliance." },
                { icon: Lock, title: "SSO / LDAP ready", desc: "Integrate with your existing identity provider." },
                { icon: Globe, title: "Custom domain", desc: "Host on your own domain with your TLS certificates." },
              ].map(item => (
                <div key={item.title} className="border rounded-lg p-4">
                  <item.icon className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.5} />
                  <p className="text-xs font-medium text-foreground mb-0.5">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Architecture */}
            <div className="border rounded-lg p-4">
              <p className="text-xs font-medium text-foreground mb-3">Architecture</p>
              <div className="space-y-2">
                {[
                  { label: "Frontend", desc: "React SPA served via Nginx" },
                  { label: "API Gateway", desc: "Kong routing to backend services" },
                  { label: "Auth", desc: "GoTrue for JWT-based authentication" },
                  { label: "Database", desc: "PostgreSQL 15 with RLS policies" },
                  { label: "REST API", desc: "PostgREST for auto-generated CRUD" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-24 shrink-0">{item.label}</span>
                    <span className="h-px bg-border flex-1" />
                    <span className="text-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-xs font-medium text-foreground mb-2">System requirements</p>
              <ul className="space-y-1 text-[10px] text-muted-foreground">
                <li>• Docker 20.10+ and Docker Compose v2</li>
                <li>• 4GB RAM minimum (8GB recommended)</li>
                <li>• 20GB disk space</li>
                <li>• Linux, macOS, or Windows with WSL2</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "setup" && (
          <div className="space-y-6">
            <ol className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Clone and configure",
                  content: (
                    <div className="space-y-2">
                      <code className="text-[10px] font-mono bg-secondary px-2 py-1 rounded block text-foreground">
                        git clone https://github.com/your-org/reviewlens-self-hosted.git{"\n"}
                        cd reviewlens-self-hosted{"\n"}
                        chmod +x setup.sh && ./setup.sh
                      </code>
                    </div>
                  ),
                },
                {
                  step: 2,
                  title: "Configure environment",
                  content: (
                    <p className="text-[10px] text-muted-foreground">
                      Edit <code className="font-mono bg-secondary px-1 rounded">.env</code> with your GitHub token, AI provider key, and domain settings.
                    </p>
                  ),
                },
                {
                  step: 3,
                  title: "Start services",
                  content: (
                    <code className="text-[10px] font-mono bg-secondary px-2 py-1 rounded block text-foreground">
                      docker compose up -d
                    </code>
                  ),
                },
                {
                  step: 4,
                  title: "Verify",
                  content: (
                    <p className="text-[10px] text-muted-foreground">
                      Open <code className="font-mono bg-secondary px-1 rounded">http://localhost:8080</code> and sign in. Check all services with{" "}
                      <code className="font-mono bg-secondary px-1 rounded">docker compose ps</code>.
                    </p>
                  ),
                },
              ].map(item => (
                <li key={item.step} className="flex gap-3">
                  <span className="text-[10px] h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center font-mono shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">{item.title}</p>
                    {item.content}
                  </div>
                </li>
              ))}
            </ol>

            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-xs font-medium text-foreground">Useful commands</p>
              </div>
              <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                <p><span className="text-foreground">docker compose logs -f</span> — View logs</p>
                <p><span className="text-foreground">docker compose down</span> — Stop services</p>
                <p><span className="text-foreground">docker compose pull && docker compose up -d</span> — Update</p>
                <p><span className="text-foreground">docker compose exec db pg_dump reviewlens &gt; backup.sql</span> — Backup</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="space-y-4">
            <CopyBlock content={DOCKER_COMPOSE} label="docker-compose.yml" />
            <CopyBlock content={DOCKERFILE} label="Dockerfile" />
            <CopyBlock content={ENV_TEMPLATE} label=".env.example" />
            <CopyBlock content={SETUP_SCRIPT} label="setup.sh" />

            <button
              onClick={() => {
                const blob = new Blob([
                  `# ReviewLens Self-Hosted\n\n`,
                  `## docker-compose.yml\n\`\`\`yaml\n${DOCKER_COMPOSE}\`\`\`\n\n`,
                  `## Dockerfile\n\`\`\`dockerfile\n${DOCKERFILE}\`\`\`\n\n`,
                  `## .env.example\n\`\`\`\n${ENV_TEMPLATE}\`\`\`\n\n`,
                  `## setup.sh\n\`\`\`bash\n${SETUP_SCRIPT}\`\`\`\n`,
                ], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "reviewlens-self-hosted.md";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Configuration files downloaded");
              }}
              className="w-full border rounded-lg p-3 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Download all as markdown
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
