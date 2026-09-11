"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./bug-rain.module.css";

const fresh = () => ({
  x: 240,
  time: 0,
  hp: 3,
  score: 0,
  drops: [],
  spawn: 0,
  invincible: 0,
});
const clamp = (x) => Math.max(24, Math.min(456, x));

export default function BugRain() {
  const canvas = useRef(null);
  const game = useRef(fresh());
  const keys = useRef(new Set());
  const phase = useRef("ready");
  const [status, setStatus] = useState("ready");
  const [hud, setHud] = useState({ hp: 3, score: 0, time: 60 });
  const [best, setBest] = useState(0);
  const [sound, setSound] = useState(false);
  const soundOn = useRef(false);
  const audio = useRef(null);

  function change(next) {
    phase.current = next;
    setStatus(next);
    keys.current.clear();
  }
  function start() {
    game.current = fresh();
    setHud({ hp: 3, score: 0, time: 60 });
    change("playing");
    canvas.current?.focus();
  }
  function toggleSound() {
    const next = !soundOn.current;
    soundOn.current = next;
    setSound(next);
    if (next) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio && !audio.current) audio.current = new Audio();
      audio.current?.resume().catch(() => {});
    }
  }

  useEffect(() => {
    try {
      const value = Number(localStorage.getItem("ai-morning-bug-rain-v1"));
      if (Number.isFinite(value) && value > 0) setBest(value);
    } catch {}
    const ctx = canvas.current.getContext("2d");
    let frame,
      last = 0,
      hudClock = 0;
    function beep(good) {
      if (!soundOn.current || !audio.current) return;
      const a = audio.current,
        o = a.createOscillator(),
        gain = a.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(good ? 660 : 120, a.currentTime);
      gain.gain.setValueAtTime(0.035, a.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.12);
      o.connect(gain);
      gain.connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.13);
    }
    function finish(next) {
      change(next);
      const score = Math.floor(game.current.score);
      setBest((previous) => {
        const value = Math.max(previous, score);
        try {
          localStorage.setItem("ai-morning-bug-rain-v1", String(value));
        } catch {}
        return value;
      });
    }
    function loop(now) {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      const g = game.current;
      if (phase.current === "playing") {
        g.time += dt;
        g.score += dt * 10;
        g.invincible = Math.max(0, g.invincible - dt);
        const k = keys.current;
        g.x = clamp(
          g.x +
            ((k.has("ArrowRight") || k.has("d") ? 1 : 0) -
              (k.has("ArrowLeft") || k.has("a") ? 1 : 0)) *
              330 *
              dt,
        );
        g.spawn -= dt;
        if (g.spawn <= 0) {
          g.drops.push({
            x: 25 + Math.random() * 430,
            y: -25,
            coffee: Math.random() < 0.19,
            speed: 145 + g.time * 3 + Math.random() * 55,
          });
          g.spawn = Math.max(0.19, 0.65 - g.time * 0.007);
        }
        for (const d of g.drops) {
          d.y += d.speed * dt;
          if (Math.abs(d.x - g.x) < 29 && Math.abs(d.y - 510) < 29 && !d.hit) {
            d.hit = true;
            if (d.coffee) {
              g.hp = Math.min(3, g.hp + 1);
              g.score += 100;
              beep(true);
            } else if (!g.invincible) {
              g.hp--;
              g.invincible = 1.15;
              beep(false);
            }
          }
        }
        g.drops = g.drops.filter((d) => !d.hit && d.y < 610);
        if (g.hp <= 0) finish("lost");
        else if (g.time >= 60) {
          g.score += 500;
          finish("won");
        }
        hudClock += dt;
        if (hudClock > 0.1 || phase.current !== "playing") {
          hudClock = 0;
          setHud({
            hp: g.hp,
            score: Math.floor(g.score),
            time: Math.max(0, Math.ceil(60 - g.time)),
          });
        }
      }
      ctx.fillStyle = "#101a30";
      ctx.fillRect(0, 0, 480, 600);
      ctx.strokeStyle = "#20304b";
      ctx.lineWidth = 1;
      for (let x = 0; x < 480; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      for (let y = 0; y < 600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(480, y);
        ctx.stroke();
      }
      ctx.fillStyle = "#192b43";
      ctx.fillRect(0, 545, 480, 55);
      ctx.fillStyle = "#7be4c6";
      ctx.fillRect(0, 545, 480, 3);
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("FRIDAY DEPLOY / SURVIVAL MODE", 240, 579);
      ctx.font = "30px sans-serif";
      for (const d of g.drops) {
        ctx.fillText(d.coffee ? "☕" : "🐛", d.x, d.y + 10);
      }
      ctx.globalAlpha = g.invincible > 0 ? 0.45 : 1;
      ctx.fillStyle = "#7be4c6";
      ctx.fillRect(g.x - 22, 488, 44, 38);
      ctx.fillStyle = "#101a30";
      ctx.font = "bold 21px monospace";
      ctx.fillText("</>", g.x, 515);
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(loop);
    }
    function hide() {
      if (document.hidden && phase.current === "playing") change("paused");
    }
    function blur() {
      keys.current.clear();
      if (phase.current === "playing") change("paused");
    }
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", blur);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", blur);
      audio.current?.close().catch(() => {});
      audio.current = null;
    };
  }, []);

  function move(event) {
    if (phase.current !== "playing") return;
    const rect = canvas.current.getBoundingClientRect();
    game.current.x = clamp(((event.clientX - rect.left) / rect.width) * 480);
  }
  return (
    <main className={styles.arcade}>
      <header className={styles.header}>
        <Link href="/">← AI Morning</Link>
        <span>THE COFFEE BREAK CLUB</span>
        <span className={styles.badge}>ARCADE / 01</span>
      </header>
      <div className={styles.layout}>
        <section className={styles.intro}>
          <p className={styles.kicker}>MỘT CHÚT TUỔI THƠ, GIỮA GIỜ LÀM.</p>
          <h1>
            BUG
            <br />
            <span>RAIN.</span>
          </h1>
          <p className={styles.tagline}>
            Thứ Sáu. 4:59 chiều.
            <br />
            Bug bắt đầu rơi.
          </p>
          <p>Né bug, nhặt cà phê. Sống sót 60 giây để deploy thành công.</p>
          <div className={styles.instructions}>
            <p>
              <span>🐛</span> Chạm bug: mất 1 mạng
            </p>
            <p>
              <span>☕</span> Cà phê: +100 điểm, hồi 1 mạng
            </p>
            <p>
              <span>⚑</span> Sống sót: thưởng 500 điểm
            </p>
          </div>
          <p className={styles.controls}>
            <kbd>←</kbd> <kbd>→</kbd> hoặc <kbd>A</kbd> <kbd>D</kbd>
            <br />
            Điện thoại: kéo trong khung chơi.
            <br />
            <kbd>P</kbd> để tạm dừng.
          </p>
          <div className={styles.best}>
            KỶ LỤC TRÊN MÁY NÀY <strong>{best.toLocaleString("vi-VN")}</strong>
          </div>
        </section>
        <section className={styles.cabinet} aria-label="Bug Rain">
          <div className={styles.hud}>
            <div>
              ĐIỂM<strong>{String(hud.score).padStart(4, "0")}</strong>
            </div>
            <div>
              CÒN LẠI<strong>{hud.time}s</strong>
            </div>
            <div>
              MẠNG
              <strong aria-label={`${hud.hp} mạng`}>
                {"♥".repeat(hud.hp)}
                {"♡".repeat(3 - hud.hp)}
              </strong>
            </div>
          </div>
          <div className={styles.screen}>
            <canvas
              ref={canvas}
              width="480"
              height="600"
              tabIndex={0}
              aria-label="Sân chơi. Dùng phím trái phải hoặc A D để né bug, P để tạm dừng."
              onKeyDown={(e) => {
                const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                if (["ArrowLeft", "ArrowRight", "a", "d", "p"].includes(key)) {
                  e.preventDefault();
                  if (key === "p" && !e.repeat) {
                    if (phase.current === "playing") change("paused");
                    else if (phase.current === "paused") change("playing");
                  } else keys.current.add(key);
                }
              }}
              onKeyUp={(e) =>
                keys.current.delete(
                  e.key.length === 1 ? e.key.toLowerCase() : e.key,
                )
              }
              onPointerDown={(e) => {
                e.currentTarget.focus();
                e.currentTarget.setPointerCapture(e.pointerId);
                move(e);
              }}
              onPointerMove={(e) => {
                if (e.buttons || e.pointerType === "mouse") move(e);
              }}
            />
            {status !== "playing" && (
              <div className={styles.overlay}>
                <span className={styles.coin}>
                  {status === "ready"
                    ? "☕"
                    : status === "won"
                      ? "✓"
                      : status === "paused"
                        ? "Ⅱ"
                        : "☠"}
                </span>
                <p className={styles.kicker}>
                  {status === "ready"
                    ? "INSERT COFFEE TO CONTINUE"
                    : status === "won"
                      ? "DEPLOY THÀNH CÔNG"
                      : status === "paused"
                        ? "NGHỈ TAY MỘT CHÚT"
                        : "PRODUCTION ĐÃ GỌI"}
                </p>
                <h2>
                  {status === "ready"
                    ? "Sẵn sàng né bug?"
                    : status === "paused"
                      ? "Đang tạm dừng"
                      : status === "won"
                        ? "Cuối tuần yên bình!"
                        : "Thêm ván nữa chứ?"}
                </h2>
                {(status === "lost" || status === "won") && (
                  <p role="status">Bạn đạt {hud.score} điểm.</p>
                )}
                <button
                  className={styles.play}
                  onClick={() => {
                    if (status === "paused") {
                      change("playing");
                      canvas.current.focus();
                    } else start();
                  }}
                >
                  {status === "ready"
                    ? "CHƠI NGAY →"
                    : status === "paused"
                      ? "TIẾP TỤC →"
                      : "CHƠI LẠI ↻"}
                </button>
                <p>Không cần xu. Không cần cài Flash.</p>
              </div>
            )}
          </div>
          <footer className={styles.toolbar}>
            <button onClick={toggleSound} aria-pressed={sound}>
              Âm thanh: {sound ? "Bật" : "Tắt"}
            </button>
            <button
              disabled={status !== "playing" && status !== "paused"}
              onClick={() => {
                change(status === "playing" ? "paused" : "playing");
                canvas.current.focus();
              }}
            >
              {status === "paused" ? "Tiếp tục" : "Tạm dừng"}
            </button>
          </footer>
        </section>
      </div>
      <noscript>Bật JavaScript để chơi Bug Rain.</noscript>
    </main>
  );
}
