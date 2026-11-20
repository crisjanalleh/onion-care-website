export function getAppParams() {
  const env = (typeof import.meta !== "undefined" && import.meta.env) || {};
  return {
    appId: env.VITE_APP_ID || "",
    appBaseUrl: env.VITE_APP_BASE_URL || "",
    apiBaseUrl: env.VITE_APP_API_BASE_URL || "",
  };
}

export default getAppParams;
