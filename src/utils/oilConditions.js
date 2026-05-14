// Reference data for blotter spot test interpretation
// Based on ASTM D7843 and field tribology practice

export const OIL_CONDITIONS = {
  bom: {
    label: 'Bom Estado',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-500',
    icon: '✓',
    description: 'Óleo em condições adequadas de operação. Continue monitorando no próximo intervalo.'
  },
  atencao: {
    label: 'Atenção',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-500',
    icon: '⚠',
    description: 'Sinais de degradação detectados. Aumente a frequência de monitoramento e considere análise laboratorial.'
  },
  critico: {
    label: 'Crítico',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500',
    icon: '✕',
    description: 'Óleo com degradação severa ou contaminação crítica. Troca imediata recomendada.'
  }
}

export const CONTAMINANT_INFO = {
  agua: {
    name: 'Água / Umidade',
    icon: '💧',
    dangerLevel: 'alta',
    educationalNote: 'A presença de água provoca corrosão, reduz a película lubrificante e pode causar falha catastrófica em rolamentos. No papel, aparece como halo branco-leitoso externo.'
  },
  fuligem: {
    name: 'Fuligem / Carbono',
    icon: '⬛',
    dangerLevel: 'media',
    educationalNote: 'Indica combustão incompleta ou contaminação por gás blow-by. O núcleo central fica muito escuro e denso, sem difusão clara.'
  },
  oxidacao: {
    name: 'Oxidação',
    icon: '🟤',
    dangerLevel: 'media',
    educationalNote: 'O óleo oxidado perde viscosidade e capacidade de proteção. A mancha fica marrom-escura uniforme, geralmente com borda irregular.'
  },
  metalico: {
    name: 'Partículas Metálicas',
    icon: '⚙️',
    dangerLevel: 'alta',
    educationalNote: 'Indicam desgaste abrasivo em curso. Aparecem como pontos escuros ou cinza-prateados dispersos na mancha. Exige análise espectrométrica urgente.'
  },
  aditivos: {
    name: 'Depleção de Aditivos',
    icon: '📉',
    dangerLevel: 'baixa',
    educationalNote: 'Os aditivos antidesgaste e antioxidantes se esgotaram. O anel de difusão fica pálido e sem diferenciação clara das zonas.'
  }
}

export const SPOT_TEST_ZONES = [
  {
    zone: 'Núcleo Central',
    description: 'Concentração de partículas insolúveis e contaminantes pesados. Raio: ~20-30% da mancha total.',
    healthy: 'Marrom-âmbar translúcido, difusão uniforme',
    warning: 'Marrom escuro com bordas irregulares',
    critical: 'Preto denso, sem difusão'
  },
  {
    zone: 'Anel de Difusão',
    description: 'Zona de migração dos aditivos e óleo base. Indica qualidade dos aditivos dispersantes.',
    healthy: 'Âmbar claro, gradiente suave',
    warning: 'Cor irregular, gradiente abrupto',
    critical: 'Ausente ou muito estreito'
  },
  {
    zone: 'Anel Externo / Halo',
    description: 'Borda da mancha, formada pelo óleo base purificado pela cromatografia.',
    healthy: 'Amarelo-ouro claro, uniforme',
    warning: 'Manchas brancas (água) ou cinzas',
    critical: 'Ausente, deformado ou com precipitados'
  }
]

export function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function getConditionFromScore(score) {
  if (score >= 70) return 'bom'
  if (score >= 40) return 'atencao'
  return 'critico'
}
