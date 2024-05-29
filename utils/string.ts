export function usernamify(str: string) {
  return str
    .toLowerCase() // Convert to lowercase
    .trim() // Trim leading/trailing spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\_\_+/g, '_'); // Replace multiple underscores with a single underscore
}
