"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function AppProgressBar() {
  return (
    <ProgressBar
      height="3px"
      color="hsl(var(--primary))"
      options={{
        showSpinner: false,
        trickle: true,
        trickleSpeed: 50,
        minimum: 0.08,
        easing: 'ease',
        speed: 300,
      }}
      shallowRouting
    />
  );
}
