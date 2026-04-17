import { forwardRef } from 'react';
import { formatarCusto } from '@/lib/smart-units';

export type KitTemplateId = 'festivo' | 'clean' | 'colorido';
export type KitFormat = 'square' | 'story';

export interface KitTemplateOption {
  id: KitTemplateId;
  label: string;
  description: string;
  emoji: string;
}

export const KIT_TEMPLATES: KitTemplateOption[] = [
  { id: 'festivo', label: 'Festivo', description: 'Verde sálvia + terracota', emoji: '🎁' },
  { id: 'clean', label: 'Clean', description: 'Minimalista e elegante', emoji: '✨' },
  { id: 'colorido', label: 'Colorido', description: 'Vibrante e divertido', emoji: '🌈' },
];

export const KIT_FORMATS: { id: KitFormat; label: string; sublabel: string; width: number; height: number }[] = [
  { id: 'square', label: 'Quadrado', sublabel: '1080×1080 · Feed', width: 1080, height: 1080 },
  { id: 'story', label: 'Story', sublabel: '1080×1920 · Stories', width: 1080, height: 1920 },
];

export interface KitMarketingCardProps {
  nome: string;
  descricao?: string | null;
  itens: Array<{ nome: string; tipo: 'receita' | 'insumo'; quantidade: number }>;
  preco: number;
  precoIndividual: number;
  economiaPct: number;
  brandName?: string;
  template?: KitTemplateId;
  format?: KitFormat;
}

/**
 * Visual card for sharing kits on social media.
 * Rendered offscreen and converted to PNG via html-to-image.
 * Supports two formats: 1080×1080 (Instagram square) and 1080×1920 (Stories).
 */
export const KitMarketingCard = forwardRef<HTMLDivElement, KitMarketingCardProps>(
  ({ template = 'festivo', format = 'square', ...props }, ref) => {
    if (template === 'clean') return <CleanTemplate ref={ref} format={format} {...props} />;
    if (template === 'colorido') return <ColoridoTemplate ref={ref} format={format} {...props} />;
    return <FestivoTemplate ref={ref} format={format} {...props} />;
  },
);
KitMarketingCard.displayName = 'KitMarketingCard';

type TemplateProps = Omit<KitMarketingCardProps, 'template'> & { format: KitFormat };

const dimensions = (format: KitFormat) =>
  format === 'story' ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 };

/* ============================================================
   TEMPLATE 1 — FESTIVO (verde sálvia + terracota)
   ============================================================ */
const FestivoTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ nome, descricao, itens, preco, precoIndividual, economiaPct, brandName = 'Confeitaria', format }, ref) => {
    const itensReceitas = itens.filter((i) => i.tipo === 'receita');
    const itensInsumos = itens.filter((i) => i.tipo === 'insumo');
    const { width, height } = dimensions(format);
    const isStory = format === 'story';

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          background: 'linear-gradient(135deg, hsl(140, 25%, 38%) 0%, hsl(140, 30%, 28%) 100%)',
          fontFamily: '"Poppins", "Quicksand", sans-serif',
          color: 'hsl(40, 30%, 96%)',
          position: 'relative',
          overflow: 'hidden',
          padding: isStory ? '120px 80px' : 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'absolute', top: -120, right: -120, width: 360, height: 360, borderRadius: '50%', background: 'hsl(18, 55%, 55%)', opacity: 0.18 }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'hsl(40, 70%, 60%)', opacity: 0.15 }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'hsl(18, 55%, 55%)', padding: '10px 22px', borderRadius: 999, fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            <span style={{ fontSize: 28 }}>🎁</span> Kit Especial
          </div>
          <h1 style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.05, margin: '36px 0 16px', letterSpacing: -1, color: 'hsl(40, 35%, 97%)', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            {nome}
          </h1>
          {descricao && (
            <p style={{ fontSize: 28, lineHeight: 1.4, opacity: 0.92, margin: 0, maxWidth: 820 }}>{descricao}</p>
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', borderRadius: 32, padding: '36px 44px', border: '2px solid rgba(255, 255, 255, 0.18)' }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 20 }}>O que vem no kit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...itensReceitas, ...itensInsumos].slice(0, 6).map((item, i) => (
              <div key={i} style={{ fontSize: 32, fontWeight: 500, display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'hsl(40, 70%, 70%)', minWidth: 70 }}>{item.quantidade}×</span>
                <span style={{ flex: 1 }}>{item.nome}</span>
              </div>
            ))}
            {itens.length > 6 && (
              <div style={{ fontSize: 24, opacity: 0.7, marginTop: 4 }}>+ {itens.length - 6} {itens.length - 6 === 1 ? 'item' : 'itens'}</div>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>Por apenas</div>
            <div style={{ fontSize: 124, fontWeight: 800, lineHeight: 1, color: 'hsl(40, 80%, 75%)', letterSpacing: -2 }}>{formatarCusto(preco)}</div>
            {economiaPct > 0 && (
              <div style={{ fontSize: 24, marginTop: 12, opacity: 0.85, textDecoration: 'line-through' }}>de {formatarCusto(precoIndividual)} avulso</div>
            )}
          </div>
          {economiaPct > 0 && (
            <div style={{ background: 'hsl(18, 65%, 50%)', color: 'white', padding: '24px 32px', borderRadius: 24, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', transform: 'rotate(-4deg)', border: '4px solid hsl(40, 80%, 75%)' }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>VOCÊ ECONOMIZA</div>
              <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, margin: '4px 0' }}>{Math.round(economiaPct)}%</div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 22, opacity: 0.85 }}>
          <span style={{ fontWeight: 600, letterSpacing: 1 }}>🐾 {brandName}</span>
          <span style={{ fontStyle: 'italic' }}>Peça pelo WhatsApp</span>
        </div>
      </div>
    );
  },
);
FestivoTemplate.displayName = 'FestivoTemplate';

/* ============================================================
   TEMPLATE 2 — CLEAN (minimalista creme + verde sálvia)
   ============================================================ */
const CleanTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ nome, descricao, itens, preco, precoIndividual, economiaPct, brandName = 'Confeitaria', format }, ref) => {
    const allItens = itens.slice(0, 6);
    const { width, height } = dimensions(format);
    const isStory = format === 'story';

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          background: 'hsl(40, 35%, 97%)',
          fontFamily: '"Poppins", "Quicksand", sans-serif',
          color: 'hsl(140, 30%, 18%)',
          position: 'relative',
          padding: isStory ? '140px 96px' : 96,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '8px solid hsl(140, 25%, 38%)',
        }}
      >
        {/* Top: brand + label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: 'hsl(140, 25%, 38%)' }}>
            🐾 {brandName}
          </div>
          <div style={{ fontSize: 20, letterSpacing: 6, textTransform: 'uppercase', color: 'hsl(140, 15%, 50%)' }}>
            Kit · Edição Especial
          </div>
        </div>

        {/* Center title */}
        <div style={{ textAlign: 'center', padding: '0 40px' }}>
          <div style={{ width: 80, height: 4, background: 'hsl(18, 55%, 55%)', margin: '0 auto 32px' }} />
          <h1 style={{ fontSize: 110, fontWeight: 300, lineHeight: 1, margin: 0, letterSpacing: -3, color: 'hsl(140, 30%, 22%)' }}>
            {nome}
          </h1>
          {descricao && (
            <p style={{ fontSize: 28, lineHeight: 1.5, opacity: 0.7, margin: '36px auto 0', maxWidth: 760, fontWeight: 300, fontStyle: 'italic' }}>
              {descricao}
            </p>
          )}
          <div style={{ width: 80, height: 4, background: 'hsl(18, 55%, 55%)', margin: '32px auto 0' }} />
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', color: 'hsl(140, 15%, 50%)', marginBottom: 8 }}>
            Composição
          </div>
          {allItens.map((item, i) => (
            <div key={i} style={{ fontSize: 28, fontWeight: 400, color: 'hsl(140, 20%, 30%)' }}>
              {item.quantidade}× {item.nome}
            </div>
          ))}
          {itens.length > 6 && (
            <div style={{ fontSize: 22, opacity: 0.6, fontStyle: 'italic' }}>
              + {itens.length - 6} {itens.length - 6 === 1 ? 'item' : 'itens'}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, letterSpacing: 6, textTransform: 'uppercase', color: 'hsl(140, 15%, 50%)', marginBottom: 12 }}>
            Investimento
          </div>
          <div style={{ fontSize: 144, fontWeight: 200, lineHeight: 1, color: 'hsl(140, 30%, 22%)', letterSpacing: -4 }}>
            {formatarCusto(preco)}
          </div>
          {economiaPct > 0 && (
            <div style={{ marginTop: 20, fontSize: 24, color: 'hsl(18, 55%, 45%)', fontWeight: 500 }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 16 }}>
                {formatarCusto(precoIndividual)}
              </span>
              <span>economize {Math.round(economiaPct)}%</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 22, color: 'hsl(140, 15%, 50%)', letterSpacing: 2, fontStyle: 'italic' }}>
          Peça pelo WhatsApp
        </div>
      </div>
    );
  },
);
CleanTemplate.displayName = 'CleanTemplate';

/* ============================================================
   TEMPLATE 3 — COLORIDO (vibrante e divertido)
   ============================================================ */
const ColoridoTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ nome, descricao, itens, preco, precoIndividual, economiaPct, brandName = 'Confeitaria' }, ref) => {
    const allItens = itens.slice(0, 5);

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: 'linear-gradient(135deg, hsl(340, 80%, 68%) 0%, hsl(40, 95%, 62%) 50%, hsl(160, 70%, 55%) 100%)',
          fontFamily: '"Poppins", "Quicksand", sans-serif',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          padding: 70,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Confetti dots */}
        {[
          { top: 80, left: 60, size: 60, color: 'hsl(280, 80%, 65%)' },
          { top: 140, right: 90, size: 40, color: 'hsl(50, 100%, 70%)' },
          { top: 320, left: 40, size: 30, color: 'hsl(200, 90%, 65%)' },
          { bottom: 220, right: 50, size: 50, color: 'hsl(340, 90%, 70%)' },
          { bottom: 100, left: 80, size: 35, color: 'hsl(120, 70%, 60%)' },
          { top: 500, right: 30, size: 25, color: 'hsl(20, 95%, 65%)' },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: d.color,
              opacity: 0.55,
              ...d,
            }}
          />
        ))}

        {/* Header chip */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'white', color: 'hsl(340, 80%, 50%)', padding: '14px 36px', borderRadius: 999, fontSize: 26, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }}>
            🎉 Combo Especial 🎉
          </div>
        </div>

        {/* Title in card */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 40, background: 'white', borderRadius: 36, padding: '40px 50px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)', textAlign: 'center', transform: 'rotate(-1.5deg)' }}>
          <h1 style={{ fontSize: 84, fontWeight: 900, lineHeight: 1.05, margin: 0, letterSpacing: -2, background: 'linear-gradient(90deg, hsl(340, 80%, 55%), hsl(20, 90%, 55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {nome}
          </h1>
          {descricao && (
            <p style={{ fontSize: 24, lineHeight: 1.4, color: 'hsl(340, 30%, 35%)', margin: '16px 0 0', fontWeight: 500 }}>
              {descricao}
            </p>
          )}
        </div>

        {/* Items pills */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {allItens.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.92)', color: 'hsl(340, 60%, 35%)', padding: '14px 24px', borderRadius: 999, fontSize: 26, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
              <span style={{ color: 'hsl(20, 90%, 50%)' }}>{item.quantidade}×</span> {item.nome}
            </div>
          ))}
          {itens.length > 5 && (
            <div style={{ background: 'rgba(255,255,255,0.7)', color: 'hsl(340, 50%, 40%)', padding: '14px 24px', borderRadius: 999, fontSize: 24, fontWeight: 700 }}>
              +{itens.length - 5}
            </div>
          )}
        </div>

        {/* Price burst */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
          <div style={{ textAlign: 'center', background: 'white', borderRadius: 40, padding: '36px 56px', boxShadow: '0 16px 40px rgba(0,0,0,0.22)', transform: 'rotate(2deg)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: 'hsl(340, 60%, 50%)', marginBottom: 4 }}>Por apenas</div>
            <div style={{ fontSize: 116, fontWeight: 900, lineHeight: 1, letterSpacing: -3, background: 'linear-gradient(90deg, hsl(340, 80%, 55%), hsl(20, 90%, 55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {formatarCusto(preco)}
            </div>
            {economiaPct > 0 && (
              <div style={{ fontSize: 22, color: 'hsl(140, 50%, 35%)', fontWeight: 700, marginTop: 6 }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 10 }}>{formatarCusto(precoIndividual)}</span>
              </div>
            )}
          </div>
          {economiaPct > 0 && (
            <div style={{ background: 'hsl(50, 100%, 55%)', color: 'hsl(340, 70%, 25%)', width: 200, height: 200, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.25)', transform: 'rotate(-8deg)', border: '6px dashed white' }}>
              <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1 }}>−{Math.round(economiaPct)}%</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, marginTop: 4 }}>OFF</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 32, textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          🐾 {brandName} · Peça pelo WhatsApp 💬
        </div>
      </div>
    );
  },
);
ColoridoTemplate.displayName = 'ColoridoTemplate';
