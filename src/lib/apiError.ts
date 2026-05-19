// Mirrors the backend's standardized error body:
//   { error: string, code: string, detail?: string, details?: string[] }
// Every failed request is normalized to this so UI/redirect logic has
// one contract to branch on.
export interface ApiError {
  status: number;
  code: string;
  message: string;
  detail?: string;
  details?: string[];
}

export const ERROR_CODES = {
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  VALIDATION: "validation_failed",
  BAD_REQUEST: "bad_request",
  UNAUTHORIZED: "unauthorized",
  NETWORK: "network_error",
  UNKNOWN: "error",
} as const;

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "code" in value &&
    "message" in value
  );
}
