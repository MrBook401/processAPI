# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | PascalCase for Services/Repos; camelCase/kebab otherwise | `EventRepository.ts`, `sqlite.ts` | Directory tree |
| Functions/methods | camelCase | `validateTiming` | `src/services/WindowCalculationEngine.ts` |
| Types/interfaces | PascalCase | `TimeWindow`, `ValidationResponse` | `src/types.ts` |
| Constants/env vars | PascalCase for schemas; UPPER_SNAKE_CASE typical for envs | `TimeWindowSchema` | `src/types.ts` |

### 2) Formatting and Linting

- Formatter: No root prettier/eslint detected; Next.js frontend has eslint configured (`src/ui/eslint.config.mjs`)
- Linter: ESLint (Frontend)
- Most relevant enforced rules: `eslint-config-next` standard rules. `tsconfig.json` enforces `strict: true`.
- Run commands: `cd src/ui && npm run lint`

### 3) Import and Module Conventions

- Import grouping/order: Standard JS order; relative imports used frequently. No barrel file in `src/services`.
- Alias vs relative import policy: Relative paths used across backend (`../types`).
- Public exports/barrel policy: Direct file imports rather than `index.ts` re-exports in backend services.

### 4) Error and Logging Conventions

- Error strategy by layer: Route handler captures errors and typically sends `res.status(500).json({ error: error.message })`.
- Logging style and required context fields: `console.error` and `console.log` standard usage in `routes.ts` and `app.ts`. No specialized logging library like Winston/Pino.
- Sensitive-data redaction rules: [TODO] No explicitly defined redaction rules found in codebase.

### 5) Testing Conventions

- Test file naming/location rule: `.test.ts` files placed in `src/tests/` directory.
- Mocking strategy norm: In-memory mock or stub data typically.
- Coverage expectation: `>80% overall API coverage` expected per `spec/spec-design-process-manager-api.md`.

### 6) Evidence

- `src/services/WindowCalculationEngine.ts`
- `src/types.ts`
- `tsconfig.json`
- `src/api/routes.ts`
- `spec/spec-design-process-manager-api.md`