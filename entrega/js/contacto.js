/**
 * IntraNerd · Formulario de contacto
 * Valida los campos y muestra una confirmación local. No envía datos.
 */

const form = document.querySelector('[data-contact-form]');
const status = document.querySelector('[data-form-status]');
const messageField = document.querySelector('#mensaje');
const messageHint = document.querySelector('#mensaje-hint');
const birthDate = document.querySelector('#fechaNacimiento');

if (birthDate) {
  birthDate.max = new Date().toISOString().slice(0, 10);
}

function updateMessageHint() {
  if (!messageField || !messageHint) return;
  const remaining = 1000 - messageField.value.length;
  messageHint.textContent = `${remaining} caracteres disponibles. No compartas datos sensibles.`;
}

if (messageField) {
  messageField.addEventListener('input', updateMessageHint);
  updateMessageHint();
}

if (form && status) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get('nombre') || '').trim();
    status.textContent = `Gracias, ${name || 'por escribirnos'}. Recibimos tu mensaje de demostración. Te responderíamos dentro de dos días hábiles.`;
    status.hidden = false;
    form.reset();
    updateMessageHint();
    status.focus({ preventScroll: true });
  });
}
