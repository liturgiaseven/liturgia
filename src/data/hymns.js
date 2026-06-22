// Biblioteca de hinos sugeridos por momento da liturgia.
//
// IMPORTANTE sobre as letras:
// - As letras semeadas aqui são de hinos clássicos de domínio público.
// - Traduções de hinário podem variar; o operador pode EDITAR qualquer letra
//   diretamente no app (as alterações ficam salvas no navegador via localStorage).
// - Hinos sem letra (lyrics: null) servem como sugestão — basta colar a letra
//   oficial do seu hinário no app.

export const HYMN_CATEGORIES = {
  abertura: 'Abertura / Entrada',
  louvor: 'Louvor Congregacional',
  ofertorio: 'Ofertório e Gratidão',
  oracao: 'Oração / Consagração',
  especial: 'Mensagem Musical',
  apelo: 'Apelo / Encerramento',
}

export const HYMNS = {
  abertura: [
    {
      id: 'castelo-forte',
      title: 'Castelo Forte',
      number: '416',
      lyrics:
        'Castelo forte é nosso Deus,\n' +
        'Espada e bom escudo;\n' +
        'Com seu poder defende os seus\n' +
        'Em todo transe agudo.\n' +
        'Com fúria pertinaz\n' +
        'Persegue Satanás,\n' +
        'Com artimanha e poder;\n' +
        'Ninguém no mundo há\n' +
        'Que possa resistir.',
    },
    { id: 'cantai-alegres', title: 'Cantai Alegres ao Senhor', number: null, lyrics: null },
    { id: 'vinde-cristaos', title: 'Vinde, Cristãos, Cantai', number: null, lyrics: null },
    { id: 'cante-a-gloria', title: 'Cantemos a Glória do Senhor', number: null, lyrics: null },
  ],
  louvor: [
    { id: 'grandioso-es-tu', title: 'Grandioso És Tu', number: '12', lyrics: null },
    {
      id: 'saudai-o-nome',
      title: 'Saudai o Nome de Jesus',
      number: null,
      lyrics:
        'Saudai o nome de Jesus!\n' +
        'Arcanjos, adorai!\n' +
        'Trazei a régia coroa, pois\n' +
        'Ele é o Rei, coroai!\n' +
        'Trazei a régia coroa, pois\n' +
        'Ele é o Rei, coroai!',
    },
    { id: 'que-seguranca', title: 'Que Segurança! (Blessed Assurance)', number: null, lyrics: null },
    { id: 'porque-ele-vive', title: 'Porque Ele Vive', number: null, lyrics: null },
    { id: 'a-deus-demos-gloria', title: 'A Deus Demos Glória', number: null, lyrics: null },
  ],
  ofertorio: [
    { id: 'tudo-entregarei', title: 'Tudo Entregarei', number: null, lyrics: null },
    { id: 'tomas-senhor', title: 'Toma, Senhor, e Usa-me', number: null, lyrics: null },
    { id: 'rios-de-bencao', title: 'Rios de Bênçãos', number: null, lyrics: null },
    { id: 'de-tudo-quanto-tens', title: 'De Tudo Quanto Tens, Dá a Deus', number: null, lyrics: null },
  ],
  oracao: [
    {
      id: 'mais-perto',
      title: 'Mais Perto Quero Estar',
      number: null,
      lyrics:
        'Mais perto quero estar,\n' +
        'Meu Deus, de Ti;\n' +
        'Ainda que uma cruz\n' +
        'Me leve a Ti.\n' +
        'Sempre hei de suplicar:\n' +
        'Mais perto quero estar,\n' +
        'Mais perto, ó Pai, de Ti,\n' +
        'Mais perto, sim.',
    },
    { id: 'doce-oracao', title: 'Doce Momento de Oração', number: null, lyrics: null },
    { id: 'busca-primeiro', title: 'Buscai Primeiro o Reino de Deus', number: null, lyrics: null },
    { id: 'quao-doce', title: 'Quão Doce a Comunhão', number: null, lyrics: null },
  ],
  especial: [
    { id: 'gratidao', title: '(Mensagem musical — escolha do ministério)', number: null, lyrics: null },
  ],
  apelo: [
    {
      id: 'tal-qual-estou',
      title: 'Tal Qual Estou (Just As I Am)',
      number: null,
      lyrics:
        'Tal qual estou, sem mais tardar,\n' +
        'Do mal querendo me livrar,\n' +
        'Ó Cordeiro de Deus, eu vou,\n' +
        'Eu vou a Ti, tal qual estou.',
    },
    { id: 'vem-a-jesus', title: 'Vem a Jesus', number: null, lyrics: null },
    { id: 'ouco-tua-voz', title: 'Ouço, Senhor, a Tua Voz', number: null, lyrics: null },
    { id: 'rude-cruz', title: 'Na Velha e Rude Cruz', number: null, lyrics: null },
  ],
}
