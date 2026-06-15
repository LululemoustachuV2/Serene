export interface Session {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  sound: string;
}

export interface Settings {
  defaultDuration: number;
  defaultSound: string;
  intervalMinutes: number;
  warmupSeconds: number;
  theme: 'light' | 'dark';
}
