export type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "system_log"; text: string }
  | { id: string; role: "widget"; type: "hero"; videoId: string }
  | { id: string; role: "widget"; type: "gallery"; videoIds: string[] }
  | { id: string; role: "widget"; type: "profile"; data: any };
