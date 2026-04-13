import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HELP_TOPICS, CATEGORIA_LABELS, type HelpTopic } from '@/lib/help-content';
import { Search, BookOpen, HelpCircle } from 'lucide-react';

export default function Ajuda() {
  const [busca, setBusca] = useState('');

  const topicsFiltrados = useMemo(() => {
    if (!busca.trim()) return HELP_TOPICS;
    const q = busca.toLowerCase();
    return HELP_TOPICS.filter(
      t => t.titulo.toLowerCase().includes(q) || t.resumo.toLowerCase().includes(q) || t.conteudo.toLowerCase().includes(q)
    );
  }, [busca]);

  const categorias = useMemo(() => {
    const cats: Record<string, HelpTopic[]> = {};
    for (const t of topicsFiltrados) {
      if (!cats[t.categoria]) cats[t.categoria] = [];
      cats[t.categoria].push(t);
    }
    return cats;
  }, [topicsFiltrados]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Central de Ajuda
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Tire suas dúvidas sobre como usar o sistema e entender cada conceito 💛
          </p>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ajuda... ex: fator de rendimento, margem, preço"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {topicsFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum tópico encontrado para "{busca}"</p>
              <p className="text-sm text-muted-foreground mt-1">Tente buscar com outras palavras 😊</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(categorias).map(([cat, topics]) => (
            <div key={cat} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {CATEGORIA_LABELS[cat] || cat}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Accordion type="multiple" className="w-full">
                    {topics.map(topic => (
                      <AccordionItem key={topic.id} value={topic.id} className="border-b last:border-b-0">
                        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                          <div className="flex flex-col items-start text-left">
                            <span>{topic.titulo}</span>
                            <span className="text-xs text-muted-foreground font-normal">{topic.resumo}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                            {topic.conteudo}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
