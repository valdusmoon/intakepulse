/**
 * Correlation ID generation for call tracing — lets you grep logs for one call
 * across the voice route, stream route, and function handlers.
 */
export function generateCorrelationId(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const random = Math.random().toString(36).substring(2, 10);
  return `call_${datePart}_${timePart}_${random}`;
}
