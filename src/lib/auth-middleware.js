import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { getFirebaseAuth } from "@/lib/firebase/client";

async function resolveRequestContext(request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { firebase: null, database: null, user: null };

  const [{ createFirebaseRequestContext }, { verifyFirebaseIdToken }, { createFirebaseDatabase }] = await Promise.all([
    import("@/lib/firebase/request-context"),
    import("@/lib/firebase/auth-verification"),
    import("@/lib/firebase/firestore-rest"),
  ]);
  const firebase = createFirebaseRequestContext();
  const identity = await verifyFirebaseIdToken({
    token,
    apiKey: firebase.apiKey,
    emulatorHost: firebase.authEmulatorHost,
  });
  if (!identity) return { firebase, database: null, user: null };

  const database = createFirebaseDatabase(firebase);
  const account = await database.entities.User.get(identity.id);
  if (account && !["admin", "farmer"].includes(account.role)) {
    return { firebase, database, user: null };
  }
  if (account?.status && account.status !== "active") {
    return { firebase, database, user: null };
  }
  const role = account?.role === "admin" ? "admin" : "farmer";

  return {
    firebase,
    database,
    user: {
      ...identity,
      full_name: account?.full_name ?? identity.full_name,
      role,
    },
  };
}

async function withFirebaseContext(next, request) {
  const resolved = await resolveRequestContext(request);
  let database = resolved.database;
  return next({
    context: {
      firebase: resolved.firebase,
      user: resolved.user,
      getDatabase() {
        if (!database) {
          throw Object.assign(new Error("Firebase is not configured for this request."), {
            status: 503,
            code: "FIREBASE_CONFIGURATION_MISSING",
          });
        }
        return database;
      },
    },
  });
}

export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const user = getFirebaseAuth().currentUser;
    const token = user ? await user.getIdToken() : null;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  })
  .server(({ next }) => withFirebaseContext(next, getRequest()));

export const databaseRequestMiddleware = createMiddleware({ type: "request" }).server(({ next, request }) =>
  withFirebaseContext(next, request),
);

export const requireUser = createMiddleware({ type: "function" }).server(async ({ next, context }) => {
  if (!context.user) {
    setResponseStatus(401);
    throw Object.assign(new Error("Sign in to continue."), { status: 401, code: "UNAUTHORIZED" });
  }
  if (!context.user.emailVerified) {
    setResponseStatus(403);
    throw Object.assign(new Error("Verify your email address to continue."), {
      status: 403,
      code: "EMAIL_VERIFICATION_REQUIRED",
    });
  }
  return next({ context: { user: context.user } });
});

export const requireUserRoute = createMiddleware({ type: "request" }).server(async ({ next, context }) => {
  if (!context.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!context.user.emailVerified) {
    return Response.json({ error: "Email verification required." }, { status: 403 });
  }
  return next({ context: { user: context.user } });
});
