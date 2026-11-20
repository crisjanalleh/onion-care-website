import "@/lib/appDatabase";
import { createStart } from "@tanstack/react-start";
import { errorCaptureFunctionMiddleware, errorCaptureRequestMiddleware } from "@/lib/error-capture";
import { authMiddleware, databaseRequestMiddleware } from "@/lib/auth-middleware";

/**
 * The start entry (`src/start.js`), detected automatically. The error-capture
 * pair must stay first in each list; Application replaces `@/lib/error-capture` with
 * newer versions and expects that order. `authMiddleware` then gives every
 * server function the visitor's Application client as `context.getDatabase()`, and
 * `databaseRequestMiddleware` does the same for server routes.
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [errorCaptureRequestMiddleware, databaseRequestMiddleware],
  functionMiddleware: [errorCaptureFunctionMiddleware, authMiddleware],
}));
