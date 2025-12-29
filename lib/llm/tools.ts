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

  // show full catalogue
  {
    type: "function" as const,
    name: "ui_show_all_videos",
    description: "Show the full video catalogue grid. Use this  when user asks for full catalog \ all the videos. if they ask for 'some' videos - opt for using ui_show_videos instead",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: [],
    },
  },

  // toggle dark mode
  {
    type: "function" as const,
    name: "ui_set_dark_mode",
    description: "Switch the site into dark mode.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: {
          type: "boolean",
          description: "True = dark mode on, false = light mode.",
        },
      },
      required: ["enabled"],
    },
  },

  // show contact card
  {
    type: "function" as const,
    name: "ui_show_contact_card",
    description:
      "Reveal the contact card so the visitor can email or call Michael. Use when the user asks how to reach him or requests contact options.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: [],
    },
  },
];
