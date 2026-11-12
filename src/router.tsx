import { createContext, useContext, type AnchorHTMLAttributes, type MouseEvent } from "react";

/**
 * Tiny client-side router: three pages, history API, and a navigate() that
 * App wraps in the andreas.vision page transition.
 */
// SECRET_PATH is the hidden sign-in page: not linked anywhere, opened by tapping
// "FW" in Morse on the hero sword. A random slug rather than "/login" so it
// can't be guessed. Change it here only; everything else imports it.
// (It still ships in the JS bundle: Supabase RLS is what actually protects data.)
export const SECRET_PATH = "/4zattj3jwf";
// ADMIN_PATH is the content dashboard, reached after signing in on SECRET_PATH.
// Also a random slug, and AdminPage sends anyone without an admin session
// straight back to the home page.
export const ADMIN_PATH = "/gswvrqc5ykyc";
export const ROUTES = ["/", "/about", "/projects", SECRET_PATH, ADMIN_PATH] as const;
export type Route = (typeof ROUTES)[number];

export const normalize = (p: string): Route => {
  const clean = p.replace(/\/+$/, "") || "/";
  return (ROUTES as readonly string[]).includes(clean) ? (clean as Route) : "/";
};

/** replace: swap the page at once, without the transition or a new history entry (redirects). */
type Ctx = { path: Route; navigate: (to: Route, opts?: { replace?: boolean }) => void };
export const RouterContext = createContext<Ctx>({ path: "/", navigate: () => {} });
export const useRouter = () => useContext(RouterContext);

/** <a> that navigates in-app (keeps ctrl/cmd/middle-click as normal browser behaviour). */
export function Link({ to, onClick, ...rest }: { to: Route } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { path, navigate } = useRouter();
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} aria-current={path === to ? "page" : undefined} onClick={go} {...rest} />;
}
