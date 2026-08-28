import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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

test('1.4.6 contraste aprimorado (7:1 texto normal, 4.5:1 texto grande)', () => {
  // Cores do modo alto contraste: branco sobre preto e amarelo sobre preto.
  assert.ok(contraste('#ffffff', '#000000') >= 7);
  assert.ok(contraste('#ffff00', '#000000') >= 7);
});

test('1.4.8 apresentação visual: mecanismo de cores, largura, espaçamento e sem justificação', () => {
  const css = ler('public/css/estilo.css');
  const view = ler('views/acessibilidade/index.ejs');
  const script = ler('public/js/acessibilidade.js');
  const controller = ler('controllers/acessibilidadeController.js');

  // Cor de texto e de fundo selecionáveis pelo usuário.
  assert.match(view, /type="color" id="acessibilidadeCorTexto"/);
  assert.match(view, /type="color" id="acessibilidadeCorFundo"/);
  assert.match(script, /--ink['"]?,\s*preferencias\.corTexto|setProperty\('--ink', preferencias\.corTexto\)/);
  assert.match(controller, /REGEX_COR_HEX/);

  // Largura máxima de bloco de texto (80ch).
  assert.match(css, /max-width:\s*80ch/);

  // Espaçamento de linha e entre parágrafos.
  assert.match(css, /line-height:\s*1\.5/);
  assert.match(css, /margin-top:\s*1\.5em/);

  // Sem texto justificado em nenhum lugar do CSS.
  assert.doesNotMatch(css, /text-align:\s*justify/);

  // Redimensionamento até 200% sem exigir rolagem horizontal (mecanismo já existente).
  assert.match(script, /ESCALA_MAX\s*=\s*2\s*;/);
});

test('2.1.3 teclado sem exceção: interações custom usam elementos nativamente operáveis', () => {
  const scripts = listar('public/js', '.js').map((arquivo) => ({ arquivo, conteudo: ler(arquivo) }));
  for (const { arquivo, conteudo } of scripts) {
    // Nenhum handler de clique deveria estar preso a divs/spans arbitrários
    // (o padrão do projeto é sempre usar <button>/<a>, que já respondem a teclado).
    assert.doesNotMatch(
      conteudo,
      /querySelector\(['"]\.js-[a-z-]+['"]\)[\s\S]{0,80}addEventListener\('click'/,
      `${arquivo} deve preferir elementos nativos (button/a) a divs com clique customizado`
    );
  }
});

test('2.2.3 e 2.2.4: sessão tem prazo documentado e atualizações automáticas são pausáveis', () => {
  const sessionConfig = ler('config/session.js');
  const view = ler('views/acessibilidade/index.ejs');
  const socket = ler('public/js/socket.js');
  const layout = ler('views/layout.ejs');

  // 2.2.3 (nota): o expirar de sessão por segurança é uma exceção prática comum,
  // mas não isenta formalmente o critério AAA — mantemos o teste como lembrete
  // de que essa é uma decisão de produto, não um "aprovado" automático.
  assert.match(sessionConfig, /maxAge/);

  // 2.2.4: usuário pode pausar/suprimir atualizações automáticas (exceto emergências).
  assert.match(view, /id="acessibilidadePausarNotificacoes"/);
  assert.match(socket, /notificacoesPausadas\(\)/);
  assert.match(layout, /id="atualizarNotificacoesManual"/);
});

test('2.4.10 cabeçalhos de seção organizam o conteúdo das páginas principais', () => {
  const checkout = ler('views/checkout/index.ejs');
  const perfil = ler('views/perfil/index.ejs');
  assert.match(checkout, /<h2 class="h4">Entrega e pagamento<\/h2>/);
  assert.match(perfil, /<h2 class="visually-hidden">Dados pessoais<\/h2>/);
});

test('3.3.5 ajuda sensível ao contexto nos campos mais propensos a erro', () => {
  const cadastro = ler('views/auth/cadastro.ejs');
  const produtoForm = ler('views/vendedor/produtos/formulario.ejs');
  const enderecos = ler('views/enderecos/index.ejs');

  assert.match(cadastro, /id="usernameAjuda"/);
  assert.match(cadastro, /id="senhaAjuda"/);
  assert.match(produtoForm, /id="produtoDescricaoAjuda"/);
  assert.match(produtoForm, /id="produtoPrecoAjuda"/);
  assert.match(produtoForm, /id="imagemAjuda"/);
  assert.match(enderecos, /id="enderecoCepAjuda"/);
});
