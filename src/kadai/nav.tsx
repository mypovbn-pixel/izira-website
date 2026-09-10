import { useRouter as useTanstackRouter } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

export function Link({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const router = useTanstackRouter();
  return <a href={href} {...rest} onClick={(event) => {
    rest.onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || rest.target === "_blank" || href.startsWith("http") || href.startsWith("#")) return;
    event.preventDefault();
    router.navigate({ to: href, resetScroll: true });
  }}>{children}</a>;
}

export function useRouter() {
  const router = useTanstackRouter();
  return {
    push: (href: string) => router.navigate({ to: href }),
    replace: (href: string) => router.navigate({ to: href, replace: true }),
    refresh: () => router.invalidate(),
    back: () => router.history.back(),
  };
}
