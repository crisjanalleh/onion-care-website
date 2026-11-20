/**
 * Application managed file: error-capture v1 (server side).
 *
 * Server failures are reported to the application so they can be surfaced to the
 * owner. Outside the application there is nowhere to send them, so this falls back
 * to the server log. Reporting must never change what a visitor receives, so
 * every path here swallows its own errors.
 */

function describe(error) {
  if (!error) return { name: "Error", message: "Unknown error", stack: null };
  return {
    name: error.name ?? "Error",
    message: error.message ?? String(error),
    stack: error.stack ?? null,
    status: error.status ?? null,
    code: error.code ?? null,
  };
}

async function report(kind, payload) {
  const record = { kind, at: new Date().toISOString(), ...payload };
  try {
    const endpoint = globalThis.__APP_ERROR_ENDPOINT__;
    if (endpoint) {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      return;
    }
    console.error("[error-capture]", kind, record);
  } catch {
    // Reporting failures are never allowed to affect the response.
  }
}

/** A page's loader or beforeLoad error, found after the router has run. */
export function recordRouteError(request, error, routeId) {
  return report("route_error", {
    routeId: routeId ?? null,
    url: request?.url ?? null,
    error: describe(error),
  });
}

/** A 5xx response the app returned, recorded without altering it. */
export function recordErrorResponse(request, result) {
  if (!(result instanceof Response) || result.status < 500) return undefined;
  return report("error_response", {
    url: request?.url ?? null,
    status: result.status,
  });
}

/** A server function's error, before TanStack serializes it for the caller. */
export function recordFunctionError(error, serverFnMeta) {
  return report("function_error", {
    functionId: serverFnMeta?.functionId ?? null,
    error: describe(error),
  });
}

/** An error that escaped a server route or another middleware. */
export function recordRequestError(request, error) {
  return report("request_error", {
    url: request?.url ?? null,
    method: request?.method ?? null,
    error: describe(error),
  });
}
