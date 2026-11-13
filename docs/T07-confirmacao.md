# T07 — confirmação e despacho na simulação

- O despacho ocorre às quintas-feiras (`config.dispatchDay = 4`).
- `config.dispatchThursdayCutoffHour = null` mantém pedidos feitos na própria quinta no ciclo da semana seguinte, pois a operação ainda não definiu um horário-limite.
- Quando a operação definir o corte, configure uma hora inteira de 0 a 23. Na quinta, antes dessa hora o despacho pode ser no mesmo dia; a partir dela, segue para a semana seguinte. A simulação usa o horário local do dispositivo.
- A data de despacho não é uma previsão de chegada. Não há cálculo de chegada nesta tela.
- A edição de endereço/contato é provisória até o envio. Cancelar o formulário descarta o rascunho. A confirmação do pedido persiste os dados no cadastro e no snapshot do pedido na mesma transação das reservas, itens, histórico inicial e limpeza da seleção.
- O envio é bloqueado por referência síncrona durante a operação e após o commit. Uma falha posterior de atualização do contexto de perfil não permite reenviar um pedido já confirmado.
