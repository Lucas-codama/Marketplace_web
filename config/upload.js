import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaPublica = path.join(__dirname, '..', 'public');
const pastaProdutos = path.join(pastaPublica, 'uploads', 'produtos');
const extensoes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

fs.mkdirSync(pastaProdutos, { recursive: true });

const storage = multer.diskStorage({
  destination(req, arquivo, callback) {
    callback(null, pastaProdutos);
  },
  filename(req, arquivo, callback) {
    callback(null, `${randomUUID()}${extensoes[arquivo.mimetype]}`);
  }
});

const uploadProduto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, arquivo, callback) {
    if (!extensoes[arquivo.mimetype]) return callback(Object.assign(new Error('Envie uma imagem JPG, PNG ou WEBP.'), { status: 422 }));
    return callback(null, true);
  }
});

function caminhoPublicoDaImagem(arquivo) {
  return arquivo ? `/uploads/produtos/${arquivo.filename}` : null;
}

async function removerImagemProduto(caminhoPublico) {
  if (!caminhoPublico?.startsWith('/uploads/produtos/')) return;
  const caminho = path.resolve(pastaPublica, `.${caminhoPublico}`);
  if (!caminho.startsWith(`${path.resolve(pastaProdutos)}${path.sep}`)) return;
  try {
    await fs.promises.unlink(caminho);
  } catch (erro) {
    if (erro.code !== 'ENOENT') throw erro;
  }
}

export { uploadProduto, caminhoPublicoDaImagem, removerImagemProduto };
