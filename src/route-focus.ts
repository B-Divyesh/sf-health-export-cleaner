function announceAndFocusHeading(): void {
  const heading = document.querySelector<HTMLElement>('h1');
  const status = document.getElementById('route-status');
  if (!heading || !status) return;
  heading.focus({ preventScroll: true });
  status.textContent = '';
  window.setTimeout(() => { status.textContent = heading.textContent?.trim() ?? ''; }, 0);
}

export function setupRouteFocus(focusOnInitialLoad = true): void {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (focusOnInitialLoad || navigation?.type === 'back_forward') {
    window.requestAnimationFrame(announceAndFocusHeading);
  }
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.requestAnimationFrame(announceAndFocusHeading);
  });
}
