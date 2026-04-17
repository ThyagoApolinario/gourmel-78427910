import { forwardRef } from 'react';
import { formatarCusto } from '@/lib/smart-units';

export interface KitMarketingCardProps {
  nome: string;
  descricao?: string | null;
  itens: Array<{ nome: string; tipo: 'receita' | 'insumo'; quantidade: number }>;
  preco: number;
  precoIndividual: number;
  economiaPct: number;
  brandName?: string;
}

/**
 * Visual card for sharing kits on social media.
 * Rendered offscreen and converted to PNG via html-to-image.
 * Designed at 1080×1080 (Instagram square).
 */
export const KitMarketingCard = forwardRef<HTMLDivElement, KitMarketingCardProps>(
  ({ nome, descricao, itens, preco, precoIndividual, economiaPct, brandName = 'Confeitaria' }, ref) => {
    const itensReceitas = itens.filter((i) => i.tipo === 'receita');
    const itensInsumos = itens.filter((i) => i.tipo === 'insumo');

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: 'linear-gradient(135deg, hsl(140, 25%, 38%) 0%, hsl(140, 30%, 28%) 100%)',
          fontFamily: '"Poppins", "Quicksand", sans-serif',
          color: 'hsl(40, 30%, 96%)',
          position: 'relative',
          overflow: 'hidden',
          padding: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Decorative corner accents */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'hsl(18, 55%, 55%)',
            opacity: 0.18,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'hsl(40, 70%, 60%)',
            opacity: 0.15,
          }}
        />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'hsl(18, 55%, 55%)',
              padding: '10px 22px',
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontSize: 28 }}>🎁</span> Kit Especial
          </div>
          <h1
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              margin: '36px 0 16px',
              letterSpacing: -1,
              color: 'hsl(40, 35%, 97%)',
              textShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            {nome}
          </h1>
          {descricao && (
            <p
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                opacity: 0.92,
                margin: 0,
                maxWidth: 820,
              }}
            >
              {descricao}
            </p>
          )}
        </div>

        {/* Items list */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            borderRadius: 32,
            padding: '36px 44px',
            border: '2px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: 20,
            }}
          >
            O que vem no kit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...itensReceitas, ...itensInsumos].slice(0, 6).map((item, i) => (
              <div
                key={i}
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'hsl(40, 70%, 70%)',
                    minWidth: 70,
                  }}
                >
                  {item.quantidade}×
                </span>
                <span style={{ flex: 1 }}>{item.nome}</span>
              </div>
            ))}
            {itens.length > 6 && (
              <div style={{ fontSize: 24, opacity: 0.7, marginTop: 4 }}>
                + {itens.length - 6} {itens.length - 6 === 1 ? 'item' : 'itens'}
              </div>
            )}
          </div>
        </div>

        {/* Price + savings */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 3,
                textTransform: 'uppercase',
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              Por apenas
            </div>
            <div
              style={{
                fontSize: 124,
                fontWeight: 800,
                lineHeight: 1,
                color: 'hsl(40, 80%, 75%)',
                letterSpacing: -2,
              }}
            >
              {formatarCusto(preco)}
            </div>
            {economiaPct > 0 && (
              <div
                style={{
                  fontSize: 24,
                  marginTop: 12,
                  opacity: 0.85,
                  textDecoration: 'line-through',
                }}
              >
                de {formatarCusto(precoIndividual)} avulso
              </div>
            )}
          </div>
          {economiaPct > 0 && (
            <div
              style={{
                background: 'hsl(18, 65%, 50%)',
                color: 'white',
                padding: '24px 32px',
                borderRadius: 24,
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                transform: 'rotate(-4deg)',
                border: '4px solid hsl(40, 80%, 75%)',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>VOCÊ ECONOMIZA</div>
              <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, margin: '4px 0' }}>
                {Math.round(economiaPct)}%
              </div>
            </div>
          )}
        </div>

        {/* Footer brand */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: 22,
            opacity: 0.85,
          }}
        >
          <span style={{ fontWeight: 600, letterSpacing: 1 }}>🐾 {brandName}</span>
          <span style={{ fontStyle: 'italic' }}>Peça pelo WhatsApp</span>
        </div>
      </div>
    );
  },
);

KitMarketingCard.displayName = 'KitMarketingCard';
