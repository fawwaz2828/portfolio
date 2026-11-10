import { createContext, useContext, type AnchorHTMLAttributes, type MouseEvent } from "react";

/**
 * Tiny client-side router: three pages, history API, and a navigate() that
 * App wraps in the andreas.vision page transition.
 */
// "/login" is the secret page: not linked anywhere, opened by tapping "FW" in Morse on the hero sword
export const ROUTES = ["/", "/about", "/projects", "/login"] as const;
export type Route = (typeof ROUTES)[number];

export const normalize = (p: string): Route => {
  const clean = p.replace(/\/+$/, "") || "/";
  return (ROUTES as readonly string[]).includes(clean) ? (clean as Route) : "/";
};

type Ctx = { path: Route; navigate: (to: Route) => void };
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
