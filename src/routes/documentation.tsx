import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RiCheckLine, RiClipboardLine, RiFileTextLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/documentation")({ component: DocumentationPage });

const BASE_URL = "https://seu-dominio.com";
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
            Envie vendas de Hotmart ou de qualquer outra plataforma para o LomusTrack usando
            webhooks. Cada evento é direcionado para a conta correta pela combinação do slug do
            webhook com a Credencial de API daquela conta. Esta página é independente e não aparece
            no menu do aplicativo.
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
              Substitua <code>&#123;slug&#125;</code> pelo slug da conta de destino e use uma
              Credencial de API ativa criada nessa mesma conta.
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
              <p className="font-semibold text-foreground">Autenticação obrigatória</p>
              <p className="mt-1 text-muted-foreground">
                O token identifica a conta que receberá o evento. Use sempre o token e o slug
                pertencentes à mesma conta. Nunca coloque o token dentro do JSON ou em uma URL.
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
              Para uma plataforma que não possui um conector próprio, envie os dados no formato
              abaixo para o endpoint <code>/api/webhook/api/&#123;slug&#125;</code>, usando sua
              Credencial de API da conta correspondente.
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
                    ["external_id", "Sim", "ID único da venda na plataforma. Não reutilize."],
                    ["status", "Sim", "approved, pending, refunded, chargeback ou trial."],
                    ["amount", "Sim", "Valor da venda. Use número, sem símbolo de moeda."],
                    ["currency", "Não", "Moeda ISO, por exemplo BRL ou MZN. Padrão: BRL."],
                    ["product_external_id", "Sim", "ID do produto na plataforma de origem."],
                    ["product_name", "Sim", "Nome exibido para o produto."],
                    ["customer_email", "Sim", "E-mail do comprador."],
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
            <CardTitle>4. Exemplo de envio</CardTitle>
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
            <CardTitle>5. Respostas e boas práticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <code className="text-foreground">200</code> — evento recebido e processado.
            </p>
            <p>
              <code className="text-foreground">400</code> — JSON inválido ou plataforma incorreta.
            </p>
            <p>
              <code className="text-foreground">404</code> — slug não encontrado.
            </p>
            <p>
              <code className="text-foreground">401</code> — credencial inválida ou pertencente a
              outra conta.
            </p>
            <p>
              <code className="text-foreground">422</code> — payload não pôde ser convertido.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Envie o mesmo <code>external_id</code> nas atualizações da mesma venda.
              </li>
              <li>Configure reenvio automático somente para erros temporários.</li>
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
