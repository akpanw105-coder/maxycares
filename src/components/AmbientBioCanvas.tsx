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

    // Pointer coordinates (tracks mouse, touches, or default gentle autonomous focal point on mobile)
    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isActive: false,
    };

    // Ribbons array
    const ribbons: WaveRibbon[] = [];

    const initRibbons = () => {
      ribbons.length = 0;
      const isMobile = W < 768;
      const count = isMobile ? 5 : 7;

      // Organic clinical color spectrum with tuned mobile contrast
      const colors = isMobile
        ? [
            "rgba(15, 118, 110, 0.075)",
            "rgba(45, 212, 191, 0.065)",
            "rgba(17, 94, 89, 0.055)",
            "rgba(15, 118, 110, 0.060)",
            "rgba(45, 212, 191, 0.050)",
          ]
        : [
            "rgba(15, 118, 110, 0.045)",
            "rgba(45, 212, 191, 0.038)",
            "rgba(17, 94, 89, 0.032)",
            "rgba(15, 118, 110, 0.035)",
            "rgba(45, 212, 191, 0.028)",
            "rgba(11, 37, 32, 0.025)",
            "rgba(15, 118, 110, 0.030)",
          ];

      for (let i = 0; i < count; i++) {
        const ratio = isMobile
          ? 0.12 + (i / (count - 1)) * 0.78
          : 0.15 + (i / (count - 1)) * 0.74;

        ribbons.push({
          baseYRatio: ratio,
          speed: isMobile ? 0.00045 + (i % 2) * 0.0002 : 0.00035 + (i % 3) * 0.00015,
          amp1: isMobile ? 24 + (i % 3) * 10 : 34 + (i % 4) * 12,
          amp2: isMobile ? 14 + (i % 2) * 8 : 20 + (i % 3) * 9,
          freq1: isMobile ? 0.0016 + (i % 2) * 0.0005 : 0.0011 + (i % 3) * 0.0004,
          freq2: isMobile ? 0.0028 + (i % 2) * 0.0007 : 0.0022 + (i % 2) * 0.0006,
          phase1: (i * Math.PI) / 3,
          phase2: (i * Math.PI) / 2.2,
          thickness: isMobile ? 1.6 + (i % 2) * 0.8 : 1.4 + (i % 3) * 0.8,
          color: colors[i % colors.length],
        });
      }
    };

    // Micro-particles
    const nodes: BioNode[] = [];
    const initNodes = () => {
      nodes.length = 0;
      const isMobile = W < 768;
      const nodeCount = isMobile ? 16 : 32;

      for (let i = 0; i < nodeCount; i++) {
        const speed = isMobile ? 0.12 : 0.14;
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          baseRadius: isMobile ? (Math.random() < 0.25 ? 2.0 : 1.3) : Math.random() < 0.2 ? 1.8 : 1.1,
          phase: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.01,
          alpha: isMobile ? 0.20 + Math.random() * 0.22 : 0.14 + Math.random() * 0.18,
        });
      }
    };

    const resize = () => {
      if (!canvas) return;
      // Cap DPR at 1.5 on mobile to conserve GPU/battery while remaining crisp
      const isMobile = window.innerWidth < 768;
      dpr = isMobile ? 1.25 : Math.min(window.devicePixelRatio || 1, 2);
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

    const onMouseMove = (e: MouseEvent) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.isActive = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointer.targetX = e.touches[0].clientX;
        pointer.targetY = e.touches[0].clientY;
        pointer.isActive = true;
      }
    };

    const onPointerLeave = () => {
      pointer.isActive = false;
      pointer.targetX = -1000;
      pointer.targetY = -1000;
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

      const isMobile = W < 768;

      // Autonomous breathing focal point if no direct touch/mouse is active (ensures mobile remains visibly alive)
      if (!pointer.isActive) {
        pointer.targetX = W * 0.5 + Math.sin(tick * 0.007) * (W * 0.25);
        pointer.targetY = H * 0.35 + Math.cos(tick * 0.009) * (H * 0.15);
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;

      // ── Layer 1: Atmospheric Ambient Gradients ────────────────
      // Primary luminous teal glow (hero quadrant)
      const grad1 = ctx.createRadialGradient(
        W * 0.78 + Math.sin(tick * 0.006) * (isMobile ? 25 : 45),
        H * 0.18 + Math.cos(tick * 0.007) * (isMobile ? 20 : 35),
        15,
        W * 0.78,
        H * 0.18,
        isMobile ? W * 0.75 : W * 0.60
      );
      grad1.addColorStop(0, isMobile ? "rgba(204, 251, 241, 0.38)" : "rgba(204, 251, 241, 0.32)");
      grad1.addColorStop(0.35, isMobile ? "rgba(45, 212, 191, 0.12)" : "rgba(45, 212, 191, 0.08)");
      grad1.addColorStop(1, "rgba(249, 251, 251, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, W, H);

      // Secondary deep clinical depth glow (lower left)
      const grad2 = ctx.createRadialGradient(
        W * 0.18 + Math.cos(tick * 0.005) * 30,
        H * 0.68 + Math.sin(tick * 0.006) * 40,
        10,
        W * 0.18,
        H * 0.68,
        isMobile ? W * 0.60 : W * 0.50
      );
      grad2.addColorStop(0, isMobile ? "rgba(15, 118, 110, 0.08)" : "rgba(15, 118, 110, 0.055)");
      grad2.addColorStop(0.65, "rgba(17, 94, 89, 0.02)");
      grad2.addColorStop(1, "rgba(249, 251, 251, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, W, H);

      // ── Layer 2: Harmonic Fluid Ribbon Curves ─────────────────
      const step = isMobile ? 32 : 18;
      for (let rIdx = 0; rIdx < ribbons.length; rIdx++) {
        const r = ribbons[rIdx];
        const baseY = r.baseYRatio * H;
        const time = tick * r.speed * 60;

        ctx.beginPath();
        for (let x = -step; x <= W + step; x += step) {
          const wave1 = Math.sin(x * r.freq1 + time + r.phase1) * r.amp1;
          const wave2 = Math.cos(x * r.freq2 - time * 0.68 + r.phase2) * r.amp2;

          let deflection = 0;
          if (pointer.x > -500) {
            const dx = x - pointer.x;
            const dy = baseY - pointer.y;
            const distSq = dx * dx + dy * dy;
            const maxDistSq = isMobile ? 35000 : 50000;
            if (distSq < maxDistSq) {
              const force = (1 - distSq / maxDistSq) * (isMobile ? 12 : 18);
              deflection = (dy > 0 ? 1 : -1) * force;
            }
          }

          const y = baseY + wave1 + wave2 + deflection;

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

        // Secondary contour echo for optical richness
        if (rIdx % 2 === 0) {
          ctx.beginPath();
          for (let x = -step; x <= W + step; x += step * (isMobile ? 2.5 : 2)) {
            const wave = Math.sin(x * r.freq1 + time + r.phase1 + 0.45) * (r.amp1 * 0.82);
            const y = baseY + wave + (isMobile ? 12 : 15);
            if (x === -step) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = isMobile ? "rgba(45, 212, 191, 0.035)" : "rgba(45, 212, 191, 0.02)";
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      // ── Layer 3: Delicate Interconnected Bio-Nodes ────────────
      const maxConnectDist = isMobile ? 95 : 125;
      const maxConnectDistSq = maxConnectDist * maxConnectDist;

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

      // Synaptic connection filaments
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectDistSq) {
            const factor = 1 - Math.sqrt(distSq) / maxConnectDist;
            const alpha = factor * factor * (isMobile ? 0.08 : 0.09);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(15, 118, 110, ${alpha.toFixed(4)})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Render nodes with breathing glow
      for (const n of nodes) {
        const pulse = reduced ? 0 : Math.sin(n.phase) * 0.2;
        const radius = n.baseRadius * (1 + pulse);
        const alpha = Math.min(0.42, Math.max(0.08, n.alpha + pulse * 0.6));

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

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onPointerLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onPointerLeave);
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
