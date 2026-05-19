export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message, status = 500) {
  return Response.json({ error: message }, { status });
}
