// lib/llm/routerSchema.ts
import { z } from "zod";
import { INTENTS, RouterIntent } from "./intents";

// Narrowed string validator using the single source of truth from intents.ts
export const RouterIntentSchema = z.custom<RouterIntent>(
  (val): val is RouterIntent =>
    typeof val === "string" && (INTENTS as readonly string[]).includes(val),
  { message: "Invalid router intent" }
);

// Args: unified on videoIds only (max 3)
export const RouterArgsSchema = z
  .object({
    videoIds: z.array(z.string()).max(3).optional(),
  })
  .strict()
  .partial();

export const RouterPayloadSchema = z
  .object({
    intent: RouterIntentSchema,
    message: z.string().default(""),
    args: RouterArgsSchema.optional(),
  })
  .strict();

export type RouterPayload = z.infer<typeof RouterPayloadSchema>;

// OpenAI response_format JSON Schema (kept minimal & portable)
export const RouterPayloadJsonSchema = {
  name: "router_payload",
  schema: {
    type: "object",
    required: ["intent", "message"],
    additionalProperties: false,
    properties: {
      intent: { type: "string", enum: INTENTS as unknown as string[] },
      message: { type: "string" },
      args: {
        type: "object",
        additionalProperties: true, // allow future fields without breaking
        properties: {
          videoIds: {
            type: "array",
            items: { type: "string" },
            minItems: 0,
            maxItems: 3,
          },
        },
      },
    },
  },
} as const;
