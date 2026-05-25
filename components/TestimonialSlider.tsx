"use client";

import { useState, useEffect } from "react";

const testimonials = [
  {
    text: "SahiScreen cut our screening time from 2 weeks to 1 day. The AI actually understands Pakistani institutions — it's not just keyword matching.",
    initials: "RA",
    name: "Rania Aziz",
    role: "HR Manager · Engro Corporation",
  },
  {
    text: "Finally an HR tool built for Pakistan. It recognizes local universities and filters out fake CVs automatically. Saved us so much time.",
    initials: "WA",
    name: "Waleed Ahmed",
    role: "Talent Lead · Systems Limited",
  },
];

export default function TestimonialSlider() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("left");

  useEffect(() => {
    const timer = setInterval(() => {
      // slide out
      setVisible(false);
      setDirection((prev) => (prev === "left" ? "right" : "left"));

      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % testimonials.length);
        setVisible(true);
      }, 400);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const t = testimonials[current];

  return (
    <>
      <style>{`
        .testimonial-slider {
          position: relative;
          overflow: hidden;
        }

        .testimonial-slide {
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .testimonial-slide.enter {
          opacity: 1;
          transform: translateX(0);
        }

        .testimonial-slide.exit-left {
          opacity: 0;
          transform: translateX(-50px);
        }

        .testimonial-slide.exit-right {
          opacity: 0;
          transform: translateX(50px);
        }

        .testimonial-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
        }

        .t-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: all 0.3s;
          border: none;
          padding: 0;
          cursor: default;
        }

        .t-dot.active {
          background: #a78bfa;
          width: 18px;
          border-radius: 3px;
        }
      `}</style>

      <div className="testimonial-slider">
        <div
          className={`deco-testimonial testimonial-slide ${
            visible
              ? "enter"
              : direction === "left"
                ? "exit-left"
                : "exit-right"
          }`}
        >
          <p className="deco-testimonial-text">"{t.text}"</p>
          <div className="deco-testimonial-author">
            <div className="deco-author-avatar">{t.initials}</div>
            <div>
              <span className="deco-author-name">{t.name}</span>
              <span className="deco-author-role">{t.role}</span>
            </div>
          </div>
        </div>

        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <span
              key={i}
              className={`t-dot ${i === current ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
