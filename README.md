# @vidwadeseram/auth-ui-shared

Shared npm package providing API client, authentication hooks, and OpenAPI schema generation for the auth template ecosystem.

## Features

- **API Client** — Fetch-based HTTP client with Bearer token auth, automatic 401 refresh, and request queue
- **AuthProvider + useAuth** — React context for managing auth state, login/register/logout flows
- **Schema CLI** — Generate Zod validators and TypeScript types from any OpenAPI 3.0 spec
- **Works with all 6 backends** — Python (FastAPI), Rust (Axum), Go (Gin/Gorilla Mux), single-tenant and multi-tenant

## Installation

```bash
npm install @vidwadeseram/auth-ui-shared
```

### Peer Dependencies

```bash
npm install @tanstack/react-query react zod
```

## Usage

### API Client

```typescript
import { createApiClient } from "@vidwadeseram/auth-ui-shared";

const client = createApiClient({
  baseUrl: "http://localhost:8001",
  getAccessToken: () => localStorage.getItem("access_token"),
  getRefreshToken: () => localStorage.getItem("refresh_token"),
  onTokensRefreshed: (tokens) => {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  },
});

// GET request
const users = await client.get("/users");

// POST request
const result = await client.post("/auth/login", { email, password });

// PUT request
await client.put("/users/me", { first_name: "John" });

// DELETE request
await client.delete("/users/123");
```

### AuthProvider

```tsx
import { AuthProvider } from "@vidwadeseram/auth-ui-shared";

function App() {
  return (
    <AuthProvider baseUrl="http://localhost:8001">
      <YourApp />
    </AuthProvider>
  );
}
```

### useAuth Hook

```tsx
import { useAuth } from "@vidwadeseram/auth-ui-shared";

function LoginPage() {
  const { login, logout, user, loading, apiClient } = useAuth();

  const handleLogin = async () => {
    await login("user@example.com", "password");
  };

  return (
    <div>
      {user ? (
        <p>Logged in as {user.email}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Schema Generation CLI

Generate TypeScript types and Zod validators from any backend's OpenAPI spec:

```bash
# From Python backend
node dist/cli/generate-schema.js --url http://localhost:8001/openapi.json -o src/types/generated.ts

# From Rust backend
node dist/cli/generate-schema.js --url http://localhost:8003/openapi.json -o src/types/generated.ts

# From Go backend
node dist/cli/generate-schema.js --url http://localhost:8005/openapi.json -o src/types/generated.ts

# From a local file
node dist/cli/generate-schema.js --file ./openapi.json -o src/types/generated.ts
```

The generated file exports:
- Zod schemas for all API request/response types
- TypeScript type inference from those schemas
- Full endpoint type safety

## Architecture

```
src/
├── client/
│   ├── api-client.ts       # HTTP client with auth interceptor
│   ├── auth-provider.tsx   # React context for auth state
│   └── errors.ts           # ApiError class
├── cli/
│   └── generate-schema.ts  # OpenAPI → Zod/TS generator
└── index.ts                # Barrel exports
```

## Backend Compatibility

| Backend | Port | OpenAPI URL |
|---------|------|-------------|
| python-auth-template | 8001 | `/openapi.json` |
| python-multi-tenant-auth-template | 8002 | `/openapi.json` |
| rust-auth-template | 8003 | `/openapi.json` |
| rust-multi-tenant-auth-template | 8004 | `/openapi.json` |
| go-auth-template | 8005 | `/openapi.json` |
| go-multi-tenant-auth-template | 8006 | `/openapi.json` |

## Development

```bash
npm install
npm run build        # Build ESM + CJS + types
npm run generate     # Generate schema from default backend
```

## License

MIT
