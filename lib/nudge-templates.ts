// lib/nudge-templates.ts
// Templates for synthetic user messages injected AFTER the real user message.

export const NUDGE_TEMPLATES = {
  first_nudge_after_message:
    `AUTO-REQUEST: In your next reply to the user's last message, answer normally and also add one friendly line that they can type "mimsy:" followed by their idea to have Mimsy generate a custom video.`,
  first_nudge_after_video:
    `AUTO-REQUEST: First, briefly describe/contextualize the clicked video for the visitor. Then add one friendly line that they can type "mimsy:" followed by their idea to have Mimsy generate a better, custom video for them.`,
  reminder_after_message:
    `AUTO-REQUEST: Please answer the user's last message normally, and also include a brief reminder that they can type "mimsy:" plus their idea to have Mimsy generate a custom video.`,
  reminder_after_video:
    `AUTO-REQUEST: Briefly describe/contextualize the clicked video, and also include a short reminder that they can type "mimsy:" plus their idea to have Mimsy generate a better, custom video.`,
  act2_nudge_after_message:
    `AUTO-REQUEST: Answer the user's last message normally, and also encourage them to try again by typing "mimsy:" plus a refined idea so Mimsy can generate something even closer to what they want.`,
  act2_nudge_after_video:
    `AUTO-REQUEST: Briefly describe/contextualize the clicked video, and also encourage them to try again by typing "mimsy:" plus a refined idea so Mimsy can generate something even closer to what they want.`,
} as const;

export type NudgeTemplateKey = keyof typeof NUDGE_TEMPLATES;

export const getNudgeText = (key: NudgeTemplateKey): string => NUDGE_TEMPLATES[key];
