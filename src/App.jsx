
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import "./App.css";

const rewards = [
  { name: "100 XP", icon: "⭐" },
  { name: "50 Kim cương", icon: "💎" },
  { name: "Vé may mắn", icon: "🎟️" },
];

export default function App() {
  const [reward, setReward] = useState(null);
  const [opening, setOpening] = useState(false);

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (!tg) return;

    tg.ready();
    tg.expand();

    try {
      tg.requestFullscreen?.();
    } catch (error) {
      console.warn("Fullscreen unavailable:", error);
    }

    return () => {};
  }, []);

  function openGift() {
    if (opening || reward) return;

    setOpening(true);
    tg?.HapticFeedback?.impactOccurred("medium");

    setTimeout(() => {
      const selected =
        rewards[Math.floor(Math.random() * rewards.length)];

      setReward(selected);
      setOpening(false);

      confetti({
        particleCount: 180,
        spread: 110,
        origin: { y: 0.55 },
        zIndex: 9999,
      });

      tg?.HapticFeedback?.notificationOccurred("success");
    }, 900);
  }

  return (
    <main className="screen">
      <div className="stars">✦ ✧ ✦ ✧ ✦</div>

      <h1>🎁 Mystery Gift</h1>
      <p className="subtitle">Một bất ngờ đang chờ bạn!</p>

      <div
        className={`gift ${opening ? "opening" : ""}`}
        onClick={openGift}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openGift();
        }}
      >
        <div className="gift-lid">
          <div className="lid-ribbon" />
        </div>
        <div className="gift-body">
          <div className="body-ribbon" />
        </div>
      </div>

      <button onClick={openGift} disabled={opening || !!reward}>
        {opening ? "Đang mở..." : "✨ MỞ HỘP QUÀ"}
      </button>

      {reward && (
        <div className="overlay">
          <div className="modal">
            <div className="reward-icon">{reward.icon}</div>
            <h2>🎉 Chúc mừng!</h2>
            <p>Bạn đã nhận được</p>
            <h3>{reward.name}</h3>

            <button
              onClick={() => {
                setReward(null);
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
