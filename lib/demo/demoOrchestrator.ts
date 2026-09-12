export type DemoPortal = 'authority' | 'rescue' | 'citizen';
export type DemoScenario = 'blue-flood' | 'red-inferno';

export type DemoState = {
  active: boolean;
  scenario: DemoScenario;
  step: string;
  updatedAt: number;
  logs?: string[];
};

const KEY = 'kurukshetra_auto_demo_v1';

export function setDemoState(state: DemoState) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('kurukshetra-demo-updated'));
}

export function getDemoState(): DemoState | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDemoState() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event('kurukshetra-demo-updated'));
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Robust cross-container page scroller.
 * Correctly scrolls window or document.querySelector('main') depending on dashboard layout.
 */
export function scrollPageTo(top = 0, behavior: ScrollBehavior = 'smooth') {
  if (typeof window === 'undefined') return;
  try {
    window.scrollTo({ top, behavior });
  } catch {}
  try {
    document.documentElement.scrollTo({ top, behavior });
  } catch {}
  try {
    document.body.scrollTo({ top, behavior });
  } catch {}
  try {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top, behavior });
    }
  } catch {}
}

/**
 * Smoothly scrolls any element into view regardless of whether parent is window or a scrollable main div.
 */
export function scrollToElement(target: string | HTMLElement): boolean {
  if (typeof document === 'undefined') return false;
  const el = typeof target === 'string' ? (document.querySelector(target) as HTMLElement | null) : target;
  if (!el) return false;

  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  } catch {
    try {
      el.scrollIntoView();
    } catch {}
  }

  // Handle scrollable <main> container if present (e.g. Authority dashboard)
  try {
    const main = document.querySelector('main');
    if (main && main.contains(el)) {
      const mainRect = main.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - mainRect.top + main.scrollTop;
      const targetScroll = Math.max(0, relativeTop - (mainRect.height / 2) + (elRect.height / 2));
      main.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  } catch {}

  return true;
}

export async function flashAndClick(selectorOrEl: string | HTMLElement, delayMs = 500): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const el = typeof selectorOrEl === 'string'
    ? (document.querySelector(selectorOrEl) as HTMLElement | null)
    : selectorOrEl;
  if (!el) return false;

  scrollToElement(el);
  await wait(250);

  el.classList.add('demo-click-flash');
  el.style.transition = 'box-shadow 0.2s, outline 0.2s';
  el.style.outline = '3px solid #f59e0b';
  el.style.boxShadow = '0 0 0 6px rgba(245,158,11,0.35)';

  await wait(delayMs);
  try {
    el.click();
  } catch (e) {}
  await wait(250);

  el.classList.remove('demo-click-flash');
  el.style.outline = '';
  el.style.boxShadow = '';
  return true;
}
