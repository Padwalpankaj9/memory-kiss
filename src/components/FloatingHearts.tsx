export function FloatingHearts() {
  const hearts = [
    { left: "6%", size: 14, duration: "6s", delay: "0s" },
    { left: "15%", size: 20, duration: "7s", delay: "1s" },
    { left: "25%", size: 12, duration: "5.5s", delay: "3s" },
    { left: "35%", size: 18, duration: "8s", delay: "0.5s" },
    { left: "45%", size: 15, duration: "6.5s", delay: "2s" },
    { left: "55%", size: 22, duration: "7.5s", delay: "4s" },
    { left: "65%", size: 13, duration: "5s", delay: "1.5s" },
    { left: "75%", size: 19, duration: "6s", delay: "3.5s" },
    { left: "85%", size: 16, duration: "7s", delay: "0s" },
    { left: "92%", size: 11, duration: "5.5s", delay: "2.5s" },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {hearts.map((h, i) => (
        <svg
          key={i}
          className="float-heart"
          style={{
            left: h.left,
            bottom: "-40px",
            width: h.size,
            height: h.size,
            animationDuration: h.duration,
            animationDelay: h.delay,
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 21s-7.5-4.6-9.5-9.1C1 8.6 3 5 6.5 5c2 0 3.4 1.1 4.3 2.4C11.7 6.1 13.1 5 15.1 5 18.6 5 20.6 8.6 19.1 11.9 17.1 16.4 12 21 12 21z" />
        </svg>
      ))}
    </div>
  );
}
