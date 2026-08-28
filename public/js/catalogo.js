$(function configurarCatalogo() {
  const $form = $('#filtrosCatalogo'); if (!$form.length) return;
  $form.find('select[name="categoria"], select[name="vendedor"], select[name="ordem"], input[name="disponivel"]').on('change', () => $form.trigger('submit'));
  let temporizador; $form.find('input[name="busca"]').on('input', () => { window.clearTimeout(temporizador); temporizador = window.setTimeout(() => $form.trigger('submit'), 500); });
});
