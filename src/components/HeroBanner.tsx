import { useProfile } from '@/hooks/useProfile';
import { Dog, Cake } from 'lucide-react';
import heroCanine from '@/assets/hero-canine.jpg';

export default function HeroBanner() {
  const { profile, labels } = useProfile();

  return (
    <section className="relative overflow-hidden rounded-xl mb-6">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroCanine}
          alt="Confeitaria canina natural — ingredientes frescos e biscoitos artesanais"
          className="w-full h-full object-cover"
          width={1920}
          height={768}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          {profile === 'canine' ? (
            <Dog className="h-8 w-8 text-accent" />
          ) : (
            <Cake className="h-8 w-8 text-accent" />
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            {profile === 'canine' ? 'Sem Glúten • Sem Corantes' : 'Artesanal'}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 font-['Poppins']">
          {labels.heroTitle}
        </h1>

        <p className="text-base md:text-lg text-white/85 leading-relaxed mb-6">
          {labels.heroSubtitle}
        </p>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm text-white font-medium">
            🥕 Ingredientes reais
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm text-white font-medium">
            🐾 100% natural
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm text-white font-medium">
            💰 Precificação inteligente
          </span>
        </div>
      </div>
    </section>
  );
}
