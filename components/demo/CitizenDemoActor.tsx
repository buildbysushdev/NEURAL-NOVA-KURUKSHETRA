'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoState, setDemoState, wait } from '@/lib/demo/demoOrchestrator';

// Helper: smoothly scroll any element into view
function scrollTo(el: HTMLElement) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Helper: flash an element with a highlight ring then click it
async function flashClick(el: HTMLElement, delayMs = 600) {
  el.style.transition = 'box-shadow 0.2s, outline 0.2s';
  el.style.outline = '3px solid #f59e0b';
  el.style.boxShadow = '0 0 0 6px rgba(245,158,11,0.35)';
  scrollTo(el);
  await wait(delayMs);
  try { el.click(); } catch {}
  await wait(300);
  el.style.outline = '';
  el.style.boxShadow = '';
}

export default function CitizenDemoActor() {
  const router = useRouter();

  useEffect(() => {
    let unmounted = false;

    const run = async () => {
      const state = getDemoState();
      if (!state?.active) return;
      if (state.step !== 'citizen-ops') return;

      console.log('[CitizenDemoActor] Activated — scenario:', state.scenario);

      // Give the page a moment to fully mount
      await wait(1800);
      if (unmounted) return;

      // ── STEP 1: Scroll to top of citizen page ────────────────────────────────
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await wait(800);

      // ── STEP 2: Trigger the EAS Government Alert popup ───────────────────────
      const easTrigger =
        (document.querySelector('[data-demo="eas-trigger"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /simulate eas|emergency alert|eas alert/i.test(b.textContent || '')
        );

      if (easTrigger) {
        scrollTo(easTrigger);
        await wait(600);
        await flashClick(easTrigger, 700);
        await wait(1500); // Wait for modal to open with animation
      }

      if (unmounted) return;

      // ── STEP 3: Click "I Am Safe" button in the popup ────────────────────────
      await wait(600); // Give modal animation time
      const iAmSafeBtn =
        (document.querySelector('[data-demo="i-am-safe-btn"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /i am safe|confirm safety|marked safe/i.test(b.textContent || '')
        );

      if (iAmSafeBtn) {
        await flashClick(iAmSafeBtn, 800);
        await wait(1200); // Show the "Safety Confirmed" feedback
      }

      if (unmounted) return;

      // ── STEP 4: Scroll back up to nav tab bar ────────────────────────────────
      await wait(400);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await wait(700);

      // ── STEP 5: Click the Walkie-Talkie / Mesh Radio tab ─────────────────────
      const walkieTab =
        (document.querySelector('[data-demo="walkie-tab"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /mesh radio|walkie|ptt|channel 7/i.test(b.textContent || '')
        );

      if (walkieTab) {
        scrollTo(walkieTab);
        await wait(500);
        await flashClick(walkieTab, 600);
        await wait(1000);
      }

      if (unmounted) return;

      // ── STEP 6: Scroll DOWN to reveal the WalkieTalkie component ─────────────
      await wait(400);
      const walkieSection =
        (document.querySelector('[data-demo="walkie-ptt"]') as HTMLElement) ||
        (document.querySelector('button[class*="ptt"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /hold to talk|push.*talk|transmit/i.test(b.textContent || '')
        );

      if (walkieSection) {
        scrollTo(walkieSection);
        await wait(800);
        // Simulate PTT press (don't actually record — just show it visually)
        walkieSection.style.outline = '3px solid #f59e0b';
        walkieSection.style.boxShadow = '0 0 0 8px rgba(245,158,11,0.3)';
        walkieSection.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        await wait(2500);
        walkieSection.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        walkieSection.style.outline = '';
        walkieSection.style.boxShadow = '';
        await wait(1000);
      } else {
        // No PTT found — just scroll down slowly to show the walkie UI
        const targets = document.querySelectorAll('section, [class*="walkie"], [class*="radio"]');
        if (targets.length > 0) {
          (targets[targets.length - 1] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollBy({ top: 600, behavior: 'smooth' });
        }
        await wait(2000);
      }

      if (unmounted) return;

      // ── STEP 7: Offline AI Mesh — click category if visible ──────────────────
      await wait(500);
      const offlineAiBtn =
        (document.querySelector('[data-demo="offline-route"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /offline|mesh sos|shelter|safe route/i.test(b.textContent || '')
        );

      if (offlineAiBtn) {
        scrollTo(offlineAiBtn);
        await wait(400);
        await flashClick(offlineAiBtn, 600);
        await wait(1600);
      }

      if (unmounted) return;

      // ── DONE: Return to Authority HQ ─────────────────────────────────────────
      setDemoState({
        active: true,
        scenario: state.scenario,
        step: 'return-authority',
        updatedAt: Date.now(),
        logs: [
          ...(state.logs || []),
          '✅ Citizen EAS acknowledged — "I Am Safe" confirmed',
          '🎙️ Walkie-Talkie PTT demonstrated',
          '↩️ Returning to Authority Command HQ',
        ],
      });

      await wait(600);
      router.push('/dashboard/authority');
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard/authority') {
          window.location.href = '/dashboard/authority';
        }
      }, 1800);
    };

    run();
    return () => { unmounted = true; };
  }, [router]);

  return null;
}
