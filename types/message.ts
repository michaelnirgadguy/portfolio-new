export type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; chips?: string[] }
  | { id: string; role: "system_log"; text: string }
  | { id: string; role: "widget"; type: "hero"; videoId: string }
  | { id: string; role: "widget"; type: "gallery"; videoIds: string[] }
  | { id: string; role: "widget"; type: "contact-card" }
  | { id: string; role: "widget"; type: "profile"; data: any }
  | { id: string; role: "widget"; type: "mega-card" }
  | { id: string; role: "widget"; type: "act1-fail"; script: string[]; lineDelayMs?: number };
