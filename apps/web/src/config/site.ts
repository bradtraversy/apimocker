export const SITE_NAME = "ApiMocker";
export const SITE_URL = "https://apimocker.com";
export const API_URL = "https://api.apimocker.com";
const configuredApiUrl = import.meta.env.PUBLIC_API_BASE_URL?.replace(/\/$/, "");
export const API_BASE_URL = configuredApiUrl?.startsWith("http")
  ? configuredApiUrl
  : API_URL;
export const GITHUB_URL = "https://github.com/bradtraversy/apimocker";
export const BETA_URL = `${GITHUB_URL}#isolated-environments-beta`;

export const resources = [
  { name: "Users", path: "/users", count: 10 },
  { name: "Posts", path: "/posts", count: 100 },
  { name: "Todos", path: "/todos", count: 200 },
  { name: "Comments", path: "/comments", count: 500 },
] as const;
