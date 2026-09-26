'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const VISITOR_KEY = 'abs_vid';

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return '平板';
  if (/Mobi|iPhone|Android/i.test(ua)) return '手機';
  return '桌面';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  const order: [RegExp, string][] = [
    [/Edg\//, 'Edge'],
    [/OPR\/|Opera/, 'Opera'],
    [/Firefox\//, 'Firefox'],
    [/Chrome\//, 'Chrome'],
    [/Safari\//, 'Safari'],
  ];
  return order.find(([re]) => re.test(ua))?.[1] ?? '未知';
}

function visitorId(): string {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, id);
  return id;
}

export function PageTracker() {
  const pathname = usePathname();
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const load = startedAt.current;
    const send = (duration: number) => {
      const payload = JSON.stringify({
        path: pathname,
        host: document.referrer ? new URL(document.referrer).host : '',
        visitorId: visitorId(),
        device: detectDevice(),
        browser: detectBrowser(),
        durationMs: Math.round(duration),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      } else {
        void fetch('/api/track', { method: 'POST', body: payload, keepalive: true });
      }
    };
    const onHide = () => send(Date.now() - load);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      send(Date.now() - load);
    };
  }, [pathname]);

  return null;
}
