# 🎨 Como Adicionar Fonte UberMove - LomusTrack

## ✅ Já Configurado no Código

A fonte **UberMove** já está configurada no `src/styles.css`:

```css
/* UberMove como fonte principal */
--font-sans: 'UberMove', 'Inter Variable', system-ui, -apple-system, sans-serif;
```

**Fallback:** Se UberMove não carregar, usa Inter Variable → system-ui → Apple system font.

---

## 📂 Estrutura de Arquivos Necessária

Você precisa criar a pasta `public/fonts/` com os arquivos da fonte UberMove:

```
soclt-main/
├── public/
│   └── fonts/
│       ├── UberMove-Regular.woff2
│       ├── UberMove-Regular.woff
│       ├── UberMove-Medium.woff2
│       ├── UberMove-Medium.woff
│       ├── UberMove-Bold.woff2
│       └── UberMove-Bold.woff
├── src/
│   └── styles.css  ← Já configurado
```

---

## 📥 Como Obter os Arquivos da Fonte

### **Opção 1: Fonte Oficial (Recomendado)**

Se você tem acesso à fonte UberMove oficial da Uber:

1. Baixe os arquivos `.woff2` e `.woff`
2. Coloque na pasta `public/fonts/`

---

### **Opção 2: Converter de TTF/OTF**

Se você tem apenas `.ttf` ou `.otf`:

1. Use um conversor online:
   - https://transfonter.org/ (recomendado)
   - https://cloudconvert.com/ttf-to-woff2

2. Configurações no Transfonter:
   - ✅ WOFF2
   - ✅ WOFF
   - ✅ Add local() rules
   - ✅ Base64 encode: OFF
   - ✅ Autohint font: ON

3. Faça o download do ZIP gerado

4. Extraia e coloque os arquivos `.woff2` e `.woff` em `public/fonts/`

---

### **Opção 3: Usar Fonte Similar (Fallback)**

Se não conseguir a fonte UberMove, use uma alternativa similar:

**Fontes parecidas com UberMove:**
- **Inter** (já inclusa no projeto)
- **DM Sans** 
- **Manrope**
- **Plus Jakarta Sans**

Para usar outra fonte, modifique em `src/styles.css`:

```css
/* Trocar UberMove por outra fonte */
--font-sans: 'DM Sans', 'Inter Variable', system-ui, sans-serif;
```

E instale via npm:
```bash
npm install @fontsource-variable/dm-sans
```

Depois importe no `styles.css`:
```css
@import "@fontsource-variable/dm-sans";
```

---

## 🎯 Pesos de Fonte Configurados

| Peso | Nome | Uso |
|------|------|-----|
| 400 | Regular | Texto normal |
| 500 | Medium | Botões, labels |
| 700 | Bold | Títulos, destaques |

---

## 🧪 Testar se a Fonte Carregou

Depois de adicionar os arquivos, abra o DevTools do navegador:

### 1. Console:
```javascript
document.fonts.check('1em UberMove')
```

**Resultado esperado:** `true`

---

### 2. Network Tab:
Procure por requisições para `/fonts/UberMove-*.woff2`

**Status esperado:** `200 OK`

---

### 3. Computed Styles:
Inspecione um elemento de texto e veja se `font-family` mostra:
```
font-family: UberMove, Inter Variable, system-ui, -apple-system, sans-serif;
```

---

## 📁 Criar Pasta e Adicionar Arquivos

Execute no terminal (PowerShell):

```powershell
# Criar pasta fonts
New-Item -Path "public/fonts" -ItemType Directory -Force

# Copiar arquivos da fonte UberMove para a pasta
# (substitua o caminho de origem pelos arquivos reais)
Copy-Item "C:\Downloads\UberMove-*.woff*" -Destination "public/fonts/"
```

---

## ✅ Checklist

- [ ] Criar pasta `public/fonts/`
- [ ] Adicionar arquivos `.woff2` e `.woff`
- [ ] Verificar nomes dos arquivos:
  - `UberMove-Regular.woff2`
  - `UberMove-Regular.woff`
  - `UberMove-Medium.woff2`
  - `UberMove-Medium.woff`
  - `UberMove-Bold.woff2`
  - `UberMove-Bold.woff`
- [ ] Fazer build do projeto: `npm run build`
- [ ] Testar no navegador
- [ ] Verificar no DevTools se carregou

---

## 🚀 Depois de Adicionar

1. **Build do projeto:**
```bash
npm run build
```

2. **Dev mode (testar localmente):**
```bash
npm run dev
```

3. **Deploy:**
Faça deploy normalmente. Os arquivos em `public/` são servidos estaticamente.

---

## 🎨 Customizar Pesos

Se você quiser adicionar mais pesos (Light, Black, etc.):

```css
@font-face {
  font-family: 'UberMove';
  src: url('/fonts/UberMove-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'UberMove';
  src: url('/fonts/UberMove-Black.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
```

---

## 🔧 Troubleshooting

### Fonte não aparece

**Verificar:**
1. Arquivos estão em `public/fonts/`? ✅
2. Nomes dos arquivos estão corretos? ✅
3. Build foi feito depois de adicionar? ✅
4. Console do navegador mostra erro 404? ❌

---

### Fonte carrega mas não aplica

**Verificar:**
1. `--font-sans` está definido corretamente em `styles.css`? ✅
2. Elemento tem classe `font-sans` ou herda de `html`? ✅
3. Algum CSS inline sobrescreve? ❌

---

## 📖 Documentação Relacionada

- **styles.css** - Configuração de fontes
- **Tailwind CSS** - Utilitários de tipografia

---

**Status:** ✅ Código configurado, falta apenas adicionar os arquivos da fonte!
