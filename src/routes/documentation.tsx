import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RiCheckLine, RiClipboardLine, RiFileTextLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/documentation")({ component: DocumentationPage });

const BASE_URL = "https://xerst.vercel.app";
const API_TOKEN = "SEU_API_TOKEN";
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
            Envie eventos de compra ao LomusTrack através de uma única URL de API. Use o token de
            autenticação criado em <strong>Plataformas &gt; Credenciais de API</strong> para
            identificar a conta de destino. Esta página é independente e não aparece no menu do
            aplicativo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">POST</Badge>
            <code className="rounded bg-muted px-2 py-1 text-sm">/api/documentation</code>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>1. Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              <span className="font-semibold text-foreground">1. Crie uma credencial</span>
              <p>Gere um token de API em Plataformas e copie o valor.</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">2. Configure sua plataforma</span>
              <p>Use a URL de documentação e o token no cabeçalho de autorização.</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">3. Envie o evento</span>
              <p>Envie um POST JSON sempre que uma venda mudar de status.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. URL de integração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Todas as plataformas usam a mesma URL. Crie uma Credencial de API em{" "}
              <strong>Plataformas</strong> e envie o token no cabeçalho de autorização.
            </p>
            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 font-semibold">URL única para todas as plataformas</p>
              <code className="break-all text-xs text-muted-foreground">
                {BASE_URL}/api/documentation
              </code>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">Autenticação por token</p>
              <p className="mt-1 text-muted-foreground">
                Crie uma Credencial de API em <strong>Plataformas &gt; Credenciais de API</strong>{" "}
                e envie-a no cabeçalho abaixo. O token identifica a conta de destino. Não coloque
                tokens no JSON nem na URL.
              </p>
              <code className="mt-3 block rounded bg-muted px-3 py-2 text-xs">
                Authorization: Bearer {API_TOKEN}
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Payload de integração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie cada atualização de venda como JSON ao endpoint{" "}
              <code>/api/documentation</code>, usando a Credencial de API criada em Plataformas.
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
            <CardTitle>4. Exemplo de envio</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock>{`curl -X POST "${BASE_URL}/api/documentation" \\
  -H "Authorization: Bearer ${API_TOKEN}" \\
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
              <code className="text-foreground">400</code> — JSON inválido ou dados incorretos.
            </p>
            <p>
              <code className="text-foreground">401</code> — token inválido ou inexistente.
            </p>
            <p>
              <code className="text-foreground">422</code> — payload não pôde ser convertido.
            </p>
            <p>
              <code className="text-foreground">500</code> — falha temporária ao gravar/processar.
              Reenvie o mesmo evento e mantenha o mesmo <code>external_id</code>.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Envie o mesmo <code>external_id</code> nas atualizações da mesma venda.
              </li>
              <li>
                Reenvie somente quando houver falha; o mesmo ID da venda atualiza o status
                existente.
              </li>
              <li>Não envie senhas, tokens privados ou dados de cartão no JSON.</li>
              <li>
                Guarde a Credencial de API em variável de ambiente no sistema que fará o envio.
              </li>
              <li>Para várias contas, use um token diferente para cada conta.</li>
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
