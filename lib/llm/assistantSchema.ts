export type AssistantReply = {
  text: string;
  chips: string[];
};

export const assistantReplySchema = {
  type: "object",
  description: "Validated payload returned by the assistant.",
  properties: {
    text: {
      type: "string",
      description: "Primary assistant reply text to render in the chat bubble.",
    },
    chips: {
      type: "array",
      description: "Suggestion chips to surface for the next user turn.",
      items: { type: "string" },
    },
  },
  required: ["text", "chips"],
  additionalProperties: false,
} as const;
