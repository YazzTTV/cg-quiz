import Link from 'next/link'

export default function TarifsPage() {
  const plans = [
    {
      name: 'Gratuit',
      price: '0€',
      period: '',
      recommended: false,
      features: [
        { text: '50 questions par jour', included: true },
        { text: 'Quiz Culture Générale', included: true },
        { text: 'Statistiques basiques', included: true },
        { text: 'Mascotte (3 premiers paliers)', included: true },
        { text: 'Score prédictif', included: false },
        { text: 'Quiz Logique & Économie', included: false },
        { text: 'Révision intelligente', included: false },
      ],
      cta: 'Choisir Gratuit',
      href: '/register',
    },
    {
      name: 'Premium',
      price: '14,90€',
      period: '/mois',
      recommended: true,
      features: [
        { text: 'Questions illimitées', included: true },
        { text: 'Tous les quiz (Culture G, Logique, Éco)', included: true },
        { text: 'Statistiques avancées', included: true },
        { text: 'Mascotte complète (6 paliers)', included: true },
        { text: 'Score prédictif sur 400', included: true },
        { text: 'Révision intelligente (Spaced Repetition)', included: true },
        { text: 'Leaderboard national', included: true },
      ],
      cta: 'Choisir Premium',
      href: '/register',
    },
    {
      name: 'Haut de Gamme',
      price: '59,90€',
      period: '/mois',
      recommended: false,
      features: [
        { text: 'Tout le contenu Premium', included: true },
        { text: 'Sessions de coaching mensuelles', included: true },
        { text: 'Support prioritaire 7j/7', included: true },
        { text: 'Analyse avancée personnalisée', included: true },
        { text: 'Classements privés', included: true },
        { text: 'Accès bêta aux nouvelles fonctionnalités', included: true },
        { text: 'Tarif premium optimisé', included: false },
      ],
      cta: 'Choisir Haut de Gamme',
      href: '/register',
    },
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 50%, #2c5282 100%)',
        color: '#f8f9fa',
        fontFamily: "'Crimson Text', Georgia, serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap');

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(260px, 1fr));
          gap: 18px;
          min-width: 840px;
        }

        .plan-card {
          position: relative;
          border-radius: 8px;
          background: rgba(58, 85, 117, 0.88);
          border: 1px solid rgba(212, 175, 55, 0.28);
          padding: 24px 18px 18px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
          min-height: 450px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .plan-card:hover {
          transform: translateY(-6px);
          border-color: rgba(212, 175, 55, 0.72);
          box-shadow: 0 18px 52px rgba(212, 175, 55, 0.28);
        }

        .plan-card:not(.recommended) {
          width: 90%;
          justify-self: center;
          min-height: 390px;
          padding-top: 16px;
          padding-bottom: 12px;
        }

        .plan-card.recommended {
          border: 2px solid #d4af37;
          padding-top: 30px;
          min-height: 470px;
          box-shadow: 0 16px 46px rgba(0, 0, 0, 0.3);
        }

        .plan-card.recommended:hover {
          box-shadow: 0 20px 58px rgba(212, 175, 55, 0.34);
        }

        .recommended-badge {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #c9a961 100%);
          color: #10233f;
          font-weight: 700;
          font-size: 17px;
          line-height: 1;
          padding: 7px 14px;
          border-radius: 6px;
          letter-spacing: 0.3px;
        }

        @media (max-width: 1150px) {
          .plan-card {
            min-height: auto;
          }
        }
      `}</style>

      <nav
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          background: 'rgba(212, 175, 55, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '16px',
          lineHeight: 1,
        }}
      >
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '10px 16px', borderRadius: '6px', color: '#f8f9fa', textDecoration: 'none', fontWeight: 700 }}>
          Accueil
        </Link>
        <Link href="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '10px 16px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.18)', color: '#f4e4c1', textDecoration: 'none', fontWeight: 700 }}>
          Tarif
        </Link>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '10px 16px', borderRadius: '6px', color: 'rgba(248, 249, 250, 0.75)', textDecoration: 'none', fontWeight: 700 }}>
          Connexion
        </Link>
      </nav>

      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '180px 24px 80px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '8px' }}>Choisissez votre offre</h1>
          <p style={{ fontSize: '19px', color: 'rgba(248, 249, 250, 0.78)', lineHeight: 1.35 }}>
            Commencez gratuitement puis passez Premium pour débloquer tout votre potentiel.
          </p>
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'visible', paddingTop: '20px', paddingBottom: '8px' }}>
          <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan-card ${plan.recommended ? 'recommended' : ''}`}>
              {plan.recommended && <div className="recommended-badge">RECOMMANDÉ</div>}

              <h2 style={{ fontSize: '31px', fontWeight: 700, marginBottom: '14px' }}>{plan.name}</h2>

              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '42px', fontWeight: 700, color: '#f0d78a' }}>{plan.price}</span>
                {plan.period && (
                  <span style={{ fontSize: '22px', color: 'rgba(248, 249, 250, 0.72)', marginLeft: '5px' }}>
                    {plan.period}
                  </span>
                )}
              </div>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      marginBottom: '11px',
                      color: feature.included ? '#f4f7fb' : 'rgba(194, 203, 215, 0.55)',
                      fontSize: '20px',
                      lineHeight: 1.2,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        width: '20px',
                        justifyContent: 'center',
                        color: feature.included ? '#f0c21f' : 'rgba(182, 195, 211, 0.55)',
                        fontWeight: 700,
                        fontSize: '18px',
                      }}
                    >
                      {feature.included ? '✓' : '✕'}
                    </span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                style={{
                  marginTop: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: plan.recommended ? 'none' : '1px solid rgba(212, 175, 55, 0.45)',
                  background: plan.recommended
                    ? 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #c9a961 100%)'
                    : 'rgba(10, 25, 41, 0.55)',
                  color: plan.recommended ? '#0f1f38' : '#f4e4c1',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
          </div>
        </div>
      </section>
    </main>
  )
}
