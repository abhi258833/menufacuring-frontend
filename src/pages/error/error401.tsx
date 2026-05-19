import React, { useEffect, useState } from 'react';
import './animate.css';

interface ParticlePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ParticleProps {
  id: number;
  color: string;
}

interface ParticleData {
  id: number;
  color: string;
}

const Particle: React.FC<ParticleProps> = ({ color }) => {
  const [position, setPosition] = useState<ParticlePosition>({
    x: Math.random() * 100,
    y: Math.random() * 100,
    vx: Math.random() * 0.3 - 0.15,
    vy: Math.random() * 0.3 - 0.15,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        let { x, y, vx, vy } = prev;
        x += vx;
        y += vy;

        if (x < 0 || x > 100) vx *= -1;
        if (y < 0 || y > 100) vy *= -1;

        return { x, y, vx, vy };
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="particle"
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.7,
      }}
    />
  );
};

const Error401: React.FC = () => {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [show, setShow] = useState(false);
  const colors = ['#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#5f27cd'];

  useEffect(() => {
    setParticles(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
    );

    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="error-container">
      <div className="stars" />
      <div className="twinkling" />
      <div className="clouds" />
      <div className="meteors" />
      {particles.map((p) => (
        <Particle key={p.id} id={p.id} color={p.color} />
      ))}

      <div className={`error-card ${show ? 'fade-in' : ''}`}>
        <h1 className="glow-text animate__animated animate__rubberBand">401</h1>
        <h2 className="text-glow animate__animated animate__fadeInUp animate__delay-1s">
          Unauthorized Access
        </h2>
        <p className="animate__animated animate__fadeIn animate__delay-2s">
          You do not have the necessary permissions to access this resource.
        </p>

        <ul className="reason-list animate__animated animate__fadeInUp animate__delay-3s">
          <li>• Invalid credentials</li>
          <li>• Access token expired</li>
          <li>• Restricted access area</li>
        </ul>

        <div className="btn-group animate__animated animate__fadeInUp animate__delay-4s">
          <a href="/" className="space-btn">🏠 Home</a>
          <button className="space-btn secondary" onClick={() => window.history.back()}>🔙 Go Back</button>
          <a href="/login" className="space-btn">🔐 Login</a>
        </div>
      </div>

      <div className="spaceship animate__animated animate__zoomInDown"></div>
    </div>
  );
};

export default Error401;
