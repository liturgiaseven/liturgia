export const SERVICES = [
  {
    id: 'escola-sabatina',
    name: 'Escola Sabatina',
    shortName: 'Sabatina',
    timeRange: '09:00 – 10:15',
    color: 'blue',
    segments: [
      {
        id: 'es-abertura',
        name: 'Abertura',
        duration: 10,
        description: 'Cânticos espirituais, leitura de um texto bíblico e Oração de Abertura.',
        tips: [
          'Exibir letra dos cânticos na tela',
          'Preparar texto bíblico para exibição',
          'Microfone do dirigente ativo',
        ],
        icon: 'music',
        hymnCategory: 'abertura',
      },
      {
        id: 'es-informativo',
        name: 'Informativo Mundial',
        duration: 10,
        description: 'Relatório ou vídeo sobre missões adventistas em outros países.',
        tips: [
          'Reproduzir vídeo do Informativo Mundial',
          'Verificar volume do áudio',
          'Tela cheia para o vídeo',
        ],
        icon: 'globe',
      },
      {
        id: 'es-classes',
        name: 'Classes de Estudo',
        duration: 45,
        description: 'Divisão dos membros em grupos menores para debater o tema da semana da Lição da Escola Sabatina.',
        tips: [
          'Exibir número e título da lição da semana',
          'Tocar música ambiente suave (opcional)',
          'Cronômetro visível para os grupos',
        ],
        icon: 'book',
      },
      {
        id: 'es-avisos',
        name: 'Avisos e Encerramento',
        duration: 10,
        description: 'Intervalo rápido para avisos, recepção de visitantes e encerramento da Escola.',
        tips: [
          'Exibir slides de avisos',
          'Preparar slide de boas-vindas para visitantes',
          'Anunciar início do Culto Divino',
        ],
        icon: 'megaphone',
      },
    ],
  },
  {
    id: 'culto-divino',
    name: 'Culto Divino',
    shortName: 'Culto',
    timeRange: '10:30 – 12:00',
    color: 'purple',
    segments: [
      {
        id: 'cd-adoracao-infantil',
        name: 'Adoração Infantil',
        duration: 10,
        description: 'Momento especial dedicado às crianças antes de irem para a classe infantil.',
        tips: [
          'Preparar vídeo ou apresentação infantil',
          'Microfone do líder de crianças ativo',
          'Iluminação adequada para as crianças',
        ],
        icon: 'star',
      },
      {
        id: 'cd-louvor',
        name: 'Momento de Louvor',
        duration: 15,
        description: 'Cânticos congregacionais liderados pelo ministério de música da igreja.',
        tips: [
          'Exibir letra dos hinos/cânticos',
          'Balancear som da banda e vocais',
          'Câmeras focadas no ministério de música',
        ],
        icon: 'music',
        hymnCategory: 'louvor',
      },
      {
        id: 'cd-ofertorio',
        name: 'Ofertório e Dízimo',
        duration: 10,
        description: 'Coleta de ofertas e dízimos com cântico de gratidão.',
        tips: [
          'Exibir verso bíblico sobre mordomia',
          'Música de fundo suave',
          'Anunciar forma de contribuição (PIX, envelope)',
        ],
        icon: 'heart',
        hymnCategory: 'ofertorio',
      },
      {
        id: 'cd-oracao',
        name: 'Oração Intercessória',
        duration: 10,
        description: 'Oração de joelhos pela congregação, pedidos especiais e enfermos.',
        tips: [
          'Diminuir iluminação do templo',
          'Silêncio – desligar microfones desnecessários',
          'Slide com "Momento de Oração" na tela',
        ],
        icon: 'pray',
        hymnCategory: 'oracao',
      },
      {
        id: 'cd-mensagem-musical',
        name: 'Mensagem Musical',
        duration: 5,
        description: 'Apresentação especial de um hino ou música pelo coral ou solista.',
        tips: [
          'Microfone(s) dos apresentadores ativos',
          'Sem texto na tela – foco na música',
          'Câmera no palco/solista',
        ],
        icon: 'microphone',
        hymnCategory: 'especial',
      },
      {
        id: 'cd-sermao',
        name: 'Sermão',
        duration: 35,
        description: 'Exposição da Palavra de Deus pelo pastor ou pregador convidado.',
        tips: [
          'Projetar slides da mensagem (PowerPoint/PDF)',
          'Microfone do pastor ativo',
          'Câmera principal no pregador',
          'Timer visível para o pregador (opcional)',
        ],
        icon: 'book-open',
      },
      {
        id: 'cd-apelo',
        name: 'Apelo e Oração Final',
        duration: 10,
        description: 'Apelo para entrega espiritual, oração final e Bênção Apostólica.',
        tips: [
          'Música de fundo suave para o apelo',
          'Microfone do pastor ativo',
          'Slide com versículo de encerramento',
          'Preparar slides de encerramento / próximos eventos',
        ],
        icon: 'cross',
        hymnCategory: 'apelo',
      },
    ],
  },
]

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
