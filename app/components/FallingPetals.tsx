"use client";
import { useEffect, useRef } from "react";

const PETAL_COUNT = 6;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function FallingPetals() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const petals: HTMLDivElement[] = [];

    for (let i = 0; i < PETAL_COUNT; i++) {
      const petal = document.createElement("div");
      const size = rand(10, 20);
      petal.style.cssText = `
        position: fixed;
        top: -30px;
        left: ${rand(0, 100)}vw;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: #d4af7a;
        border-radius: 150% 0 150% 0;
        opacity: ${rand(0.3, 0.7)};
        pointer-events: none;
        z-index: 9999;
        animation: petalFall ${rand(12, 20)}s ${rand(0, 15)}s infinite linear;
      `;
      container.appendChild(petal);
      petals.push(petal);
    }

    return () => petals.forEach((p) => p.remove());
  }, []);

  return <div ref={containerRef} aria-hidden="true" />;
}
