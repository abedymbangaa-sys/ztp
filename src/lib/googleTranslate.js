// Site-wide automatic translation using the free Google Website Translator.
//
// How it works:
//  - English (the default) loads nothing from Google at all.
//  - For any other language we set the "googtrans" cookie and load Google's
//    script once; it then translates the whole page, including text that comes
//    from the database (listings, blog, guides...).
//  - Switching language sets/clears the cookie and reloads the page, which is
//    the most reliable way to get a clean state.

const SCRIPT_ID = "google-translate-script";
const CONTAINER_ID = "google_translate_element";
const COOKIE = "googtrans";

function cookieDomains() {
  const host = window.location.hostname;
  const list = [undefined, host];
  if (host.includes(".")) list.push("." + host);
  return list;
}

function writeCookie(value, expires) {
  for (const domain of cookieDomains()) {
    let c = `${COOKIE}=${value}; path=/; SameSite=Lax`;
    if (expires) c += `; expires=${expires}`;
    if (domain) c += `; domain=${domain}`;
    document.cookie = c;
  }
}

export function getCookieLanguage() {
  const m = document.cookie.match(new RegExp("(?:^|; )" + COOKIE + "=/[^/]*/([^;]+)"));
  return m ? decodeURIComponent(m[1]) : "en";
}

// Returns true if the cookie actually changed (so the caller knows to reload).
export function applyTranslationCookie(code) {
  const current = getCookieLanguage();
  if (code === "en" || !code) {
    if (current === "en") return false;
    writeCookie("", "Thu, 01 Jan 1970 00:00:00 GMT");
    return true;
  }
  if (current === code) return false;
  writeCookie(`/en/${code}`);
  return true;
}

// Google rewrites text nodes, which can make React throw when it later tries to
// remove/insert a node that Google has moved. These two guards are the standard,
// widely used fix: they ignore the one situation that would otherwise crash.
function protectReactFromTranslator() {
  if (window.__ztpTranslateGuards) return;
  window.__ztpTranslateGuards = true;
  const origRemove = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return origRemove.apply(this, arguments);
  };
  const origInsert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, ref) {
    if (ref && ref.parentNode !== this) return newNode;
    return origInsert.apply(this, arguments);
  };
}

export function loadGoogleTranslate(includedLanguages) {
  if (typeof document === "undefined" || document.getElementById(SCRIPT_ID)) return;
  protectReactFromTranslator();

  if (!document.getElementById(CONTAINER_ID)) {
    const box = document.createElement("div");
    box.id = CONTAINER_ID;
    box.setAttribute("translate", "no");
    box.style.display = "none";
    document.body.appendChild(box);
  }

  window.__ztpGoogleTranslateInit = () => {
    try {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages, autoDisplay: false },
        CONTAINER_ID
      );
    } catch {
      // translation is a nice-to-have; never break the site if it fails
    }
  };

  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.src = "https://translate.google.com/translate_a/element.js?cb=__ztpGoogleTranslateInit";
  s.onerror = () => {};
  document.head.appendChild(s);
}
