import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { errorCaptureFunctionMiddleware, errorCaptureRequestMiddleware } from "@/lib/error-capture";
import { authMiddleware, databaseRequestMiddleware } from "@/lib/auth-middleware";

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

/**
 * The Start entry. Error capture runs first, followed by Firebase request
 * authentication for server functions and route handlers.
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, errorCaptureRequestMiddleware, databaseRequestMiddleware],
  functionMiddleware: [errorCaptureFunctionMiddleware, authMiddleware],
}));
