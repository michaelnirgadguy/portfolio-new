// lib/nudge-templates.ts
// Templates for synthetic user messages injected AFTER the real user message.

export const NUDGE_TEMPLATES = {
  first_nudge_after_message:
    `AUTO-REQUEST: Answer the user's last massage, while letting them know that if they type "Mimsy:" followed by a vidoe idea - you will generat it for them.`,
  first_nudge_after_video:
    `AUTO-REQUEST: briefly describe/contextualize the clicked video for the visitor, and suggest that you, Mimsy, can do better: inform the visitor that if they type "Mimsy:" followed by a vidoe idea - you will generat it for them.`,
  reminder_after_message:
    `AUTO-REQUEST: answer the user's last message normally, and also include a brief reminder that they can type "mimsy:" plus their idea to have Mimsy generate a custom video.`,
  reminder_after_video:
    `AUTO-REQUEST: Briefly describe/contextualize the clicked video, and also include a short reminder that they can type "mimsy:" plus their idea to have Mimsy generate a better, custom video.`,
  act2_nudge_after_message:
    `AUTO-REQUEST: Answer the user's last message normally, and also encourage them to try again by typing "mimsy:" plus a refined idea so Mimsy can generate something even closer to what they want.`,
  act2_nudge_after_video:
    `AUTO-REQUEST: Briefly describe/contextualize the clicked video, and also encourage them to try again by typing "mimsy:" plus a refined idea so Mimsy can generate something even closer to what they want.`,
} as const;

export type NudgeTemplateKey = keyof typeof NUDGE_TEMPLATES;

export const getNudgeText = (key: NudgeTemplateKey): string => NUDGE_TEMPLATES[key];
