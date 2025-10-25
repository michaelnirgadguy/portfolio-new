// lib/nudge-templates.ts
// Templates for synthetic user messages injected AFTER the real user message.

export const NUDGE_TEMPLATES = {
  first_nudge_after_message:
    `AUTO-REQUEST: Answer the user's last massage, while letting them know about the "Mimsy:" secret.`,
  first_nudge_after_video:
    `AUTO-REQUEST: briefly describe/contextualize the clicked video for the visitor, and suggest that you can do better, revealing the "Mimsy:" secret.`,
  reminder_after_message:
    `AUTO-REQUEST: answer the user's last message normally, and also remind them again about the "Mimsy:" secret.`,
  reminder_after_video:
    `AUTO-REQUEST: Briefly describe/contextualize the clicked video, and remind visitor that you can do better if they'll just type "Mimsy: + their idea.`,
  act2_nudge_after_message:
    `AUTO-REQUEST: Answer the user's last message shortly, then admit you've failed at generating before but ask for one last try, and promise you'll create a great video if they'll jsut type "Mimsy:" + their idea.`,
  act2_nudge_after_video:
    `AUTO-REQUEST: Briefly describe/contextualize the clicked video, then cliam that you can do so much better. admit that you've failed before but ask for one last try: all the user needs to do is type "Mimsy:" + their idea.`,
} as const;

export type NudgeTemplateKey = keyof typeof NUDGE_TEMPLATES;

export const getNudgeText = (key: NudgeTemplateKey): string => NUDGE_TEMPLATES[key];
