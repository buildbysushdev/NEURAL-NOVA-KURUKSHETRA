import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  flashAndClick,
  getDemoState,
  scrollToElement,
  scrollPageTo,
  setDemoState,
  wait,
} from '@/lib/demo/demoOrchestrator';

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
      scrollPageTo(0, 'smooth');
      await wait(600);

      // ── STEP 2: Trigger the EAS Government Alert popup ───────────────────────
      const easTrigger =
        (document.querySelector('[data-demo="eas-trigger"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /simulate eas|emergency alert|eas alert/i.test(b.textContent || '')
        );

      if (easTrigger) {
        scrollToElement(easTrigger);
        await wait(400);
        await flashAndClick(easTrigger, 600);
        await wait(1200); // Wait for modal to open with animation
      }

      if (unmounted) return;

      // ── STEP 3: Click "I Am Safe" button in the popup ────────────────────────
      await wait(500);
      const iAmSafeBtn =
        (document.querySelector('[data-demo="i-am-safe-btn"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /i am safe|confirm safety|marked safe/i.test(b.textContent || '')
        );

      if (iAmSafeBtn) {
        await flashAndClick(iAmSafeBtn, 600);
        await wait(1200); // Wait for modal exit transition
      }

      if (unmounted) return;

      // ── STEP 4: Scroll back up to nav tab bar ────────────────────────────────
      await wait(300);
      scrollPageTo(0, 'smooth');
      await wait(500);

      // ── STEP 5: Click the Walkie-Talkie / Mesh Radio tab ─────────────────────
      const walkieTab =
        (document.querySelector('[data-demo="walkie-tab"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /mesh radio|walkie|ptt|channel 7/i.test(b.textContent || '')
        );

      if (walkieTab) {
        scrollToElement(walkieTab);
        await wait(400);
        await flashAndClick(walkieTab, 500);
        await wait(900);
      }

      if (unmounted) return;

      // ── STEP 6: Scroll DOWN to reveal the WalkieTalkie component ─────────────
      await wait(300);

      // ── STEP 6a: First try clicking a preset emergency chip (most reliable) ──
      const presetChip =
        Array.from(document.querySelectorAll('button')).find(b =>
          /flood rising|trapped.*boat|medical emergency|elderly.*children/i.test(b.textContent || '')
        ) as HTMLElement;

      if (presetChip) {
        scrollToElement(presetChip);
        await wait(400);
        presetChip.style.outline = '3px solid #f59e0b';
        presetChip.style.boxShadow = '0 0 0 8px rgba(245,158,11,0.3)';
        await wait(300);
        presetChip.click();
        presetChip.style.outline = '';
        presetChip.style.boxShadow = '';
        await wait(1500);
      } else {
        // ── STEP 6b: Fall back to PTT button simulation ─────────────────────────
        const walkieSection =
          (document.querySelector('[data-demo="walkie-ptt"]') as HTMLElement) ||
          Array.from(document.querySelectorAll('button')).find(b =>
            /hold to talk|tap to talk|push.*talk|transmit/i.test(b.textContent || '')
          ) as HTMLElement;

        if (walkieSection) {
          scrollToElement(walkieSection);
          await wait(600);
          walkieSection.style.outline = '3px solid #f59e0b';
          walkieSection.style.boxShadow = '0 0 0 8px rgba(245,158,11,0.3)';
          // Use mousedown/mouseup — what WalkieTalkie actually listens for
          walkieSection.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          await wait(2500);
          walkieSection.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          walkieSection.style.outline = '';
          walkieSection.style.boxShadow = '';
          await wait(1200);
        } else {
          const targets = document.querySelectorAll('section, [class*="walkie"], [class*="radio"]');
          if (targets.length > 0) {
            scrollToElement(targets[targets.length - 1] as HTMLElement);
          } else {
            scrollPageTo(600, 'smooth');
          }
          await wait(1500);
        }
      }

      if (unmounted) return;

      // ── STEP 7: Offline AI Mesh — click category if visible ──────────────────
      await wait(400);
      const offlineAiBtn =
        (document.querySelector('[data-demo="offline-route"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find(b =>
          /offline|mesh sos|shelter|safe route/i.test(b.textContent || '')
        );

      if (offlineAiBtn) {
        scrollToElement(offlineAiBtn);
        await wait(300);
        await flashAndClick(offlineAiBtn, 500);
        await wait(1200);
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
