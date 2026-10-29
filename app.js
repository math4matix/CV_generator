const templateButtons = document.querySelectorAll('[data-template]');
const preview = document.getElementById('cv-preview');
const placeholder = document.getElementById('preview-placeholder');
const printButton = document.getElementById('print-cv');
const saveButton = document.getElementById('save-cv');
const status = document.getElementById('status');

let selectedTemplate = null;
let isPreviewReady = false;

const setActionsEnabled = (enabled) => {
  printButton.disabled = !enabled;
  saveButton.disabled = !enabled;
};

templateButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedTemplate = button.dataset.template;
    isPreviewReady = false;
    setActionsEnabled(false);

    templateButtons.forEach((templateButton) => {
      templateButton.setAttribute('aria-pressed', String(templateButton === button));
    });

    placeholder.hidden = true;
    preview.hidden = false;
    status.textContent = 'Ładowanie wybranego szablonu...';
    preview.src = selectedTemplate;
  });
});

preview.addEventListener('load', () => {
  if (!selectedTemplate) return;

  if (!preview.contentDocument?.querySelector('main')) {
    isPreviewReady = false;
    setActionsEnabled(false);
    status.textContent = 'Nie udało się wczytać szablonu. Spróbuj wybrać go ponownie.';
    return;
  }

  isPreviewReady = true;
  setActionsEnabled(true);
  status.textContent = 'Szablon jest gotowy do drukowania lub zapisania jako PDF.';
});

const openPrintDialog = (saveAsPdf) => {
  if (!isPreviewReady || !preview.contentWindow) return;

  status.textContent = saveAsPdf
    ? 'W oknie drukowania wybierz opcję „Zapisz jako PDF”.'
    : 'Otwieranie okna drukowania...';

  try {
    preview.contentWindow.focus();
    preview.contentWindow.print();
  } catch (error) {
    console.error('Nie można otworzyć okna drukowania:', error);
    status.textContent = 'Nie można otworzyć okna drukowania. Spróbuj ponownie.';
  }
};

printButton.addEventListener('click', () => openPrintDialog(false));
saveButton.addEventListener('click', () => openPrintDialog(true));

templateButtons[0]?.click();
