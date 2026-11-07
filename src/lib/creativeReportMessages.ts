const CREATIVE_HISTORY_KEY = "lomustrack-creative-report-history-v1";

const PROFIT_MESSAGES = [
  "O Meta Ads trabalhou mais que você hoje. Seu lucro líquido foi de {currency} {profit} com um retorno de {roi}%. Não mexe em nada para não estragar!",
  "Dia bonito para o caixa: você fechou com {currency} {profit} de lucro e {roi}% de retorno. Hoje o algoritmo jogou no seu time.",
  "A máquina está girando. O resultado de hoje foi {currency} {profit} de lucro líquido, com {roi}% de retorno.",
  "Hoje o tráfego pago pagou a conta. Lucro líquido de {currency} {profit} e retorno de {roi}%. Pode comemorar.",
  "Placar do dia: lucro de {currency} {profit} e retorno de {roi}%. O criativo vencedor merece mais atenção.",
  "Seu anúncio trouxe resultado de verdade: {currency} {profit} de lucro líquido e {roi}% de retorno hoje.",
  "O caixa agradece. Você terminou o dia com {currency} {profit} de lucro e um retorno de {roi}%.",
  "Resultado positivo detectado: {currency} {profit} de lucro líquido. O retorno chegou a {roi}%.",
  "Hoje até o algoritmo acordou querendo trabalhar. Lucro de {currency} {profit} e retorno de {roi}%.",
  "O tráfego pago pagou o almoço e ainda sobrou troco. Lucro líquido: {currency} {profit}.",
  "Mark Zuckerberg recebeu o anúncio, mas quem recebeu o dinheiro foi você. Lucro: {currency} {profit}.",
  "Hoje o caixa sorriu mais que vendedor em dia de comissão. Lucro de {currency} {profit}.",
  "O criativo não só converteu: ele praticamente pediu aumento. Resultado: {currency} {profit} de lucro.",
] as const;

const LOSS_MESSAGES = [
  "A verdade dói: hoje você só deu dinheiro para o Mark Zuckerberg. O prejuízo foi de {currency} {loss}. Hora de pausar esse criativo ruim.",
  "Hoje o tráfego pago ficou mais caro que o retorno. O dia terminou com {currency} {loss} de prejuízo. Revise os criativos.",
  "Alerta no caixa: prejuízo de {currency} {loss} hoje. Antes de aumentar o orçamento, descubra o que parou de funcionar.",
  "O algoritmo não entregou o combinado. Você fechou o dia com {currency} {loss} de prejuízo. Hora de analisar a campanha.",
  "Hoje foi dia de aprender pagando: {currency} {loss} de prejuízo. Pause o que não converte e teste uma nova abordagem.",
  "Resultado abaixo do esperado: {currency} {loss} no vermelho. O próximo passo é cortar o desperdício.",
  "O caixa pediu atenção. O prejuízo de hoje foi de {currency} {loss}. Não escale até encontrar a causa.",
  "Nem todo dia é dia de lucro. Hoje ficaram {currency} {loss} de prejuízo; use os dados para corrigir a rota.",
  "Hoje você patrocinou o café do Mark Zuckerberg. Prejuízo: {currency} {loss}.",
  "O anúncio foi visto, o clique aconteceu, mas o lucro faltou à reunião. Prejuízo: {currency} {loss}.",
  "O caixa entrou no modo novela: muito drama e final triste. Prejuízo de {currency} {loss}.",
  "Hoje o tráfego pago correu uma maratona e chegou sem trazer dinheiro. Prejuízo: {currency} {loss}.",
  "O criativo prometeu ouro e entregou boleto. Resultado do dia: {currency} {loss} de prejuízo.",
] as const;

function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const history = JSON.parse(window.localStorage.getItem(CREATIVE_HISTORY_KEY) || "[]");
    return Array.isArray(history)
      ? history.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function getCreativeReportMessage({
  profit,
  roi,
  currency = "MT",
}: {
  profit: number;
  roi: number;
  currency?: string;
}) {
  const isProfit = profit >= 0;
  const templates = isProfit ? PROFIT_MESSAGES : LOSS_MESSAGES;
  const history = readHistory();
  const available = templates.filter((template) => !history.includes(template));
  const template = (available.length ? available : templates)[
    Math.floor(Math.random() * (available.length || templates.length))
  ];
  const amount = Math.abs(profit).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const message = template
    .replaceAll("{currency}", currency)
    .replace("{profit}", amount)
    .replace("{loss}", amount)
    .replace("{roi}", Math.abs(roi).toFixed(1).replace(".", ","));

  if (typeof window !== "undefined") {
    const nextHistory = [...history.filter((item) => item !== template), template].slice(-6);
    window.localStorage.setItem(CREATIVE_HISTORY_KEY, JSON.stringify(nextHistory));
  }

  return message;
}
