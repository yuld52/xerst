# Auditoria: Facebook Ads Data — Verificação End-to-End

**Data:** Junho 2025  
**Escopo:** Fluxo completo frontend → backend → Meta Graph API

---

## Sumário Executivo

O app busca dados do Facebook Ads de forma **substancialmente correta**: campanhas, conjuntos, anúncios e insights são buscados em paralelo via API Graph e cruzados com as transações do banco de dados. O suporte a múltiplas contas, autenticação por token, rate limiting e erros de autenticação todos têm tratamento adequado.

**Há uma lacuna significativa:** os campos `plays_vsl` e `play_rate` são **exibidos na UI** (tabela de campanhas, funil de conversão, tooltip de coluna) mas o backend **sempre retorna `0`** para esses campos em produção. A integração VTurb que os alimenta está implementada (`integrations/vturb/plays_by_utm.py`) mas **nunca é chamada** a partir do endpoint `/campaigns/data`.

Todos os outros dados Meta Ads (spend, impressões, cliques, CTR, CPC, CPA, ROAS, LPV, Initiate Checkout, revenue via pixel, status, orçamento) estão sendo buscados corretamente da API real.

---

## 1. Dados do Facebook Ads Buscados

### Da Meta Graph API (via `integrations/meta_ads/`)

| Nível | Endpoint Graph API | Campos Fetched |
|---|---|---|
| Conta | `act_{id}/insights` | spend, impressions, inline_link_clicks, inline_link_click_ctr, cost_per_unique_inline_link_click, actions (LPV, IC) |
| Conta (diário) | `act_{id}/insights?time_increment=1` | spend, date_start (gasto por dia) |
| Campanha | `act_{id}/campaigns` | id, name, status, daily_budget, lifetime_budget, objective, bid_strategy + insights inline |
| Conjunto (AdSet) | `act_{id}/adsets` | id, name, status, campaign_id, daily_budget, lifetime_budget + insights inline |
| Anúncio (Ad) | `act_{id}/ads` | id, name, status, adset_id + insights inline |
| Conta (info) | `act_{id}` | name, currency |
| Pixel | `act_{id}/adspixels` | id, name, last_fired_time |
| Página FB | `{bm_id}/owned_pages`, `{bm_id}/client_pages`, `/me/accounts` | id, name, picture |
| Instagram | `act_{id}/instagram_accounts` | id, username, profile_picture_url |
| Interesse | `/search?type=adinterest` | id, name, audience_size |
| BM Accounts | `{bm_id}/owned_ad_accounts`, `{bm_id}/client_ad_accounts` | account_id, name, currency |
| Creative (export) | `{creative_id}` | id, name, body, title, url_tags, object_story_spec |

### Campos de insights solicitados por nível

**Campanhas e Conta:**
```
spend, impressions, inline_link_clicks, inline_link_click_ctr,
cost_per_unique_inline_link_click, actions, action_values
```
- `actions`: extrai `landing_page_view`, `omni_initiated_checkout`, `purchase`, `omni_purchase`, `offsite_conversion.fb_pixel_purchase`
- `action_values`: extrai `purchase`, `omni_purchase`, `offsite_conversion.fb_pixel_purchase` (revenue)

**AdSets e Ads** (sem `action_values`):
```
spend, impressions, inline_link_clicks, inline_link_click_ctr,
cost_per_unique_inline_link_click, actions
```

**Data range:** Passado via `time_range: {"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}` como nested field nos requests de campanha/adset/ad. O backend tem `clamp_meta_date()` que limita a 37 meses no passado (limite da API Meta).

---

## 2. Conexão Frontend → Backend

### Endpoints chamados pelo frontend (`src/services/`)

| Serviço | Endpoint | Implementado no Backend? |
|---|---|---|
| `integrations.ts` | `GET /facebook/accounts` | ✅ `api/facebook/accounts.py` |
| `integrations.ts` | `POST /facebook/accounts` | ✅ |
| `integrations.ts` | `DELETE /facebook/accounts/{id}` | ✅ |
| `integrations.ts` | `PATCH /facebook/accounts/{id}/token` | ✅ |
| `integrations.ts` | `POST /facebook/accounts/bulk` | ✅ |
| `integrations.ts` | `POST /facebook/accounts/discover` | ✅ `api/facebook/discover.py` |
| `integrations.ts` | `POST /facebook/accounts/sync` | ✅ |
| `campaigns.ts` | `GET /campaigns/data` | ✅ `api/campaigns/list.py` |
| `campaigns.ts` | `POST /campaigns/toggle` | ✅ `api/campaigns/toggle.py` |
| `campaigns.ts` | `POST /campaigns/budget` | ✅ `api/campaigns/budget.py` |
| `campaigns.ts` | `GET /campaigns/presets` | ✅ `api/campaigns/presets.py` |
| `campaigns.ts` | `POST /campaigns/presets` | ✅ |
| `campaigns.ts` | `PUT /campaigns/presets/{id}` | ✅ |
| `campaigns.ts` | `DELETE /campaigns/presets/{id}` | ✅ |
| `campaigns.ts` | `GET /campaigns/tags` | ✅ `api/campaigns/tags.py` |
| `campaigns.ts` | `PUT /campaigns/tags` | ✅ |
| `campaigns.ts` | `GET /campaigns/filter-options` | ✅ `api/campaigns/filters.py` |
| `campaigns.ts` | `GET /campaigns/markers` | ✅ `api/campaigns/markers.py` |
| `campaigns.ts` | `PUT /campaigns/markers` | ✅ |
| `campaigns.ts` | `DELETE /campaigns/markers/{id}` | ✅ |
| `campaigns.ts` | `GET /campaigns/conversion` | ✅ `api/campaigns/conversion.py` |
| `campaigns.ts` | `GET /campaigns/export-details` | ✅ `api/campaigns/export_details.py` |
| `campaignCreator.ts` | `GET /campaigns/create/pixels` | ✅ `api/campaigns_create/fetch_data.py` |
| `campaignCreator.ts` | `GET /campaigns/create/pages` | ✅ |
| `campaignCreator.ts` | `GET /campaigns/create/interests` | ✅ |
| `campaignCreator.ts` | `POST /campaigns/create/publish` | ✅ `api/campaigns_create/create.py` |
| `campaignCreator.ts` | `POST /campaigns/create/import` | ✅ |
| `integrations.ts` | `POST /campaigns/ai-action` | ✅ `api/campaigns/ai_action.py` |

**Resultado:** Todos os endpoints que o frontend chama estão implementados no backend. Nenhum endpoint está quebrado ou faltando.

### Verificação de imports

O frontend usa `src/services/api.ts` → `apiRequest()` para todas as chamadas. Em modo demo (`isImportDemo()`), as chamadas são interceptadas pelo `mockInterceptor.ts`. Em modo produção, o token JWT é lido do cookie `access_token` e enviado no header `Authorization: Bearer`.

---

## 3. Conexão Backend → Facebook API

### Autenticação

- **Armazenamento:** O `access_token` do Facebook é armazenado por conta no banco de dados, tabela `facebook_accounts`, coluna `access_token` (string). Cada conta tem seu próprio token. _(Arquivo: `database/models/facebook_account.py`)_
- **Escopo:** Per-account — cada conta de anúncio tem seu próprio token independente.
- **Passagem:** O token é passado diretamente no parâmetro `access_token` de cada request Graph API (`MetaAdsClient._get()`). _(Arquivo: `integrations/meta_ads/client.py`)_
- **Versão API:** `v25.0` (configurável via `META_GRAPH_API_VERSION` env var).

### Requests feitos ao Meta Graph API

Todos os requests de dados de campanha usam **nested fields** (1 request por entidade em vez de 2):

```
GET /act_{id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,
  objective,bid_strategy,insights.time_range({"since":"...","until":"..."}){
    spend,impressions,inline_link_clicks,inline_link_click_ctr,
    cost_per_unique_inline_link_click,actions,action_values
  }&limit=200
```

Semelhante para `/adsets` e `/ads`. Paginação automática via `_get_all_pages()` com cursor-based pagination (`paging.next`).

### Campos corretos solicitados?

| Campo UI | Campo Graph API | ✓/✗ |
|---|---|---|
| Spend | `spend` | ✅ |
| Impressions | `impressions` | ✅ |
| Clicks | `inline_link_clicks` | ✅ |
| CTR | `inline_link_click_ctr` | ✅ |
| CPC | `cost_per_unique_inline_link_click` | ✅ |
| LPV | `actions[landing_page_view]` | ✅ |
| Initiate Checkout | `actions[omni_initiated_checkout]` | ✅ |
| Revenue | `action_values[purchase/omni_purchase/offsite_conversion.fb_pixel_purchase]` | ✅ |
| Sales (count) | `actions[purchase/omni_purchase/offsite_conversion.fb_pixel_purchase]` | ✅ |
| ROAS | Calculado: revenue / spend | ✅ |
| CPA | Calculado: spend / sales | ✅ |
| Connect Rate | Calculado: (LPV / clicks) × 100 | ✅ |
| Budget | `daily_budget` ou `lifetime_budget` (÷ 100, Meta retorna centavos) | ✅ |
| Status | `status` | ✅ |
| Objective | `objective` | ✅ |
| Bid Strategy | `bid_strategy` | ✅ |

### Date range filtering

Passado como `time_range` JSON no nested field de insights: `{"since": "YYYY-MM-DD", "until": "YYYY-MM-DD"}`. O `clamp_meta_date()` garante que `date_start` não ultrapasse 37 meses no passado.  _(Arquivo: `integrations/meta_ads/helpers.py`)_

### Limites e paginação

- Paginação com `limit=200` em campaigns/adsets/ads (paginação automática).
- Cache em memória com TTL de 5 minutos por `(account_id, endpoint, date_start, date_end)`. _(Arquivo: `integrations/meta_ads/cache.py`)_
- Campanhas, adsets e ads são buscados em paralelo via `asyncio.gather()`.

---

## 4. Lacunas de Dados

### ⚠️ GAP CRÍTICO: `plays_vsl` e `play_rate` sempre retornam 0 em produção

**Sintoma:** O frontend exibe colunas "Plays VSL" e "Play Rate" na tabela de campanhas e um estágio "Plays VSL" no funil de conversão. O mock interceptor preenche esses campos com `Math.floor(landingPageViews * 0.42)`. Em produção, o backend retorna `plays_vsl: 0` e `play_rate: 0` para **todas** as campanhas, conjuntos e anúncios.

**Causa:** Em `api/campaigns/merge.py` (linhas 146-147, 195-196, 239-240), os campos são hardcoded:
```python
"plays_vsl": 0,
"play_rate": 0,
```

A integração VTurb que deveria alimentar esses dados (`integrations/vturb/plays_by_utm.py`, função `fetch_vturb_stats_by_campaign`) existe e está implementada completamente, mas **nunca é chamada** a partir do endpoint `/campaigns/data` em `api/campaigns/list.py`.

**Impacto:** O funil de conversão mostra "Plays VSL" como 0 para todos os usuários em produção. A coluna "Play Rate" também está sempre zerada.

**Arquivos afetados:**
- `reference/original-backend/api/campaigns/merge.py` — onde a correção precisa ser feita
- `reference/original-backend/api/campaigns/list.py` — onde `fetch_vturb_stats_by_campaign` precisa ser chamado
- `reference/original-backend/integrations/vturb/plays_by_utm.py` — implementação pronta mas não conectada

### Dados buscados mas não exibidos no frontend

| Campo Backend | Exibido na UI? |
|---|---|
| `bid_strategy` (campanha) | ✅ exibido (export e tabela) |
| `objective` (campanha) | ✅ exibido |
| `account_id` / `account_name` | ✅ filtros de conta |
| Gasto diário por dia (`fetch_daily_spend`) | ✅ dashboard overview |
| `no_id_sales` | ✅ exibido na tabela |
| `views_vsl` (campo em merge.py) | ❌ campo não exibido e sempre 0 — sem propósito |

### Dados somente em mock, não na API

- `plays_vsl` e `play_rate`: mock usa cálculo `landingPageViews * 0.42`; produção retorna 0.
- O mock de `/campaigns/create/pixels`, `/pages`, `/interests` retorna dados fictícios; em produção a API real é chamada.

---

## 5. Tratamento de Erros

### Token expirado ou inválido

**Backend** (`api/campaigns/list.py`):
1. Quando `MetaAdsClient` recebe erro com código Facebook `190`, `102` ou `2500`, lança `MetaAuthError`.
2. O `_fetch_one_account` captura `MetaAuthError`, define `acc.token_valid = False` no banco e retorna `("token_invalid", ...)`.
3. Se **todas** as contas retornaram `token_invalid` e nenhuma campanha veio, o endpoint retorna `{"error": "token_invalid", "campaigns": []}`.
4. Se pelo menos uma conta funciona, as campanhas das contas válidas são retornadas normalmente.
5. `db.commit()` persiste `token_valid = False` para a conta com problema.

**Frontend** (`src/features/lomustrack/campaigns/index.tsx`, linha 85; `dashboard/index.tsx`, linha 26):
- Quando `metaError === "token_invalid"`, um toast permanente aparece com link "Corrigir agora" direcionando para `/facebook-ads` onde o token pode ser atualizado.

**Restauração do token:** `PATCH /facebook/accounts/{id}/token` restaura `token_valid = True` automaticamente. _(Arquivo: `api/facebook/accounts.py`)_

### Mecanismo de refresh

Não há refresh automático de tokens. O Facebook usa tokens de longa duração (60 dias); quando expiram, o usuário precisa gerar um novo token manualmente no Business Manager e atualizá-lo no app. O app facilita isso com o modal "Atualizar Token".

### Rate limits

Tratamento completo no `MetaAdsClient`:
- Detecta HTTP 429 e erro code `17` (rate limit), `32` (too many calls), `4`.
- Retry com backoff exponencial: 2s, 4s, 8s (máximo 3 tentativas).
- Se o rate limit persiste após 3 tentativas, levanta o erro.
- Implementação idêntica em `MetaAdsClient._request_with_retry()` para GETs e em `_post_with_retry()` para POSTs (toggle/budget). _(Arquivo: `integrations/meta_ads/client.py` e `manage.py`)_

---

## 6. Suporte Multi-Account

**Sim, suportado completamente.**

- O endpoint `/campaigns/data` aceita `account_id` (opcional). Sem ele, agrega dados de **todas** as contas ativas com token válido da empresa.
- Cada conta é buscada em paralelo via `asyncio.gather()` em `api/campaigns/list.py`.
- Os campos `account_id` e `account_name` são preenchidos em cada `CampaignInsights` para identificar a origem.
- Na criação de campanhas (`/campaigns/create/publish`), `account_ids` aceita uma lista; a mesma estrutura é replicada em paralelo em N contas.
- Descoberta de contas via Business Manager (`/facebook/accounts/discover` e `/sync`) busca `owned_ad_accounts` e `client_ad_accounts` com paginação automática.

---

## Conclusões e Recomendações

### 1. Conectar VTurb ao endpoint de campanhas (correção necessária)

Em `api/campaigns/list.py`, após o merge, chamar `fetch_vturb_stats_by_campaign()` para preencher `plays_vsl` e `play_rate` em cada campanha, adset e ad. A lógica de match por `utm_campaign` já está implementada em `plays_by_utm.py`. Sem isso, as colunas "Plays VSL" e "Play Rate" nunca mostrarão dados reais.

**Arquivos:** `api/campaigns/list.py`, `api/campaigns/merge.py`

### 2. Remover campo `views_vsl` do merge.py

O campo `views_vsl` (distinto de `plays_vsl`) é retornado hardcoded como `0` pelo merge mas nunca é exibido no frontend nem está no schema TypeScript. É código morto.

### 3. Revenue e sales em nível de AdSet e Ad

Os campos `revenue` e `sales` em adsets e ads são calculados via cruzamento UTM com transações do banco (não via `action_values` do Meta). O Meta não retorna `action_values` nos níveis adset/ad (apenas no nível campanha). Este comportamento é intencional e correto; a nota é apenas descritiva.

### 4. Nenhum token refresh automático

Aceitável para tokens de 60 dias do Facebook, mas recomendável adicionar uma verificação proativa (ex: notificação quando o token está perto de expirar) para evitar interrupção silenciosa de dados.

### 5. Cache em memória não persiste entre instâncias

O cache (`integrations/meta_ads/cache.py`) é in-process (dicionário Python). Em ambientes serverless (Vercel) com múltiplas instâncias, o cache não é compartilhado. Em cargas altas, isso pode resultar em mais chamadas à Meta API do que o esperado. Recomendável considerar Redis para ambientes com múltiplas instâncias.

---

## Arquivos Citados

| Arquivo | Função |
|---|---|
| `src/services/campaigns.ts` | Tipos e chamadas REST do frontend para campanhas |
| `src/services/integrations.ts` | Chamadas REST de contas Facebook |
| `src/services/campaignCreator.ts` | Chamadas REST do criador de campanhas |
| `src/services/api.ts` | Base `apiRequest()` com modo mock/real |
| `src/services/mockInterceptor.ts` | Dados mock para modo demo |
| `src/features/lomustrack/campaigns/components/funnelStages.ts` | Exibe `plays_vsl` no funil |
| `src/features/lomustrack/campaigns/components/mappers.ts` | Mapeia `plays_vsl`/`play_rate` da API |
| `reference/original-backend/integrations/meta_ads/client.py` | HTTP client com retry e rate limit |
| `reference/original-backend/integrations/meta_ads/service.py` | Fachada Meta Ads + cache |
| `reference/original-backend/integrations/meta_ads/campaigns.py` | Fetch campanhas com insights inline |
| `reference/original-backend/integrations/meta_ads/adsets.py` | Fetch adsets com insights inline |
| `reference/original-backend/integrations/meta_ads/ads.py` | Fetch ads com insights inline |
| `reference/original-backend/integrations/meta_ads/account.py` | Fetch account-level insights + daily spend |
| `reference/original-backend/integrations/meta_ads/schemas.py` | Schemas Pydantic |
| `reference/original-backend/integrations/meta_ads/helpers.py` | `extract_action_value`, `clamp_meta_date` |
| `reference/original-backend/integrations/meta_ads/cache.py` | Cache em memória TTL 5min |
| `reference/original-backend/integrations/meta_ads/manage.py` | Toggle status e update budget |
| `reference/original-backend/integrations/meta_ads/search.py` | Pixels, pages, Instagram, interests |
| `reference/original-backend/integrations/vturb/plays_by_utm.py` | **Implementado mas não chamado** |
| `reference/original-backend/api/campaigns/list.py` | Endpoint principal `/campaigns/data` |
| `reference/original-backend/api/campaigns/merge.py` | Merge Meta + transações (plays_vsl = 0 hardcoded) |
| `reference/original-backend/api/campaigns/conversion.py` | Breakdown por status de transação |
| `reference/original-backend/api/campaigns/export_details.py` | Export de campanha com creatives |
| `reference/original-backend/api/facebook/accounts.py` | CRUD de contas Facebook |
| `reference/original-backend/api/facebook/discover.py` | Discover/sync via Business Manager |
| `reference/original-backend/app.py` | Registro de todos os routers |
