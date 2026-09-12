'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashAndClick, getDemoState, setDemoState, wait } from '@/lib/demo/demoOrchestrator';

export default function CitizenDemoActor() {
  const router = useRouter();

  useEffect(() => {
    let unmounted = false;

    const run = async () => {
      const state = getDemoState();
      if (!state?.active) return;
      if (state.step !== 'citizen-ops') return;

      console.log('[CitizenDemoActor] Activated for scenario:', state.scenario);
      await wait(2000);
      if (unmounted) return;

      // 1) Open chatbot if floating button exists
      const chatBtn =
        (document.querySelector('[data-demo="chat-open"]') as HTMLElement) ||
        (document.querySelector('button[aria-label="Open Voice Safety Assistant"]') as HTMLElement) ||
        (document.querySelector('button[aria-label="Open safety assistant"]') as HTMLElement);

      if (chatBtn) {
        chatBtn.classList.add('demo-click-flash');
        try {
          chatBtn.click();
        } catch (e) {}
        await wait(1200);
        chatBtn.classList.remove('demo-click-flash');
      }

      // 2) Type a question if input exists
      const input =
        (document.querySelector('[data-demo="chat-input"]') as HTMLInputElement) ||
        (document.querySelector('input[placeholder*="Type or speak emergency query"]') as HTMLInputElement) ||
        (document.querySelector('input[placeholder*="emergency query"]') as HTMLInputElement) ||
        (document.querySelector('input[placeholder*="Ask"]') as HTMLInputElement);

      if (input) {
        const q =
          state.scenario === 'red-inferno'
            ? 'Where should I evacuate to avoid industrial toxic smoke?'
            : 'Where is the nearest safe shelter for Marina storm surge?';

        input.focus();
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(input, q);
        } else {
          input.value = q;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(500);

        const sendBtn =
          (document.querySelector('[data-demo="chat-send"]') as HTMLElement) ||
          (input.nextElementSibling as HTMLElement);
        if (sendBtn) {
          try {
            sendBtn.click();
          } catch (e) {}
        }
        await wait(3200);
      }

      if (unmounted) return;

      // 3) Offline guidance button
      const routeBtn =
        (document.querySelector('[data-demo="offline-route"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find((b) =>
          /offline evacuation|get offline|safe route|offline/i.test(b.textContent || '')
        );
      if (routeBtn) {
        routeBtn.classList.add('demo-click-flash');
        try {
          routeBtn.click();
        } catch (e) {}
        await wait(1800);
        routeBtn.classList.remove('demo-click-flash');
      }

      // 4) Walkie PTT simulation
      const ptt =
        (document.querySelector('[data-demo="walkie-ptt"]') as HTMLElement) ||
        Array.from(document.querySelectorAll('button')).find((b) =>
          /hold to talk|transmit/i.test(b.textContent || '')
        );
      if (ptt) {
        ptt.classList.add('demo-click-flash');
        ptt.dispatchEvent(new Event('mousedown', { bubbles: true }));
        await wait(1800);
        ptt.dispatchEvent(new Event('mouseup', { bubbles: true }));
        ptt.classList.remove('demo-click-flash');
      }

      await wait(1800);
      if (unmounted) return;

      // 5) Advance demo state back to Authority Command HQ
      setDemoState({
        active: true,
        scenario: state.scenario,
        step: 'return-authority',
        updatedAt: Date.now(),
        logs: [
          ...(state.logs || []),
          '🧍 Citizen ops completed: AI Safety Q&A + Mesh PTT',
          '↩️ Returning to Authority Command HQ',
        ],
      });

      router.push('/dashboard/authority');
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard/authority') {
          window.location.href = '/dashboard/authority';
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
