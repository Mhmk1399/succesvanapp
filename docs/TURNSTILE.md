# App sign-in security

The app loads `/api/mobile/security-check` from the same website as `EXPO_PUBLIC_AUTH_API`. The page uses the website's existing Turnstile site key and sends a single-use token back to the app. The existing `/api/auth` endpoint validates it before sending an SMS. Tokens and server secrets are not stored in the app.

## Local development

1. Run the `succesvanfinal` Next.js server in development mode and start Expo.
2. Set `EXPO_PUBLIC_AUTH_API` in the app to the development server's `/api/auth` URL. Restart Expo after changing an Expo environment variable. On an Android emulator, `localhost` is mapped to `10.0.2.2`. On a physical device, use the computer's reachable LAN address; the phone and computer must be on the same network. iOS simulators can normally use `localhost`.
3. The website automatically uses Cloudflare's test widget and test verifier in development. The network must still be able to reach Cloudflare. SMS delivery, phone validation and rate limits remain active; the test widget does not bypass them.
   If trusted proxy headers are enabled but absent during local development, the website uses the loopback IP for rate limiting. Production still requires the configured trusted header.
4. Expo Web on localhost is allowed by the development server. For another development web origin, add its exact origin to the website's `APP_AUTH_ALLOWED_ORIGINS` and restart Next.js.

## Production

The website requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES` and `OTP_HASH_SECRET`. Configure the widget hostname in Cloudflare and use an HTTPS API URL. Keep all secrets on the server.

Native apps do not require an app-origin CORS entry. If Expo Web is hosted on a separate origin, configure its exact origin in the website's comma-separated `APP_AUTH_ALLOWED_ORIGINS` and deploy the website. Do not use wildcards. A development build is needed after adding native dependencies to a custom dev client; Expo Go includes WebView.

The verification page must be deployed to the same server as `/api/auth`. A user's device must be able to reach both that server and `challenges.cloudflare.com`.
