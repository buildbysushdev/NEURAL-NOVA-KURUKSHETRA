'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashAndClick, getDemoState, setDemoState, wait } from '@/lib/demo/demoOrchestrator';

export default function RescueDemoActor() {
  const router = useRouter();

  useEffect(() => {
    let unmounted = false;

    const run = async () => {
      const state = getDemoState();
      if (!state?.active) return;
      if (state.step !== 'rescue-accept') return;

      console.log('[RescueDemoActor] Activated for scenario:', state.scenario);

      // Wait for mission cards to render
      await wait(1200);
      if (unmounted) return;

      // 1. Accept mission: try data-demo hook first, then text matching
      let accepted = await flashAndClick('[data-demo="rescue-accept"]');
      if (!accepted) {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptBtn = buttons.find((b) => /accept mission|accept/i.test(b.textContent || ''));
        if (acceptBtn) {
          acceptBtn.classList.add('demo-click-flash');
          try {
            acceptBtn.click();
          } catch (e) {}
          await wait(500);
          acceptBtn.classList.remove('demo-click-flash');
          accepted = true;
        }
      }

      await wait(1400);
      if (unmounted) return;

      // 2. Mark resolved: try data-demo hook first, then text matching
      let resolved = await flashAndClick('[data-demo="rescue-resolve"]');
      if (!resolved) {
        const buttons = Array.from(document.querySelectorAll('button'));
        const resolveBtn = buttons.find((b) => /mark resolved|resolved/i.test(b.textContent || ''));
        if (resolveBtn) {
          resolveBtn.classList.add('demo-click-flash');
          try {
            resolveBtn.click();
          } catch (e) {}
          await wait(500);
          resolveBtn.classList.remove('demo-click-flash');
        }
      }

      // 3. Optional Walkie PTT simulation
      const ptt = document.querySelector('[data-demo="walkie-ptt"]') as HTMLElement | null;
      if (ptt) {
        ptt.classList.add('demo-click-flash');
        ptt.dispatchEvent(new Event('mousedown', { bubbles: true }));
        await wait(800);
        ptt.dispatchEvent(new Event('mouseup', { bubbles: true }));
        ptt.classList.remove('demo-click-flash');
      }

      await wait(1000);
      if (unmounted) return;

      // 4. Advance demo to Citizen ops and navigate
      setDemoState({
        active: true,
        scenario: state.scenario,
        step: 'citizen-ops',
        updatedAt: Date.now(),
        logs: [
          ...(state.logs || []),
          '🚑 Rescue completed: Missions Accepted & Resolved',
          '➡️ Routing to Citizen app',
        ],
      });

      router.push('/dashboard/citizen');
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard/citizen') {
          window.location.href = '/dashboard/citizen';
        }
      }, 1500);
    };

    run();

    return () => {
      unmounted = true;
    };
  }, [router]);

  return null;
}
