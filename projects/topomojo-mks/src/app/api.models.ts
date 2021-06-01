export interface ConsoleRequest {
  name?: string;
  sessionId?: string;
}

export interface ConsolePresence {
  name?: string;
  sessionId?: string;
  username?: string;
}

export interface ConsoleSummary {
  id?: string;
  isolationId: string;
  name: string;
  url: string;
  isRunning?: boolean;
  error?: string;
}
