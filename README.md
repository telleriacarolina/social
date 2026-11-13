
# Social

### All Your Social Worlds. One Place.

Social is an all-in-one social networking platform designed to bring people, content, communities, and conversations together.

The platform aims to give identity-verified users one place to share photos, videos, written posts, discover interests, connect social accounts, exchange private and group messages, build communities, and develop meaningful connections.

Our goal is to create a secure, engaging, and user-centered social experience that brings together the most useful aspects of modern social platforms.

---

## Project Vision

Social aims to make online interaction more connected and meaningful by bringing multiple social experiences into one platform.

Instead of managing separate spaces for sharing content, discovering interests, messaging friends, and participating in communities, users will be able to access these experiences in one place.

Identity verification is intended to help establish trust while protecting users' personal and sensitive information.

## Planned Features

### User Accounts and Identity Verification
- User registration and authentication.
- Secure login and session management.
- Identity verification through a dedicated verification provider.
- Privacy-focused user profiles.
- Account settings and privacy controls.

### Social Feed and Content Sharing
- Share photos, videos, and written posts.
- Create and manage personal posts.
- Discover content from other users.
- Like, comment on, and interact with posts.
- Follow other users and build connections.

### Social Discovery
- Explore content based on interests.
- Discover users and communities.
- Connect and share links to supported external social platforms.
- Find new interests and meaningful connections.

### Private and Group Messaging
- One-to-one private conversations.
- Group messaging.
- Real-time messaging capabilities.
- Conversation and notification management.

### Communities
- Create and join communities.
- Participate in interest-based discussions.
- Manage community memberships.
- Build spaces around shared interests.

### Notifications
- Notifications for interactions and activity.
- New message notifications.
- Community updates.
- Account and security notifications.

### External Social Integrations
- Connect supported external social accounts.
- Share links to external content.
- Provide integration points for future platform connections.

---

## Technology Stack

The planned foundation uses the following technologies:

| Technology | Purpose |
|---|---|
| Next.js | Web application and routing |
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling and responsive design |
| shadcn/ui | Reusable interface components |
| Supabase | PostgreSQL database, authentication, storage, and realtime capabilities |
| Vercel | Application hosting and deployment |
| Zod | Data validation |
| Vitest | Testing |
| React Testing Library | Component testing |

The architecture will begin as a modular monolith, allowing features to remain organized and independently maintainable without introducing unnecessary service complexity.

---

## Security and Privacy

Security and privacy are foundational principles of this project.

Planned safeguards include:

- Secure authentication and session handling.
- Database access controls and Supabase Row Level Security (RLS).
- Server-side validation of sensitive operations.
- Secure handling of API keys and environment variables.
- Protection of private messages and user information.
- Privacy-focused identity verification.
- No public exposure of government identification documents or sensitive verification data.
- Secure authorization for external social account connections.

Privileged credentials, including Supabase service-role keys, must never be exposed in browser-accessible code or committed to the repository.

---

## Project Structure

The intended application structure will evolve as development progresses.

```text
social/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (social)/
│   │   ├── messages/
│   │   ├── communities/
│   │   ├── discover/
│   │   └── settings/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── types/
│   └── styles/
├── supabase/
│   └── migrations/
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is the proposed structure, not a claim that all directories and application modules have already been implemented.

---

## Environment Configuration

The project will use environment variables for local development and deployment configuration.

Create a local `.env.local` file using `.env.example` as a reference.

Expected variables include:

```dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Application
NEXT_PUBLIC_APP_URL=

# Optional identity verification provider
IDENTITY_VERIFICATION_API_KEY=
```

Never commit `.env.local` or actual credentials to GitHub.

The Supabase service-role key and identity verification API key must remain server-side secrets.

---

## Development Roadmap

Development will proceed in stages:

- [ ] Establish the initial application foundation.
- [ ] Configure Supabase and database migrations.
- [ ] Implement authentication and account management.
- [ ] Build user profiles and privacy settings.
- [ ] Develop the social feed and content-sharing features.
- [ ] Implement follows, comments, and reactions.
- [ ] Build private and group messaging.
- [ ] Introduce communities and discovery.
- [ ] Implement notifications.
- [ ] Add external social account integrations.
- [ ] Integrate identity verification.
- [ ] Complete security testing and production readiness.
- [ ] Deploy and validate the application on Vercel.

---

## Development Status

<badge color="warning">Foundation stage</badge>

The initial Next.js application foundation and Supabase authentication/database infrastructure have been implemented. The broader social networking features remain under development and should not be considered production-ready until their implementation and security validation are complete.

---

## Deployment

The application is designed to deploy to [Vercel](https://vercel.com/) using its native Next.js framework support.

### Vercel project settings

- Framework preset: Next.js (automatic detection).
- Root directory: repository root.
- Build command: `npm run build`.
- Install command: `npm ci` (Vercel may use its detected package-manager default).
- Output directory: leave the default; Next.js manages its own build output.
- Node.js: select `26.x` in Vercel Project Settings. The current `package.json` engine range (`>=20.9.0`) permits Node.js 26. Do not select Node.js 20, which Vercel has deprecated for new deployments.

No custom `vercel.json` is required for a standard Next.js deployment.

### Environment variables

Configure these variables in Vercel for Preview and Production:

| Variable | Required now | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key |

Only add privileged server-side credentials when a future server-side feature actually requires them. Never prefix secrets with `NEXT_PUBLIC_`.

### Deployment verification

After deploying:

1. Confirm the Vercel deployment completes successfully.
2. Open the deployed application and verify the landing page loads.
3. Visit `/api/health` and confirm it returns HTTP 200 with a JSON status of `ok`.
4. Test Supabase authentication after the authentication interface is implemented.
5. Review Vercel deployment logs for runtime errors.

The `/api/health` endpoint is a basic application liveness check. It does not verify Supabase connectivity, database availability, or authentication functionality.

---

## Contributing

Contributions, ideas, bug reports, and suggestions are welcome as the project develops.

Please use GitHub Issues and Pull Requests to discuss proposed changes and improvements.

All contributions should prioritize security, privacy, maintainability, accessibility, and user experience.

---

## License

No open-source license has been selected yet.

Until a license is added, all rights are reserved by the copyright holder. No permission to reuse, distribute, or modify this project is granted by default.
