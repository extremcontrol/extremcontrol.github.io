// Fit marked text to a single line by shrinking font-size until it fits its parent.
// Usage: add `data-fit-text` attribute to an element.
(function () {
  const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function parsePx(value) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  function fitOne(el) {
    const parent = el.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    if (!parentWidth) return;

    const minPxAttr = el.getAttribute("data-fit-min-px");
    const minPx = clamp(parsePx(minPxAttr) ?? 18, 8, 200);

    // Start from computed font-size as "max".
    const computed = window.getComputedStyle(el);
    const maxPx = parsePx(computed.fontSize) ?? 100;

    // Ensure baseline constraints for measurement.
    const prevWhiteSpace = el.style.whiteSpace;
    const prevDisplay = el.style.display;
    el.style.whiteSpace = "nowrap";
    el.style.display = "inline-block";

    // If it already fits, we're done.
    el.style.fontSize = `${maxPx}px`;
    if (el.scrollWidth <= parentWidth) {
      el.style.whiteSpace = prevWhiteSpace;
      el.style.display = prevDisplay;
      return;
    }

    // Binary search best font-size.
    let lo = minPx;
    let hi = maxPx;
    let best = minPx;

    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth <= parentWidth) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    el.style.fontSize = `${best}px`;
    el.style.whiteSpace = prevWhiteSpace;
    el.style.display = prevDisplay;
  }

  function fitAll() {
    const isMobile = window.matchMedia
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : window.innerWidth <= 768;

    document.querySelectorAll("[data-fit-text]").forEach((el) => fitOne(el));

    document.querySelectorAll("[data-fit-text-mobile]").forEach((el) => {
      if (isMobile) {
        fitOne(el);
      } else {
        // Reset any JS-set size when leaving mobile so desktop CSS (and <br>) works naturally.
        el.style.fontSize = "";
      }
    });
  }

  function debounce(fn, ms) {
    let t = null;
    return function () {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(fn, ms);
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    fitAll();
    window.addEventListener("resize", debounce(fitAll, 80), { passive: true });
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      document.fonts.ready.then(fitAll).catch(() => {});
    }
  });
})();
