'use client';

import React, { useEffect, useRef } from 'react';
import { useMotionCapability } from '@/lib/motion/capability';

const VERT = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform vec2 u_mouse;
  uniform float u_time;
  void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    float d = distance(uv, u_mouse);
    float ripple = sin(d * 18.0 - u_time * 1.5) * 0.004 * smoothstep(0.5, 0.0, d);
    vec2 disp = uv + (uv - u_mouse) * ripple;
    vec4 color = texture2D(u_tex, disp);
    // Materialize-out-of-black vignette toward edges.
    float vig = smoothstep(1.1, 0.2, distance(uv, vec2(0.5)));
    gl_FragColor = vec4(color.rgb * mix(0.55, 1.0, vig), 1.0);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

export function LookbookHero({
  imageUrl,
  title,
  subtitle,
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
}): React.JSX.Element {
  const animate = useMotionCapability();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!animate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true });
    if (!gl) return; // graceful: static layer remains underneath

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([10, 10, 10, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Only sample a real asset; with no image the 1×1 black texture above is the
    // intended "materialize out of the void" backdrop (and we avoid a 404 fetch).
    if (imageUrl) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      };
      image.src = imageUrl;
    }

    const uTex = gl.getUniformLocation(program, 'u_tex');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const mouse = { x: 0.5, y: 0.5 };

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    function onMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
    }
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onMove);

    let raf = 0;
    let running = true;
    const start = performance.now();
    function frame(t: number) {
      if (!running) return;
      gl!.uniform1i(uTex, 0);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.uniform1f(uTime, (t - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }

    // Pause offscreen via IntersectionObserver.
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      }
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    };
  }, [animate, imageUrl]);

  return (
    <section
      data-testid="lookbook-hero"
      className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-ink"
    >
      {/* Static layer: always rendered (visible-by-default); the only thing shown under reduced motion.
          src is omitted when there is no asset so the branded bg-ink backdrop shows with no 404 fetch. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="lookbook-hero-fallback"
        src={imageUrl || undefined}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {animate ? (
        /* pointer-events-none: the canvas is a purely visual overlay; pointer events
           should reach the static img / text layer beneath it at all times.
           This also prevents the canvas blocking the static fallback when WebGL
           fails to acquire a context (GPU-less environment). */
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full pointer-events-none" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <div className="absolute bottom-0 left-0 max-w-[var(--max-w-shell)] p-6 md:p-12">
        <h1 className="display text-5xl text-paper md:text-7xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm text-smoke-300 md:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
