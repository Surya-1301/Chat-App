This repository contains an Expo React Native project in `frontend/` set up for web export and Netlify deployment.

Quick steps to deploy on Netlify:

1. In the Netlify dashboard, create a new site from Git.
2. Connect your repository and choose the branch to deploy (e.g., `main`).
3. Use the default build settings — Netlify will read `netlify.toml` in the repo root.
   - Build command (configured in netlify.toml):
     cd 'frontend' && npm install --no-audit --no-fund && (npx expo export:web web-build || (npm install -g expo-cli && npx expo export:web web-build))
   - Publish directory: frontend/web-build
4. Add environment variables in Netlify Site > Settings > Build & deploy > Environment:
   - EXPO_PUBLIC_API_URL — e.g. https://api.example.com
   - Any OAuth client IDs used by the app (EXPO_PUBLIC_GOOGLE_CLIENT_ID)
5. Trigger a deploy. The web export will create static assets inside `frontend/web-build` which Netlify will publish.

Troubleshooting:
- If the build fails because `expo export:web` requires Webpack bundler, ensure you have `react-native-web` and `react-dom` in `frontend/package.json` (they are present in this project).
- If Netlify's Node version is incompatible, set the Node version in `frontend/package.json` `engines` field or in Netlify UI.
- If builds still fail, run the build locally:

  cd 'frontend'
  npm install
  npx expo export:web

Then inspect the created `web-build` folder.

Notes:
- Netlify serves the static site — any server-side APIs must be deployed separately (backend/). Update `EXPO_PUBLIC_API_URL` to point to your backend deployment.
- For SPA routing, ensure Netlify redirects are configured; Netlify autodetects some frameworks, but you can add a `_redirects` file into `frontend/web-build` during build if necessary.
