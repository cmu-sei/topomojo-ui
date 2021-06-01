
export interface ConsoleService {
  connect(url: string, stateCallback: (state: string) => void, options: any): void;
  disconnect(): void;
  refresh(): void;
  sendCAD(): void;
  toggleScale(): void;
  fullscreen(): void;
  showKeyboard(): void;
  showExtKeypad(): void;
  showTrackpad(): void;
  copy(): void;
  paste(text: string): void;
  dispose(): void;
}
