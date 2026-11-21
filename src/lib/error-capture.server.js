/** Structured Cloudflare logs without request query strings or user payloads. */

function describe(error) {
  if (!error) return { name: "Error", message: "Unknown error", status: null, code: null };
  return {
    name: error.name ?? "Error",
    message: error.code ? "Server operation failed." : "Unhandled server error.",
    status: error.status ?? null,
    code: error.code ?? null,
  };
}

function safeUrl(request) {
  if (!request?.url) return null;
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch {
    return null;
  }
}

function report(kind, payload) {
  console.error("[error-capture]", kind, { kind, at: new Date().toISOString(), ...payload });
}

export function recordRouteError(request, error, routeId) {
  report("route_error", {
    routeId: routeId ?? null,
    url: safeUrl(request),
    error: describe(error),
  });
}

export function recordErrorResponse(request, result) {
  if (!(result instanceof Response) || result.status < 500) return undefined;
  report("error_response", {
    url: safeUrl(request),
    status: result.status,
  });
}

export function recordFunctionError(error, serverFnMeta) {
  report("function_error", {
    functionId: serverFnMeta?.functionId ?? null,
    error: describe(error),
  });
}

export function recordRequestError(request, error) {
  report("request_error", {
    url: safeUrl(request),
    method: request?.method ?? null,
    error: describe(error),
  });
}
