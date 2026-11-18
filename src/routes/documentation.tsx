import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RiCheckLine, RiClipboardLine, RiFileTextLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/documentation")({ component: DocumentationPage });

const BASE_URL = "https://xerst.vercel.app";
const API_PAYLOAD = `{
  "external_id": "PED-1001",
  "status": "approved",
  "amount": 197.00,
  "currency": "BRL",
  "product_external_id": "PROD-001",
  "product_name": "Curso de Marketing",
  "product_price": 197.00,
  "customer_email": "cliente@exemplo.com",
  "customer_name": "João da Silva",
  "payment_method": "credit_card",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "campanha-principal",
  "utm_content": "criativo-01"
}`;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={copy}>
      {copied ? <RiCheckLine className="size-4" /> : <RiClipboardLine className="size-4" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-end border-b border-border px-2 py-1">
        <CopyButton value={children} />
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function DocumentationPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <RiFileTextLine className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">LomusTrack</p>
              <h1 className="text-3xl font-bold tracking-tight">Documentação de integrações</h1>
            </div>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Envie eventos de compra da Hotmart ou de outra plataforma ao LomusTrack. O slug escolhe
            o endpoint e a conta de destino. Hotmart usa o Hottok configurado nesse endpoint; outras
            plataformas usam uma Credencial de API ativa da mesma conta. Esta página é independente
            e não aparece no menu do aplicativo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">POST</Badge>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              /api/webhook/&#123;plataforma&#125;/&#123;slug&#125;
            </code>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>1. Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              <span className="font-semibold text-foreground">1. Crie um endpoint</span>
              <p>Gere um webhook e copie o slug da integração.</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">2. Configure a plataforma</span>
              <p>Cole a URL no campo de webhook ou postback da sua plataforma.</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">3. Envie o evento</span>
              <p>Envie um POST JSON sempre que uma venda mudar de status.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. URLs por plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Copie o slug do endpoint criado em <strong>Plataformas</strong>. Use a URL completa
              mostrada no painel da conta. Se o domínio do seu LomusTrack for diferente, troque
              apenas <code>{BASE_URL}</code>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Hotmart", `${BASE_URL}/api/webhook/hotmart/{slug}`],
                ["Outras plataformas", `${BASE_URL}/api/webhook/api/{slug}`],
              ].map(([name, url]) => (
                <div key={name} className="rounded-lg border border-border p-4">
                  <p className="mb-2 font-semibold">{name}</p>
                  <code className="break-all text-xs text-muted-foreground">{url}</code>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">Autenticação por integração</p>
              <p className="mt-1 text-muted-foreground">
                Para a API direta, crie uma Credencial de API em <strong>Plataformas</strong> e
                envie-a no cabeçalho abaixo. O token e o slug precisam pertencer à mesma conta. Para
                Hotmart, informe o mesmo Hottok ao criar o endpoint e ao configurar o webhook; a
                Hotmart envia esse valor no cabeçalho X-HOTMART-HOTTOK. Não coloque tokens no JSON
                nem na URL.
              </p>
              <code className="mt-3 block rounded bg-muted px-3 py-2 text-xs">
                Authorization: Bearer SEU_API_TOKEN
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Payload padrão para novas plataformas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para uma plataforma sem conector próprio, envie cada atualização de venda como JSON
              ao endpoint <code>/api/webhook/api/&#123;slug&#125;</code>, usando a Credencial de API
              ativa da mesma conta do endpoint.
            </p>
            <CodeBlock>{API_PAYLOAD}</CodeBlock>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Campo</th>
                    <th className="px-4 py-3">Obrigatório</th>
                    <th className="px-4 py-3">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["external_id", "Sim", "ID único da venda; não repita na mesma conta LomusTrack, mesmo entre plataformas."],
                    ["status", "Sim", "approved, pending, refunded, chargeback ou trial. Valores desconhecidos são rejeitados."],
                    ["amount", "Sim", "Valor numérico da transação na moeda informada, sem símbolo."],
                    ["currency", "Não", "BRL, USD, EUR, MZN/MT, ZAR ou AOA. Padrão: BRL."],
                    ["product_external_id", "Sim", "ID do produto na plataforma de origem."],
                    ["product_name", "Sim", "Nome do produto. O produto pode ser criado automaticamente."],
                    ["customer_email", "Sim", "E-mail válido do comprador."],
                    ["product_price", "Não", "Preço total do produto; se omitido, usa amount."],
                    ["payment_method", "Não", "Método de pagamento, por exemplo credit_card ou pix."],
                    [
                      "utm_*",
                      "Não",
                      "utm_source, utm_medium, utm_campaign, utm_content e utm_term.",
                    ],
                  ].map(([field, required, description]) => (
                    <tr key={field}>
                      <td className="px-4 py-3 font-mono text-xs">{field}</td>
                      <td className="px-4 py-3">{required}</td>
                      <td className="px-4 py-3 text-muted-foreground">{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Hotmart (Webhook 2.0)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Crie um endpoint Hotmart em <strong>Plataformas</strong>, informe o Hottok e copie a
              URL gerada. Na Hotmart, configure a versão 2.0.0 e eventos de pedidos/compra, como
              aprovação, pagamento pendente, cancelamento, reembolso e chargeback. O endpoint valida
              o Hottok recebido em <code>X-HOTMART-HOTTOK</code> e interpreta o envelope
              <code> data</code> da versão 2.0. Eventos de abandono de carrinho não são eventos de
              compra e não devem ser enviados a este endpoint.
            </p>
            <CodeBlock>{`POST ${BASE_URL}/api/webhook/hotmart/SEU_SLUG
X-HOTMART-HOTTOK: SEU_HOTTOK
Content-Type: application/json

{
  "id": "evento-123",
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": { "id": 123, "ucode": "PROD-001", "name": "Curso de Marketing" },
    "buyer": { "name": "João da Silva", "email": "cliente@exemplo.com" },
    "purchase": {
      "transaction": "PED-1001",
      "status": "APPROVED",
      "price": { "value": 197.00, "currency_value": "BRL" },
      "payment": { "type": "PIX" }
    }
  }
}`}</CodeBlock>
            <p>
              Configure os eventos de pedido da Hotmart. O endpoint exige um comprador com e-mail
              válido e uma transação para identificar a venda; payloads de outras categorias podem
              não representar vendas processáveis.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Exemplo de envio pela API</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock>{`curl -X POST "${BASE_URL}/api/webhook/api/SEU_SLUG" \\
  -H "Authorization: Bearer SEU_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${API_PAYLOAD.replaceAll("\n", "\n  ")}'`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Respostas e boas práticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <code className="text-foreground">200</code> — evento recebido e processado.
            </p>
            <p>
              <code className="text-foreground">400</code> — JSON inválido ou plataforma incorreta.
            </p>
            <p>
              <code className="text-foreground">404</code> — combinação de plataforma e slug não encontrada.
            </p>
            <p>
              <code className="text-foreground">401</code> — credencial inválida ou pertencente a
              outra conta.
            </p>
            <p>
              <code className="text-foreground">422</code> — payload não pôde ser convertido.
            </p>
            <p>
              <code className="text-foreground">409</code> — endpoint sem conta de destino válida.
            </p>
            <p>
              <code className="text-foreground">500</code> — falha temporária ao gravar/processar.
              Reenvie o mesmo evento e mantenha o mesmo <code>external_id</code>.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Envie o mesmo <code>external_id</code> nas atualizações da mesma venda.
              </li>
              <li>Reenvie somente quando houver falha; o mesmo ID da venda atualiza o status existente.</li>
              <li>Não envie senhas, tokens privados ou dados de cartão no JSON.</li>
              <li>
                Guarde a Credencial de API em variável de ambiente no sistema que fará o envio.
              </li>
              <li>
                Para várias contas, mantenha um par separado de slug e Credencial de API para cada
                conta.
              </li>
              <li>Teste primeiro com uma venda de baixo valor e confirme no painel de vendas.</li>
            </ul>
          </CardContent>
        </Card>

        <footer className="border-t border-border pt-5 text-xs text-muted-foreground">
          Documentação independente · LomusTrack
        </footer>
      </div>
    </main>
  );
}
