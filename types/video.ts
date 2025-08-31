export type VideoItem = {
  // Essential
  id: string;
  title: string;
  url: string;
  thumbnail: string;

  // Optional but common
  client: string | null;
  description: string | null;

  // Dataset extras
  language: string | null;
  duration_seconds: number | null;
  priority: string | null;
  tags: string[] | null;
  my_roles: string[] | null;
  long_description: string | null;
  display_credits: string | null;
  related_ids: string[] | null;
};
