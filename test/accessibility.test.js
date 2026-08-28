import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ejs from 'ejs';

const raiz = process.cwd();
const pastaViews = path.join(raiz, 'views');
const pastaScripts = path.join(raiz, 'public', 'js');

function listarArquivos(pasta, extensao) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(pasta, item.name);
    return item.isDirectory() ? listarArquivos(caminho, extensao) : (caminho.endsWith(extensao) ? [caminho] : []);
  });
}

function conteudo(caminho) {
  return fs.readFileSync(caminho, 'utf8');
}

function relativo(caminho) {
  return path.relative(raiz, caminho);
}

function mascararEjs(texto) {
  return texto.replace(/<%[\s\S]*?%>/g, 'VALOR_EJS');
}

function escaparExpressao(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const views = listarArquivos(pastaViews, '.ejs');
const scripts = listarArquivos(pastaScripts, '.js');

test('todas as views EJS compilam', () => {
  views.forEach((arquivo) => {
    assert.doesNotThrow(() => ejs.compile(conteudo(arquivo), { filename: arquivo }), relativo(arquivo));
  });
});

test('todos os scripts do navegador possuem sintaxe válida', () => {
  scripts.forEach((arquivo) => {
    assert.doesNotThrow(() => new Function(conteudo(arquivo)), relativo(arquivo));
  });
});

test('o layout expõe idioma, título, landmarks e atalho para o conteúdo', () => {
  const html = mascararEjs(conteudo(path.join(pastaViews, 'layout.ejs')));
  assert.match(html, /<html\s+lang="pt-BR"/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /class="skip-link"\s+href="#conteudo-principal"/);
  assert.match(html, /<nav[^>]+aria-label="Navegação principal"/);
  assert.match(html, /<main\s+id="conteudo-principal"[^>]+tabindex="-1"/);
  assert.equal((html.match(/<\/html>/g) || []).length, 1);
});

test('todo conteúdo de imagem tem alternativa textual explícita', () => {
  views.forEach((arquivo) => {
    for (const imagem of mascararEjs(conteudo(arquivo)).matchAll(/<img\b[^>]*>/gi)) {
      assert.match(imagem[0], /\balt="[^"]*"/i, `${relativo(arquivo)}: ${imagem[0]}`);
    }
  });
});

test('controles de formulário possuem nome acessível programático', () => {
  views.forEach((arquivo) => {
    const html = mascararEjs(conteudo(arquivo));
    for (const controle of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
      const marca = controle[0];
      if (/\btype="hidden"/i.test(marca)) continue;
      if (/\baria-label(?:ledby)?="[^"]+"/i.test(marca)) continue;

      const id = marca.match(/\bid="([^"]+)"/i)?.[1];
      const temLabelFor = id && new RegExp(`<label\\b[^>]*\\bfor="${escaparExpressao(id)}"`, 'i').test(html);
      const antes = html.slice(0, controle.index);
      const estaDentroDeLabel = antes.lastIndexOf('<label') > antes.lastIndexOf('</label>');
      assert.ok(temLabelFor || estaDentroDeLabel, `${relativo(arquivo)}: controle sem rótulo — ${marca}`);
    }
  });
});

test('atributos ARIA condicionais não são escapados pelo EJS', () => {
  views.forEach((arquivo) => {
    assert.doesNotMatch(
      conteudo(arquivo),
      /<%=\s*[^%]*\?\s*['"]\s+aria-[^%]*%>/i,
      `${relativo(arquivo)}: use <%- para inserir um atributo ARIA completo`
    );
  });
});

test('tabelas têm nome e cabeçalhos de coluna associados', () => {
  views.forEach((arquivo) => {
    const html = mascararEjs(conteudo(arquivo));
    for (const tabela of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
      assert.match(tabela[1], /<caption\b/i, `${relativo(arquivo)}: tabela sem caption`);
      for (const cabecalho of tabela[1].matchAll(/<th\b[^>]*>/gi)) {
        assert.match(cabecalho[0], /\bscope="(?:col|row|colgroup|rowgroup)"/i, `${relativo(arquivo)}: cabeçalho sem scope`);
      }
    }
  });
});

test('a ordem de leitura e de foco não é artificialmente alterada', () => {
  const css = conteudo(path.join(raiz, 'public', 'css', 'estilo.css'));
  assert.doesNotMatch(css, /\border\s*:\s*-?\d/i);
  assert.doesNotMatch(css, /flex-direction\s*:\s*(?:row|column)-reverse/i);

  views.forEach((arquivo) => {
    const html = mascararEjs(conteudo(arquivo));
    assert.doesNotMatch(html, /tabindex="[1-9]\d*"/i, relativo(arquivo));
  });
});

test('não há ativação no pressionamento nem mudança de contexto ao receber foco', () => {
  [...views, ...scripts].forEach((arquivo) => {
    const texto = conteudo(arquivo);
    assert.doesNotMatch(texto, /(?:mouse|pointer|touch)down|touchstart|onfocus\s*=|focusin/i, relativo(arquivo));
  });
});

test('não há interceptação de teclado capaz de criar bloqueio', () => {
  [...views, ...scripts].forEach((arquivo) => {
    assert.doesNotMatch(conteudo(arquivo), /keydown|keyup|keypress|keyCode|\.key\b/i, relativo(arquivo));
  });
});

test('erros identificados em texto são associados e anunciados', () => {
  const app = conteudo(path.join(pastaScripts, 'app.js'));
  assert.match(app, /className = 'field-error'/);
  assert.match(app, /aria-invalid/);
  assert.match(app, /aria-describedby/);
  assert.match(app, /tipo === 'danger' \? 'alert' : 'status'/);
});

test('estados que usam cor também têm texto visível', () => {
  const notificacoes = conteudo(path.join(pastaViews, 'notificacoes', 'index.ejs'));
  assert.match(notificacoes, /item\.lida \? 'Lida' : 'Não lida'/);
  views.forEach((arquivo) => {
    const html = conteudo(arquivo);
    for (const estado of html.matchAll(/<span\b[^>]*class="[^"]*\bstatus(?:-[^\s"]+)?[^\"]*"[^>]*>([\s\S]*?)<\/span>/gi)) {
      assert.match(estado[1], /\S/, `${relativo(arquivo)}: estado sem texto`);
    }
  });
});
