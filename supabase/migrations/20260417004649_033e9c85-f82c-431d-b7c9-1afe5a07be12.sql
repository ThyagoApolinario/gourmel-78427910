
UPDATE public.configuracoes_financeiras
SET pro_labore = 3000, horas_mes = 160, impostos = 0, margem_desejada = 50
WHERE user_id = 'afc96ee7-0fb3-49ef-9b15-f4bd08326177';

UPDATE public.metodos_pagamento
SET taxa_percentual = 12
WHERE id = '8d61e869-8cc3-45fc-8337-999724f5aaa6';
