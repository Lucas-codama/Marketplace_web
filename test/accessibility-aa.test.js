import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), 'utf8');
const listar = (pasta, extensao) => fs.readdirSync(path.join(raiz, pasta), { recursive: true })
  .filter((arquivo) => arquivo.endsWith(extensao))
  .map((arquivo) => path.join(pasta, arquivo));

function luminancia(hex) {
  const canais = hex.match(/[a-f\d]{2}/gi).map((valor) => Number.parseInt(valor, 16) / 255);
  const linear = canais.map((valor) => valor <= 0.04045 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contraste(frente, fundo) {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('todas as views EJS compilam', () => {
  for (const arquivo of listar('views', '.ejs')) {
    assert.doesNotThrow(() => ejs.compile(ler(arquivo), { filename: path.join(raiz, arquivo) }), arquivo);
  }
});

test('1.3.4 não restringe orientação de tela', () => {
  const layout = ler('views/layout.ejs');
  const fontes = [layout, ler('public/css/estilo.css'), ...listar('public/js', '.js').map(ler)].join('\n');
  assert.match(layout, /width=device-width, initial-scale=1/);
  assert.doesNotMatch(layout, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.doesNotMatch(fontes, /screen\.orientation\.lock|orientation\s*:\s*(portrait|landscape)[^{]*\{[^}]*display\s*:\s*none/is);
});

test('1.4.3 mantém contraste mínimo nas cores textuais principais', () => {
  assert.ok(contraste('#10120e', '#f3f4ed') >= 4.5);
  assert.ok(contraste('#686d63', '#f3f4ed') >= 4.5);
  assert.ok(contraste('#517113', '#f3f4ed') >= 4.5);
  assert.ok(contraste('#167548', '#f3f4ed') >= 4.5);
  assert.ok(contraste('#587700', '#f3f4ed') >= 4.5);
  assert.ok(contraste('#a32118', '#f3f4ed') >= 4.5);
  assert.ok(contraste('#ffffff', '#10120e') >= 4.5);
});

test('1.4.4 permite ampliar texto até 200 por cento sem controles fixos', () => {
  const script = ler('public/js/acessibilidade.js');
  const controller = ler('controllers/acessibilidadeController.js');
  const layout = ler('views/layout.ejs');
  const css = ler('public/css/estilo.css');
  assert.match(script, /ESCALA_MAX\s*=\s*2\s*;/);
  assert.match(controller, /escalaFonte\s*>\s*2/);
  assert.match(script, /localStorage\.setItem\(CHAVE_ARMAZENAMENTO/);
  assert.match(script, /addEventListener\('storage'/);
  assert.match(layout, /localStorage\.getItem\('nxtplay:acessibilidade'\)/);
  assert.doesNotMatch(css, /\.acessibilidade-controle-fonte \.btn\s*\{[^}]*\n\s*height:\s*44px/s);
  assert.match(css, /\.acessibilidade-controle-fonte\s*\{[^}]*flex-wrap:\s*wrap/s);
});

test('1.4.11 dá contraste de 3 para 1 a limites e foco de controles', () => {
  const css = ler('public/css/estilo.css');
  assert.ok(contraste('#686d63', '#ffffff') >= 3);
  assert.ok(contraste('#686d63', '#f3f4ed') >= 3);
  assert.match(css, /--control-border:\s*#686d63/);
  assert.match(css, /\.form-control,[\s\S]*?border-color:\s*var\(--control-border\)/);
  assert.match(css, /\.form-check-input\s*\{[^}]*border-color:\s*var\(--control-border\)/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px solid #fff[^}]*box-shadow:\s*0 0 0 6px #10120e/s);
});

test('1.4.12 aceita espaçamento ampliado sem impedir quebra do texto', () => {
  const css = ler('public/css/estilo.css');
  assert.doesNotMatch(css, /white-space:\s*nowrap/);
  assert.match(css, /\.password-field\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.footer-nav\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.product-card\s*\{[^}]*overflow:\s*visible/s);
});

test('1.4.13 não cria conteúdo adicional apenas por hover ou foco', () => {
  const fontes = [...listar('views', '.ejs').map(ler), ler('public/css/estilo.css'), ...listar('public/js', '.js').map(ler)].join('\n');
  assert.doesNotMatch(fontes, /data-bs-toggle=["'](?:tooltip|popover)|\btitle=["']/i);
  const conteudosGerados = [...ler('public/css/estilo.css').matchAll(/^\s*content:\s*([^;]+);/gm)].map((item) => item[1].trim());
  assert.ok(conteudosGerados.every((valor) => valor === "''" || valor === '""'));
});

test('2.4.5 oferece navegação principal, complementar e mapa do site', () => {
  const layout = ler('views/layout.ejs');
  const rotas = ler('routes/index.js');
  const mapa = ler('views/mapa-do-site.ejs');
  assert.match(rotas, /router\.get\('\/mapa-do-site'/);
  assert.equal((layout.match(/href="\/mapa-do-site"/g) || []).length, 2);
  assert.match(layout, /aria-label="Navegação complementar"/);
  assert.match(mapa, /Área do cliente/);
  assert.match(mapa, /Área do vendedor/);
  assert.match(mapa, /Administração/);
  assert.match(mapa, /produtos\.forEach/);
  assert.match(mapa, /vendedores\.forEach/);
});

test('2.4.6 e 2.4.7 mantêm títulos, rótulos e foco descritivos', () => {
  const paginas = listar('views', '.ejs').filter((arquivo) => !arquivo.includes('partials') && arquivo !== 'views\\layout.ejs' && arquivo !== 'views/layout.ejs');
  for (const arquivo of paginas) assert.match(ler(arquivo), /<h1\b/i, `${arquivo} precisa de h1`);
  const tabelas = listar('views', '.ejs').map(ler).join('\n').match(/<div class="table-shell"[^>]*>/g) || [];
  assert.ok(tabelas.length > 0);
  assert.ok(tabelas.every((tabela) => /role="region"/.test(tabela) && /aria-label="[^"]+"/.test(tabela) && /tabindex="0"/.test(tabela)));
  const css = ler('public/css/estilo.css');
  assert.match(css, /:where\(a, button, input, select, textarea, \[tabindex\]\):focus-visible/);
  assert.doesNotMatch(css, /:focus(?:-visible)?\s*\{[^}]*outline:\s*(?:0|none)(?:\s*!important)?\s*;/s);
});

test('3.1.2 identifica o idioma da página e de trechos estrangeiros', () => {
  const views = listar('views', '.ejs').map(ler).join('\n');
  assert.match(ler('views/layout.ejs'), /<html lang="pt-BR"/);
  assert.match(ler('views/vendedor/painel.ejs'), /<span lang="en">NXT Seller<\/span>/);
  assert.doesNotMatch(views, />[^<]*\b(?:marketplace|setup|checkout)\b[^<]*</i);
});

test('3.2.3 e 3.2.4 usam navegação e identificação consistentes', () => {
  const layout = ler('views/layout.ejs');
  const views = listar('views', '.ejs').map(ler).join('\n');
  assert.equal((views.match(/aria-label="Navegação principal"/g) || []).length, 1);
  assert.match(layout, />Notificações <span id="contadorNotificacoes"/);
  assert.doesNotMatch(layout, />Avisos\b/);
  assert.doesNotMatch(views, />\s*Username\s*</i);
  const botoesSenha = views.match(/data-password-toggle[^>]*>Mostrar senha<\/button>/g) || [];
  assert.equal(botoesSenha.length, 6);
});

test('3.3.3 fornece sugestões conhecidas para corrigir erros', () => {
  const autenticacao = ler('controllers/authController.js');
  const perfil = ler('controllers/perfilController.js');
  const operacoes = [
    ler('controllers/adminController.js'),
    ler('controllers/vendedorController.js'),
    ler('services/carrinhoService.js'),
    ler('services/checkoutService.js'),
    ler('services/pedidoVendedorService.js')
  ].join('\n');
  assert.match(autenticacao, /como nome@exemplo\.com/);
  assert.match(autenticacao, /Digite a mesma senha nos campos Senha e Confirmar senha/);
  assert.match(autenticacao, /Verifique o nome de usuário ou e-mail e a senha e tente novamente/);
  assert.match(perfil, /Use somente letras, números e sublinhados/);
  assert.match(perfil, /Digite a mesma senha nos campos Nova senha e Confirmar nova senha/);
  assert.match(operacoes, /Selecione uma forma de pagamento válida: PIX, cartão ou boleto/);
  assert.match(operacoes, /Informe uma quantidade entre 1 e/);
  assert.match(operacoes, /Informe o estoque como um número inteiro igual ou maior que zero/);
  assert.match(operacoes, /Escolha um destes estados/);
  assert.match(operacoes, /Selecione Aprovar ou Ocultar/);
});

test('3.3.8 permite gerenciador, colar e conferir senhas', () => {
  const views = [ler('views/auth/login.ejs'), ler('views/auth/cadastro.ejs'), ler('views/perfil/index.ejs')].join('\n');
  const scripts = listar('public/js', '.js').map(ler).join('\n');
  assert.match(views, /autocomplete="username"/);
  assert.match(views, /autocomplete="current-password"/);
  assert.match(views, /autocomplete="new-password"/);
  assert.doesNotMatch(views + scripts, /(?:onpaste|paste).*preventDefault|preventDefault.*(?:onpaste|paste)/i);
  assert.match(scripts, /data-password-toggle/);
  assert.match(scripts, /campo\.type = mostrar \? 'text' : 'password'/);
});

test('4.1.3 expõe mensagens de status às tecnologias assistivas', () => {
  const app = ler('public/js/app.js');
  const layout = ler('views/layout.ejs');
  const views = listar('views', '.ejs').map(ler).join('\n');
  assert.match(app, /tipo === 'danger' \? 'alert' : 'status'/);
  assert.match(app, /aria-atomic/);
  assert.match(layout, /aria-live="polite" aria-atomic="true"/);
  assert.match(views, /role="status" aria-live="polite" aria-atomic="true"/);
});
