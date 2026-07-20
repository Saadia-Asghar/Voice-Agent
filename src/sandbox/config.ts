const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL ?? "https://hacknation-lemon.vercel.app";

export function mainAppLink(path = "/") {
  return `${mainAppUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
