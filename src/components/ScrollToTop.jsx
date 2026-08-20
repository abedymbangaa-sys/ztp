import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router does NOT reset scroll position on navigation by default -
// if you scroll down on one page and click through to another, the new
// page loads already scrolled down. This fixes that by scrolling to the
// top of the window every time the URL path changes.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
