import { config, fields, singleton } from "@keystatic/core";

const videoItemSchema = fields.object({
  id: fields.text({ label: "ID" }),
  title: fields.text({ label: "Title" }),
  client: fields.text({ label: "Client", validation: { isRequired: false } }),
  url: fields.text({ label: "URL" }),
  thumbnail: fields.text({ label: "Thumbnail" }),
  description: fields.text({
    label: "Description",
    multiline: true,
    validation: { isRequired: false },
  }),
  language: fields.text({ label: "Language", validation: { isRequired: false } }),
  duration_seconds: fields.number({
    label: "Duration (seconds)",
    validation: { isRequired: false },
  }),
  priority: fields.text({ label: "Priority", validation: { isRequired: false } }),
  tags: fields.array(fields.text({ label: "Tag" }), {
    label: "Tags",
    itemLabel: (item) => item.value || "Tag",
  }),
  my_roles: fields.array(fields.text({ label: "Role" }), {
    label: "My Roles",
    itemLabel: (item) => item.value || "Role",
  }),
  long_description: fields.text({
    label: "Long Description",
    multiline: true,
    validation: { isRequired: false },
  }),
  display_credits: fields.text({
    label: "Display Credits",
    multiline: true,
    validation: { isRequired: false },
  }),
  related_ids: fields.array(fields.text({ label: "Related ID" }), {
    label: "Related IDs",
    itemLabel: (item) => item.value || "Related ID",
  }),
});

export default config({
  storage: {
    kind: "github",
    repo: "michaelnirgadguy/portfolio-new",
  },
  singletons: {
    videos: singleton({
      label: "Videos",
      path: "data/videos",
      format: { data: "json" },
      schema: {
        videos: fields.array(videoItemSchema, {
          label: "Videos",
          itemLabel: (item) => item.value.title || item.value.id || "Video",
        }),
      },
    }),
  },
});
