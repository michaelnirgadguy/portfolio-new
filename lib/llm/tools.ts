// lib/llm/tools.ts
// Responses-API style function tool (no nested {function:{...}} block).

export const TOOLS = [
  {
    type: "function" as const,
    name: "ui_show_videos",
    description:
      "Show one or more videos on the site. If exactly one ID is provided, open the player. If multiple IDs are provided, render a thumbnails grid. Use only IDs from the catalog.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        videoIds: {
          type: "array",
          description:
            "Array of catalog video IDs. One ID opens the player, multiple IDs show a grid.",
          items: { type: "string" },
          minItems: 1,
        },
      },
      required: ["videoIds"],
    },
  },
];
