import React, { useEffect, useRef } from 'react';

export const CinematicSpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      drawStatic();
    };

    window.addEventListener('resize', handleResize);

    // Generate static stars
    const starsCount = 120;
    const stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.7), // Mostly upper cosmic sky
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.015 + 0.005,
      });
    }

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Base deep space background
      const baseGradient = ctx.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(0, '#020409');
      baseGradient.addColorStop(0.3, '#040714');
      baseGradient.addColorStop(0.6, '#060A1A');
      baseGradient.addColorStop(1, '#020408');
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic Purple / Blue Nebula Bloom in center-left
      const nebulaX = width * 0.38;
      const nebulaY = height * 0.48;
      const nebulaGrad = ctx.createRadialGradient(
        nebulaX,
        nebulaY,
        10,
        nebulaX,
        nebulaY,
        Math.min(width, height) * 0.65
      );
      nebulaGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
      nebulaGrad.addColorStop(0.35, 'rgba(139, 92, 246, 0.15)');
      nebulaGrad.addColorStop(0.7, 'rgba(30, 41, 75, 0.08)');
      nebulaGrad.addColorStop(1, 'rgba(2, 4, 9, 0)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Render sparkling stars
      stars.forEach((star) => {
        const currentAlpha = star.alpha + Math.sin(time + star.x) * 0.2;
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0.1, Math.min(1, currentAlpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const drawStatic = () => {
      // Re-trigger layout
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic Starfield & Nebula Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* SVG Layer for Exact Planet Sphere & Glowing Atmosphere */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Planet Rim Blur Filter */}
          <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ambientVioletGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>

          {/* Radial Planet Body Gradient */}
          <radialGradient id="planetBody" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#0B132B" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#060A17" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#03050C" stopOpacity="0.99" />
            <stop offset="100%" stopColor="#020308" stopOpacity="1" />
          </radialGradient>

          {/* Planet Atmosphere Rim Gradient */}
          <linearGradient id="rimGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#3B82FF" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#2563FF" stopOpacity="0.4" />
            <stop offset="85%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#050814" stopOpacity="0" />
          </linearGradient>

          {/* Mountain Gradient Back Layer */}
          <linearGradient id="mountainBackGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#0D1322" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#090E1A" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#04060E" stopOpacity="1" />
          </linearGradient>

          {/* Mountain Gradient Mid Layer */}
          <linearGradient id="mountainMidGrad" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#0E1628" />
            <stop offset="50%" stopColor="#080C17" />
            <stop offset="100%" stopColor="#03050B" />
          </linearGradient>

          {/* Mountain Gradient Foreground Crags */}
          <linearGradient id="mountainForeGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#0A0F1E" />
            <stop offset="30%" stopColor="#060913" />
            <stop offset="100%" stopColor="#020307" />
          </linearGradient>

          {/* Mountain Ridge Rim Light */}
          <linearGradient id="ridgeLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
            <stop offset="30%" stopColor="#3B82FF" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* Valley Purple Ambient Light */}
          <linearGradient id="valleyLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="#6366F1" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#A855F7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Ambient Purple Light Blooming behind Planet & Mountain */}
        <circle cx="560" cy="420" r="320" fill="url(#valleyLight)" filter="url(#ambientVioletGlow)" opacity="0.7" />

        {/* 1. Large Planet Sphere */}
        <g transform="translate(520, 390)">
          {/* Planet Outer Atmospheric Outer Glow */}
          <circle
            cx="0"
            cy="0"
            r="280"
            fill="none"
            stroke="url(#rimGlowGrad)"
            strokeWidth="38"
            filter="url(#planetGlow)"
            opacity="0.85"
          />

          {/* Planet Inner Body */}
          <circle cx="0" cy="0" r="275" fill="url(#planetBody)" />

          {/* Planet Bright Crescent Rim Arc on Top-Left */}
          <path
            d="M -195 -195 A 275 275 0 0 1 120 -245"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="5"
            filter="url(#planetGlow)"
            opacity="0.9"
          />
          <path
            d="M -235 -140 A 275 275 0 0 1 180 -205"
            fill="none"
            stroke="#3B82FF"
            strokeWidth="12"
            opacity="0.65"
          />
        </g>

        {/* 2. Deep Mountain Silhouettes (Back Ridge) */}
        <path
          d="M 0 540 
             L 110 500 
             L 210 530 
             L 340 430 
             L 420 480 
             L 510 390 
             L 580 430 
             L 660 360 
             L 730 420 
             L 860 330 
             L 980 410 
             L 1120 350 
             L 1260 440 
             L 1440 410 
             L 1440 900 
             L 0 900 Z"
          fill="url(#mountainBackGrad)"
          opacity="0.9"
        />

        {/* Back Ridge Rim Glow */}
        <path
          d="M 210 530 L 340 430 L 420 480 L 510 390 L 580 430 L 660 360 L 730 420 L 860 330 L 980 410"
          fill="none"
          stroke="url(#ridgeLight)"
          strokeWidth="2.5"
          filter="url(#planetGlow)"
          opacity="0.8"
        />

        {/* 3. Midground Rocky Crags & Mountain Faces */}
        <path
          d="M 0 600 
             L 90 560 
             L 180 610 
             L 260 520 
             L 330 550 
             L 400 480 
             L 490 540 
             L 570 460 
             L 630 510 
             L 720 430 
             L 810 500 
             L 920 450 
             L 1040 530 
             L 1180 480 
             L 1320 560 
             L 1440 520 
             L 1440 900 
             L 0 900 Z"
          fill="url(#mountainMidGrad)"
        />

        {/* Midground Ridge Edge Highlights */}
        <path
          d="M 260 520 L 330 550 L 400 480 L 490 540 L 570 460 L 630 510 L 720 430"
          fill="none"
          stroke="url(#ridgeLight)"
          strokeWidth="1.8"
          opacity="0.6"
        />

        {/* 4. Foreground Mountain Terrain & Jagged Basins */}
        <path
          d="M 0 680 
             L 140 640 
             L 240 700 
             L 360 600 
             L 440 660 
             L 530 580 
             L 620 650 
             L 700 560 
             L 790 640 
             L 890 570 
             L 1000 660 
             L 1140 590 
             L 1280 680 
             L 1440 630 
             L 1440 900 
             L 0 900 Z"
          fill="url(#mountainForeGrad)"
        />

        {/* Foreground Valley Glowing Highlights (Ethereal River / Canyon Glow) */}
        <path
          d="M 380 780 Q 480 720 540 760 T 680 810 T 800 790 T 960 840"
          fill="none"
          stroke="rgba(139, 92, 246, 0.35)"
          strokeWidth="6"
          filter="url(#planetGlow)"
        />
        <path
          d="M 440 740 Q 510 700 580 730 T 720 780"
          fill="none"
          stroke="rgba(59, 130, 246, 0.45)"
          strokeWidth="3"
        />
      </svg>

      {/* Atmospheric Vignette & Soft Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#03050B]/90 via-transparent to-[#03050B]/80" />
    </div>
  );
};
