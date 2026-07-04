// Shared session cookie name for the web BFF. Kept out of route handler files
// because Next.js App Router route modules may only export HTTP method handlers
// and a few reserved config keys — arbitrary named exports fail the route type
// check. Must match the API's SESSION_COOKIE (cl_session).
export const SESSION_COOKIE = 'cl_session';
