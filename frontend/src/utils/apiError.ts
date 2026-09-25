import axios from "axios";

/**
 * Safely extracts a user-friendly error message from an unknown error (typically AxiosError).
 * Prevents raw internal database or backend stack traces from leaking into the UI.
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    // Network errors (e.g. backend server down or unreachable)
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Unable to connect to the server. Please check your connection.";
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }

    // Check backend response data
    const resData = error.response.data;
    if (typeof resData === "string" && resData.trim().length > 0) {
      // Guard against raw HTML or SQL dumps
      if (!resData.includes("<!DOCTYPE") && !resData.includes("syntax error")) {
        return resData;
      }
    } else if (resData && typeof resData === "object") {
      if ("message" in resData && typeof resData.message === "string") {
        const msg = resData.message.trim();
        // Guard against postgres/internal server trace exposure
        if (
          !msg.toLowerCase().includes("syntax error") &&
          !msg.toLowerCase().includes("column \"") &&
          !msg.toLowerCase().includes("relation \"")
        ) {
          return msg;
        }
      }
      if ("error" in resData && typeof resData.error === "string") {
        return resData.error;
      }
    }

    // Status code fallbacks
    if (error.response.status === 401) {
      return "Authentication session expired or invalid credentials.";
    }
    if (error.response.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.response.status === 404) {
      return "The requested resource was not found.";
    }
    if (error.response.status >= 500) {
      return "Server error occurred. Please try again shortly.";
    }
  }

  if (error instanceof Error) {
    // Basic JS Error (ensure it's not a technical internal message)
    if (!error.message.includes("at ") && !error.message.includes("TypeError")) {
      return error.message;
    }
  }

  return fallbackMessage;
}
