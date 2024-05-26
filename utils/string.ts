export function usernamify(text: string) {
  // Normalize the text to remove special characters
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Convert to lowercase
  text = text.toLowerCase();

  // Remove non-alphanumeric characters (keeping hyphens and spaces)
  text = text.replace(/[^a-z0-9\s-]/g, "");

  // Replace spaces and underscores with underscores
  text = text.replace(/[\s_-]+/g, "_");

  // Remove leading and trailing hyphens
  text = text.replace(/^-+|-+$/g, "");

  return text;
}
