export function logClick(action: string, file: string, line: number) {
  // Structured logging for easier filtering
  // Example: logClick('Print button', 'client/pages/Index.tsx', 270)
  console.log(`[ACTION] ${action} @ ${file}:${line}`);
}

export function logInfo(message: string, file: string, line: number) {
  console.log(`[INFO] ${message} @ ${file}:${line}`);
}
