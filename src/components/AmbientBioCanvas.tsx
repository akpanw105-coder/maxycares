"use client";

import React, { useEffect, useRef } from "react";

interface WaveRibbon {
  baseYRatio: number;
  speed: number;
  amp1: number;
  amp2: number;
  freq1: number;
  freq2: number;
  phase1: number;
  phase2: number;
  thickness: number;
  color: string;
}

interface BioNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  phase: number;
  speed: number;
  alpha: number;
}

export function AmbientBioCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf: number;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let tick = 0;
    let isVisible = true;

    // Subtle pointer proximity field
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    // Fluid ribbon configurations
    const ribbons: WaveRibbon[] = [];
    const ribbonCount = 7;

    const initRibbons = () => {
      ribbons.length = 0;
      // Palette references:
      // Clinical Teal: #0f766e -> rgba(15, 118, 110, a)
      // Dark Clinical Teal: #115e59 -> rgba(17, 94, 89, a)
      // Luminous Mint: #2dd4bf -> rgba(45, 212, 191, a)
      // Obsidian Teal: #0b2520 -> rgba(11, 37, 32, a)
      const colors = [
        "rgba(15, 118, 110, 0.038)",
        "rgba(45, 212, 191, 0.032)",
        "rgba(17, 94, 89, 0.028)",
        "rgba(15, 118, 110, 0.030)",
        "rgba(45, 212, 191, 0.024)",
        "rgba(11, 37, 32, 0.020)",
        "rgba(15, 118, 110, 0.022)",
      ];

      for (let i = 0; i < ribbonCount; i++) {
        const ratio = 0.16 + (i / (ribbonCount - 1)) * 0.72;
        ribbons.push({
          baseYRatio: ratio,
          speed: 0.00035 + (i % 3) * 0.00015,
          amp1: 32 + (i % 4) * 12,
          amp2: 18 + (i % 3) * 9,
          freq1: 0.0011 + (i % 3) * 0.0004,
          freq2: 0.0022 + (i % 2) * 0.0006,
          phase1: (i * Math.PI) / 3.5,
          phase2: (i * Math.PI) / 2.2,
          thickness: 1.2 + (i % 3) * 0.8,
          color: colors[i % colors.length],
        });
      }
    };

    // Micro-particles
    const nodes: BioNode[] = [];
    const initNodes = () => {
      nodes.length = 0;
      const isMobile = W < 768;
      const nodeCount = isMobile ? 18 : 34;

      for (let i = 0; i < nodeCount; i++) {
        const speed = isMobile ? 0.08 : 0.13;
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          baseRadius: Math.random() < 0.2 ? 1.6 : 1.0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.008,
          alpha: 0.12 + Math.random() * 0.18,
        });
      }
    };

    const resize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;

      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      if (ctx.resetTransform) ctx.resetTransform();
      ctx.scale(dpr, dpr);

      initRibbons();
      initNodes();
    };

    // Smooth pointer tracker
    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };

    const draw = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, W, H);
      tick++;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // ── Layer 1: Atmospheric Ambient Gradients ────────────────
      // Primary warm mint glow (top right / hero area)
      const grad1 = ctx.createRadialGradient(
        W * 0.82 + Math.sin(tick * 0.005) * 40,
        H * 0.16 + Math.cos(tick * 0.006) * 30,
        20,
        W * 0.82,
        H * 0.16,
        W * 0.58
      );
      grad1.addColorStop(0, "rgba(204, 251, 241, 0.28)");
      grad1.addColorStop(0.4, "rgba(45, 212, 191, 0.06)");
      grad1.addColorStop(1, "rgba(249, 251, 251, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, W, H);

      // Secondary subtle clinical teal depth (mid-left)
      const grad2 = ctx.createRadialGradient(
        W * 0.12 + Math.cos(tick * 0.004) * 30,
        H * 0.65 + Math.sin(tick * 0.005) * 40,
        10,
        W * 0.12,
        H * 0.65,
        W * 0.45
      );
      grad2.addColorStop(0, "rgba(15, 118, 110, 0.045)");
      grad2.addColorStop(0.6, "rgba(17, 94, 89, 0.015)");
      grad2.addColorStop(1, "rgba(249, 251, 251, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, W, H);

      // ── Layer 2: Harmonic Fluid Ribbon Curves ─────────────────
      const step = W < 768 ? 24 : 18;
      for (let rIdx = 0; rIdx < ribbons.length; rIdx++) {
        const r = ribbons[rIdx];
        const baseY = r.baseYRatio * H;
        const time = tick * r.speed * 60;

        ctx.beginPath();
        for (let x = -step; x <= W + step; x += step) {
          // Harmonic dual-wave equation
          const wave1 = Math.sin(x * r.freq1 + time + r.phase1) * r.amp1;
          const wave2 = Math.cos(x * r.freq2 - time * 0.65 + r.phase2) * r.amp2;
          
          // Subtle mouse deflection
          let mouseDisplacement = 0;
          if (mouse.x > -500) {
            const dx = x - mouse.x;
            const dy = baseY - mouse.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 45000) {
              const force = (1 - distSq / 45000) * 16;
              mouseDisplacement = (dy > 0 ? 1 : -1) * force;
            }
          }

          const y = baseY + wave1 + wave2 + mouseDisplacement;

          if (x === -step) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.thickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Delicate floating contour echo on every 2nd ribbon for extra depth
        if (rIdx % 2 === 0) {
          ctx.beginPath();
          for (let x = -step; x <= W + step; x += step * 2) {
            const wave = Math.sin(x * r.freq1 + time + r.phase1 + 0.4) * (r.amp1 * 0.85);
            const y = baseY + wave + 14;
            if (x === -step) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = "rgba(45, 212, 191, 0.016)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // ── Layer 3: Delicate Interconnected Bio-Nodes ────────────
      const isMobile = W < 768;
      const maxConnectDist = isMobile ? 85 : 120;
      const maxConnectDistSq = maxConnectDist * maxConnectDist;

      // Update positions
      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < -10) n.x = W + 10;
          if (n.x > W + 10) n.x = -10;
          if (n.y < -10) n.y = H + 10;
          if (n.y > H + 10) n.y = -10;

          n.phase += n.speed;
        }
      }

      // Interconnection filaments
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectDistSq) {
            const factor = 1 - Math.sqrt(distSq) / maxConnectDist;
            const alpha = factor * factor * (isMobile ? 0.05 : 0.08);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(15, 118, 110, ${alpha.toFixed(4)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Render nodes
      for (const n of nodes) {
        const pulse = reduced ? 0 : Math.sin(n.phase) * 0.15;
        const radius = n.baseRadius * (1 + pulse);
        const alpha = Math.min(0.35, Math.max(0.06, n.alpha + pulse * 0.5));

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 118, 110, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      if (!reduced) {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();

    // Event listeners
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 w-full h-full select-none"
    />
  );
}
