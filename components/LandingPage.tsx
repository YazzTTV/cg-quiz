'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Brain, TrendingUp, Trophy, ChevronRight, Star } from 'lucide-react';

export default function IAELandingPage() {
  const [simScore, setSimScore] = useState(126);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);
  const [weeklySessions, setWeeklySessions] = useState(4);
  const animationFrameRef = useRef<number | null>(null);
  const statsSectionRef = useRef<HTMLDivElement | null>(null);

  const colors = {
    bg: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 50%, #2c5282 100%)',
    accent: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #c9a961 100%)',
    cardBg: 'rgba(212, 175, 55, 0.08)',
    textPrimary: '#f8f9fa',
    textSecondary: 'rgba(248, 249, 250, 0.75)',
    border: 'rgba(212, 175, 55, 0.2)',
  };

  const minScore = 126;
  const maxScore = 320;
  const computeScrollScore = () => {
    const progress = computeScrollProgress();
    return Math.round(minScore + progress * (maxScore - minScore));
  };

  const computeScrollProgress = () => {
    const scrollTop = window.scrollY || window.pageYOffset;
    const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    return Math.min(Math.max(scrollTop / maxScrollable, 0), 1);
  };

  const animateScoreTo = (targetScore: number, durationMs = 260) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startScore = simScore;
    const delta = targetScore - startScore;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out rapide pour un effet "monte vite"
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startScore + delta * eased);
      setSimScore(next);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const handleCtaMouseEnter = () => {
    setIsCtaHovered(true);
    animateScoreTo(maxScore);
  };

  const handleCtaMouseLeave = () => {
    setIsCtaHovered(false);
    animateScoreTo(computeScrollScore(), 180);
  };

  useEffect(() => {
    const updateScoreFromScroll = () => {
      const progress = computeScrollProgress();
      setScrollProgress(progress);
      if (isCtaHovered) return;
      const nextScore = computeScrollScore();
      setSimScore(nextScore);
    };

    updateScoreFromScroll();
    window.addEventListener('scroll', updateScoreFromScroll, { passive: true });
    window.addEventListener('resize', updateScoreFromScroll);
    return () => {
      window.removeEventListener('scroll', updateScoreFromScroll);
      window.removeEventListener('resize', updateScoreFromScroll);
    };
  }, [isCtaHovered]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Quiz Adaptatif Intelligent",
      description: "Des questions qui s'adaptent à votre niveau en temps réel. L'algorithme identifie vos faiblesses et vous fait progresser là où vous en avez besoin."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Score Prédictif Propriétaire",
      description: "Estimez votre score final sur 400 points avec une précision redoutable. Suivez votre probabilité de réussite jour après jour."
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Mascotte Évolutive & Gamification",
      description: "De la souris débutante au lion couronné : 6 paliers d'évolution qui transforment votre préparation en aventure addictive."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      score: "347/400",
      text: "J'ai augmenté mon score de 89 points en 6 semaines. La révision intelligente m'a fait gagner un temps fou.",
      avatar: "SM"
    },
    {
      name: "Thomas L.",
      score: "368/400",
      text: "La mascotte évolutive m'a vraiment motivé à réviser tous les jours. Admis à l'IAE de Lyon !",
      avatar: "TL"
    },
    {
      name: "Inès K.",
      score: "331/400",
      text: "Les quiz adaptatifs ciblent exactement mes points faibles. Un game changer pour la culture générale.",
      avatar: "IK"
    }
  ];

  const stats = [
    { target: 40, format: (n: number) => `${n}K+`, label: "Candidats par an" },
    { target: 87, format: (n: number) => `${n}%`, label: "Taux de réussite Premium" },
    { target: 94, format: (n: number) => `+${n}pts`, label: "Progression moyenne" },
    { target: 6, format: (n: number) => `${n} paliers`, label: "Évolution mascotte" }
  ];

  const projectedScore = Math.min(400, Math.round(190 + weeklySessions * 18));
  const projectedMonthlyGain = Math.max(0, Math.round(weeklySessions * 4.2));

  useEffect(() => {
    const node = statsSectionRef.current;
    if (!node || hasAnimatedStats) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasAnimatedStats) return;

          setHasAnimatedStats(true);
          const start = performance.now();
          const duration = 900;

          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextValues = stats.map((stat) => Math.round(stat.target * eased));
            setAnimatedStats(nextValues);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimatedStats]);

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      color: colors.textPrimary,
      fontFamily: "'Crimson Text', Georgia, serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.14,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'fixed',
        right: '24px',
        top: '110px',
        bottom: '24px',
        width: '1px',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(212,175,55,0.04), rgba(212,175,55,0.2), rgba(212,175,55,0.04))'
      }}>
        <div style={{
          position: 'absolute',
          left: '-3px',
          width: '7px',
          height: '44px',
          borderRadius: '999px',
          top: `calc(${Math.round(scrollProgress * 100)}% - 22px)`,
          background: 'linear-gradient(180deg, rgba(244,228,193,0.75) 0%, rgba(212,175,55,0.65) 100%)',
          boxShadow: '0 0 10px rgba(212,175,55,0.42), 0 0 22px rgba(212,175,55,0.24)',
          transition: 'top 0.08s linear'
        }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap');

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }

        .glassmorphism {
          background: ${colors.cardBg};
          backdrop-filter: blur(20px);
          border: 1px solid ${colors.border};
          border-radius: 8px;
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(212, 175, 55, 0.3);
        }

        .gradient-text {
          background-image: ${colors.accent};
          background-color: transparent;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .shimmer-button {
          background: ${colors.accent};
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          border: none;
          color: #1a1a3e;
          font-weight: 700;
          padding: 18px 48px;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .shimmer-button:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: '24px',
        left: '24px',
        zIndex: 1000,
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        padding: '14px 16px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        minWidth: '170px',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease',
        boxShadow: isCtaHovered ? '0 0 28px rgba(212, 175, 55, 0.55)' : 'none',
        background: isCtaHovered ? 'rgba(212, 175, 55, 0.16)' : colors.cardBg
      }}>
        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '6px' }}>
          Score IAE estimé
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
          <span className="gradient-text">{simScore}</span>
          <span style={{ color: colors.textSecondary, fontSize: '22px' }}>/400</span>
        </div>
      </div>

      <nav style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '10px',
        fontSize: '16px',
        lineHeight: 1
      }}>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40px',
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(212, 175, 55, 0.18)',
            color: '#f4e4c1',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Accueil
        </button>
        <Link href="/tarifs" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px',
          padding: '10px 16px',
          borderRadius: '6px',
          background: 'transparent',
          color: colors.textSecondary,
          textDecoration: 'none',
          fontWeight: 700
        }}>
          Tarif
        </Link>
        <Link href="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px',
          padding: '10px 16px',
          borderRadius: '6px',
          color: colors.textSecondary,
          textDecoration: 'none',
          fontWeight: 700
        }}>
          Connexion
        </Link>
      </nav>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="fade-in-up stagger-1">
          <div style={{ display: 'inline-block', padding: '10px 24px', background: colors.cardBg, backdropFilter: 'blur(10px)', borderRadius: '4px', border: `1px solid ${colors.border}`, marginBottom: '32px', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
            <span className="gradient-text">40 000+ candidats utilisent notre plateforme</span>
          </div>
        </div>

        <h1 className="fade-in-up stagger-2" style={{ fontSize: '64px', fontWeight: 600, lineHeight: 1.1, marginBottom: '24px', fontFamily: "'Crimson Text', serif" }}>
          Réussissez le <span className="gradient-text">Score IAE-Message</span> avec l'IA
        </h1>

        <p className="fade-in-up stagger-3" style={{ fontSize: '22px', color: colors.textSecondary, maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          La première plateforme qui transforme votre préparation en expérience addictive. Quiz adaptatif, score prédictif et gamification pour maximiser vos chances.
        </p>

        <div className="fade-in-up stagger-4" style={{ marginBottom: '64px' }}>
          <button className="shimmer-button" onMouseEnter={handleCtaMouseEnter} onMouseLeave={handleCtaMouseLeave}>
            Commencer gratuitement <ChevronRight style={{ display: 'inline', marginLeft: '8px' }} />
          </button>
          <p style={{ marginTop: '16px', fontSize: '14px', color: colors.textSecondary }}>
            ✓ Sans carte bancaire • ✓ 50 questions/jour offertes
          </p>
        </div>

        <div ref={statsSectionRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginTop: '80px' }}>
          {stats.map((stat, idx) => (
            <div key={idx} className={`glassmorphism fade-in-up stagger-${idx + 1}`} style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '48px', fontWeight: 700, marginBottom: '8px' }}>
                {stat.format(animatedStats[idx])}
              </div>
              <div style={{ fontSize: '16px', color: colors.textSecondary, fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div className="glassmorphism" style={{ padding: '64px 48px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>
            Pourquoi les méthodes <span className="gradient-text">classiques échouent</span> ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📚</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Livres statiques</h3>
              <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>Impossible de savoir si vous progressez réellement. Pas de feedback, pas d'adaptation.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🎓</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Prépas physiques</h3>
              <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>Coûteuses (600-1200€), contraintes horaires, rythme imposé qui ne s'adapte pas à vous.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>⏰</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Manque de temps</h3>
              <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>Entre les cours, le travail et la vie perso, impossible de réviser efficacement.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '64px', textAlign: 'center' }}>
          Une plateforme pensée pour <span className="gradient-text">votre réussite</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          {features.map((feature, idx) => (
            <div key={idx} className="glassmorphism hover-lift" style={{ padding: '48px 36px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#1a1a3e' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>{feature.title}</h3>
              <p style={{ color: colors.textSecondary, lineHeight: 1.7, fontSize: '16px' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
          Ils ont réussi avec <span className="gradient-text">IAE Ultimate Trainer</span>
        </h2>
        <p style={{ textAlign: 'center', fontSize: '18px', color: colors.textSecondary, marginBottom: '64px' }}>
          +94 points de progression moyenne chez nos utilisateurs Premium
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="glassmorphism hover-lift" style={{ padding: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#1a1a3e' }}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>{testimonial.name}</div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: 600 }}>
                    Score : <span className="gradient-text">{testimonial.score}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: '18px', height: '18px', fill: '#d4af37', stroke: 'none' }} />
                ))}
              </div>
              <p style={{ color: colors.textSecondary, lineHeight: 1.6, fontSize: '15px', fontStyle: 'italic' }}>
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div className="glassmorphism" style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 34px' }}>
          <h3 style={{ fontSize: '42px', fontWeight: 700, marginBottom: '14px' }}>
            Estimez votre <span className="gradient-text">note projetée</span>
          </h3>
          <p style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '26px' }}>
            Simulez votre volume d’entraînement hebdomadaire pour estimer votre progression sur 400 points.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '16px', color: colors.textSecondary, marginBottom: '10px' }}>Sessions de révision par semaine</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min={1}
                max={14}
                value={weeklySessions}
                onChange={(e) => setWeeklySessions(Math.min(14, Math.max(1, Number(e.target.value) || 1)))}
                style={{
                  width: '120px',
                  background: 'rgba(10,25,41,0.5)',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: '20px',
                  fontWeight: 700,
                  padding: '10px 12px',
                }}
              />
              <button
                type="button"
                onClick={() => setWeeklySessions((v) => Math.max(1, v - 1))}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '999px',
                  border: `1px solid ${colors.border}`,
                  background: 'rgba(10,25,41,0.55)',
                  color: colors.textPrimary,
                  fontSize: '22px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setWeeklySessions((v) => Math.min(14, v + 1))}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #c9a961 100%)',
                  color: '#1a1a3e',
                  fontSize: '26px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '62px', fontWeight: 700, lineHeight: 1 }}>
              <span className="gradient-text">{projectedScore}</span>
              <span style={{ fontSize: '32px', color: colors.textSecondary }}> /400</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>
              <span style={{ color: '#f0d78a' }}>+{projectedMonthlyGain} pts</span>{' '}
              <span style={{ color: colors.textSecondary, fontSize: '30px' }}>estimés / mois</span>
            </div>
          </div>

          <p style={{ marginTop: '16px', color: 'rgba(248,249,250,0.62)', fontSize: '16px' }}>
            *estimation basée sur la fréquence de révision, la progression moyenne observée et une pratique régulière.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 120px', position: 'relative', zIndex: 1 }}>
        <div className="glassmorphism" style={{ padding: '80px 48px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(201,169,97,0.05) 100%)', border: '2px solid rgba(212,175,55,0.3)' }}>
          <h2 style={{ fontSize: '56px', fontWeight: 700, marginBottom: '24px' }}>
            Prêt à <span className="gradient-text">réussir</span> ?
          </h2>
          <p style={{ fontSize: '20px', color: colors.textSecondary, maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
            Rejoignez les 40 000+ étudiants qui ont transformé leur préparation au SIM. Commencez gratuitement aujourd'hui.
          </p>
          <button className="shimmer-button" onMouseEnter={handleCtaMouseEnter} onMouseLeave={handleCtaMouseLeave}>
            Commencer mon essai gratuit <ChevronRight style={{ display: 'inline', marginLeft: '8px' }} />
          </button>
          <p style={{ marginTop: '24px', fontSize: '14px', color: colors.textSecondary }}>
            ✓ Aucune carte bancaire requise • ✓ Accès immédiat • ✓ Support 7j/7
          </p>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${colors.border}`, padding: '48px 24px', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
        <p>© 2026 IAE Ultimate Trainer. Tous droits réservés.</p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '24px', justifyContent: 'center' }}>
          <a href="#" style={{ color: colors.textSecondary }}>Mentions légales</a>
          <a href="#" style={{ color: colors.textSecondary }}>CGU</a>
          <a href="#" style={{ color: colors.textSecondary }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
