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

export async function flashAndClick(selector: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return false;
  el.classList.add('demo-click-flash');
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {}
  await wait(350);
  try {
    el.click();
  } catch (e) {}
  await wait(250);
  el.classList.remove('demo-click-flash');
  return true;
}
