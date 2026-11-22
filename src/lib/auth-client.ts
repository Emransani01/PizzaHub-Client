"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth's browser client. Requests stay on the same origin and are
 * rewritten to the Express API, so the session cookie is first-party.
 */
export const authClient = createAuthClient();
