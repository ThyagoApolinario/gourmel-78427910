import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { sugerirUnidade, formatarCusto, calcularCustoUnitario, unidadeLabel } from '@/lib/smart-units';
import { Lightbulb, Calculator } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';

type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un';
type CategoriaInsumo = 'ingrediente' | 'embalagem';

interface InsumoFormData {
  nome: string;
  marca: string;
  fornecedor: string;
  categoria: CategoriaInsumo;
  preco_compra: string;
  peso_volume_embalagem: string;
  unidade_medida: UnidadeMedida;
}

interface InsumoFormProps {
  onSubmit: (data: InsumoFormData) => Promise<void>;
  initialData?: InsumoFormData | null;
  loading?: boolean;
  onCancel?: () => void;
}

const emptyForm: InsumoFormData = {
  nome: '',
  marca: '',
  fornecedor: '',
  categoria: 'ingrediente',
  preco_compra: '',
  peso_volume_embalagem: '',
  unidade_medida: 'g',
};

export function InsumoForm({ onSubmit, initialData, loading, onCancel }: InsumoFormProps) {
  const [form, setForm] = useState<InsumoFormData>(initialData ?? emptyForm);
  const [sugestao, setSugestao] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  useEffect(() => {
    if (form.nome.length >= 3) {
      const s = sugerirUnidade(form.nome);
      if (s) {
        setSugestao(`Sugestão: ${unidadeLabel(s.unidade)} (${s.unidade})${s.pesoSugerido ? ` — embalagem típica: ${s.pesoSugerido}` : ''}`);
      } else {
        setSugestao(null);
      }
    } else {
      setSugestao(null);
    }
  }, [form.nome]);

  const aplicarSugestao = () => {
    const s = sugerirUnidade(form.nome);
    if (s) {
      setForm(prev => ({
        ...prev,
        unidade_medida: s.unidade,
        ...(s.pesoSugerido ? { peso_volume_embalagem: String(s.pesoSugerido) } : {}),
      }));
      setSugestao(null);
    }
  };

  const preco = parseFloat(form.preco_compra) || 0;
  const peso = parseFloat(form.peso_volume_embalagem) || 0;
  const custoUnitario = calcularCustoUnitario(preco, peso);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = (field: keyof InsumoFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{initialData ? 'Editar Insumo' : 'Novo Insumo'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome do Item</Label>
              <Input id="nome" value={form.nome} onChange={e => update('nome', e.target.value)} placeholder="Ex: Farinha de Trigo" required />
              {sugestao && (
                <button type="button" onClick={aplicarSugestao} className="flex items-center gap-2 text-sm text-primary hover:underline mt-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  {sugestao} — <span className="font-medium">aplicar</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" value={form.marca} onChange={e => update('marca', e.target.value)} placeholder="Ex: Dona Benta" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" value={form.fornecedor} onChange={e => update('fornecedor', e.target.value)} placeholder="Ex: Atacadão" />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => update('categoria', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingrediente">🧈 Ingrediente</SelectItem>
                  <SelectItem value="embalagem">📦 Embalagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <Select value={form.unidade_medida} onValueChange={v => update('unidade_medida', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grama (g)</SelectItem>
                  <SelectItem value="kg">Quilograma (kg)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="l">Litro (l)</SelectItem>
                  <SelectItem value="un">Unidade (un)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco" className="flex items-center gap-1.5">Preço de Compra (R$)</Label>
              <Input id="preco" type="number" step="0.01" min="0" value={form.preco_compra} onChange={e => update('preco_compra', e.target.value)} placeholder="0,00" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso" className="flex items-center gap-1.5">
                Peso/Volume da Embalagem <HelpTooltip field="peso_embalagem" />
              </Label>
              <Input id="peso" type="number" step="0.01" min="0" value={form.peso_volume_embalagem} onChange={e => update('peso_volume_embalagem', e.target.value)} placeholder="Ex: 1000" required />
            </div>
          </div>

          {preco > 0 && peso > 0 && (() => {
            // custo_unitario é sempre na unidade base (g, ml, un) — converte para exibição correta
            const unidadeBase: Record<string, string> = { kg: 'g', l: 'ml', g: 'g', ml: 'ml', un: 'un' };
            const fatorConversao: Record<string, number> = { kg: 1000, l: 1000, g: 1, ml: 1, un: 1 };
            const unidadeExibida = unidadeBase[form.unidade_medida];
            const custoNaBase = custoUnitario / fatorConversao[form.unidade_medida];
            return (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Custo unitário:</span>
                <Badge variant="secondary" className="text-sm">
                  {formatarCusto(custoNaBase)} / {unidadeExibida}
                </Badge>
                {form.unidade_medida !== unidadeExibida && (
                  <span className="text-xs text-muted-foreground">
                    (base de cálculo em {unidadeExibida})
                  </span>
                )}
              </div>
            );
          })()}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
