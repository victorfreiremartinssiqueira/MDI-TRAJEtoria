# Registro das telas - Versão do jovem

As dez telas foram aprovadas visualmente durante o planejamento. As imagens de `designs-aprovados/` são as referências de interface.

| Tela | Requisito | Ajustes de programação previstos |
|---|---|---|
| T01 | Identificação e senha, ajuda | login fictício, sem autocadastro |
| T02 | consentimento no primeiro acesso | registra data/versão no SQLite; texto sujeito à validação jurídica |
| T03 | saudação, pedido atual, atalhos | cabeçalho comum e barra fixa; conteúdo adequado ao tamanho do aparelho |
| T04 | catálogo curado, filtros, sem preços | loading/erro/vazio, somente peças disponíveis, filtragem por tamanho |
| T05 | galerias e estado da peça | cada peça é única; tamanhos alternativos não inventados |
| T06 | seleção antes de confirmar | remover e adicionar, limite 5; nenhuma barra de progresso de entrega aqui |
| T07 | endereço e despacho | duas etapas, ícone de caixa em **Enviar pedido**, quinta-feira fixa; entrega não é o despacho |
| T08 | status solicitado/separação/despachado/entregue | lista de itens, histórico, previsão (quando existir), suporte demonstrativo |
| T09 | se cada roupa serviu e se já participou de entrevista | feedback apenas após entrega; dados permanecem gravados |
| TP01 | perfil complementar | consulta apenas, estilo aprovado mais moderno/minimalista |

## Ponto de atenção

Os mockups de design são arte final de referência. A implementação é composta por controles reais e dados persistidos, e pode apresentar diferenças de dimensionamento entre aparelhos. Fotografias de peças são ilustrativas, extraídas dos próprios mockups, ou ilustradas localmente.

A aplicação tem uma única conta de jovem fictícia. As futuras telas T10-T23 não fazem parte deste ZIP; os dados e a estrutura estão organizados para ampliar o projeto em versões posteriores.
