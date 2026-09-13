# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Development

### Prerequisites

- Node.js (Latest LTS recommended)
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Local Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

### Building for Production

To build the application for production:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Code Style & Formatting

This project uses **Prettier** for code formatting and **ESLint** for code quality.

### Formatting

To automatically format the entire project:

```bash
npm run format
```

It is recommended to install the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension for VS Code and enable "Format On Save" in your editor settings.

### Linting

To check for code quality issues:

```bash
npm run lint
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Feature flags

Deployment availability comes from authenticated `GET /private/features` on the
backend. Use the shared `useFeatureFlag(FeatureFlag.…)` hook; do not introduce Vite
flags or local-storage overrides for the same capability. Existing authority routes
and family permissions still apply independently.

The hook shares an in-memory React Query snapshot and refetches when a consumer mounts,
on window focus, and on reconnect. It does not poll or persist flags. Only literal
`true` enables a known flag. Missing/malformed flags, initial loading, and request
failures disable the feature, including failures after a previously enabled response.
Unrelated pages continue to work when discovery is unavailable.

`family-task-manager-ai-assistant` gates the whole Family Task dashboard assistant:
its lazy-loaded widget, character assets, settings, advice, speech, highlights, and
reserved layout space. Disabling unmounts it and stops playback; ordinary task
completion and saved personal preferences are preserved.

The flag defaults off in every backend environment. Deploy the backend before this
frontend; enable through external backend properties and restart all backend instances.
Open dashboards catch up on navigation, focus, or reconnect. The backend independently
rejects new disabled assistant calls immediately after restart. English Coach voice
is unchanged. See the backend README for configuration and rollout details.
