const defaultUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const scale = 1.5,
      canvas = document.getElementById('pdf-render'),
      ctx = canvas.getContext('2d');
const urlInput = document.getElementById('pdf-url');
const fileInput = document.getElementById('pdf-file');
const loadUrlButton = document.getElementById('load-pdf-url');
const loadFileButton = document.getElementById('load-pdf-file');
const status = document.getElementById('pdf-status');
const pageNumber = document.getElementById('page-num');
const pageCount = document.getElementById('page-count');
const previousButton = document.getElementById('prev-page');
const nextButton = document.getElementById('next-page');

if (typeof pdfjsLib === 'undefined') {
  status.textContent = 'Biblioteka do podglądu PDF nie mogła zostać załadowana. Sprawdź połączenie z internetem i odśwież stronę.';
  loadUrlButton.disabled = true;
  loadFileButton.disabled = true;
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

urlInput.value = defaultUrl;

const updateNavigation = () => {
  previousButton.disabled = !pdfDoc || pageNum <= 1;
  nextButton.disabled = !pdfDoc || pageNum >= pdfDoc.numPages;
};

const renderPage = async (num) => {
  if (!pdfDoc) return;
  const currentPdf = pdfDoc;
  pageIsRendering = true;

  try {
    const page = await currentPdf.getPage(num);
    if (currentPdf !== pdfDoc) return;

    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    if (currentPdf === pdfDoc) {
      pageNumber.textContent = num;
    }
  } catch (error) {
    if (currentPdf === pdfDoc) {
      console.error('Error rendering PDF page:', error);
      status.textContent = `Nie można wyświetlić strony ${num}: ${error.message}`;
    }
  } finally {
    if (currentPdf === pdfDoc) {
      pageIsRendering = false;
      if (pageNumIsPending !== null) {
        const pendingPage = pageNumIsPending;
        pageNumIsPending = null;
        renderPage(pendingPage);
      }
    }
  }
};

const queueRenderPage = (num) => {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
};

previousButton.addEventListener('click', () => {
  if (!pdfDoc || pageNum <= 1) return;
  pageNum--;
  updateNavigation();
  queueRenderPage(pageNum);
});

nextButton.addEventListener('click', () => {
  if (!pdfDoc) return;
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  updateNavigation();
  queueRenderPage(pageNum);
});

const loadPdf = async (source, loadButton) => {
  pdfDoc = null;
  pageIsRendering = false;
  pageNumIsPending = null;
  pageNum = 1;
  pageNumber.textContent = '1';
  pageCount.textContent = '-';
  canvas.width = 0;
  canvas.height = 0;
  updateNavigation();
  status.textContent = 'Ładowanie pliku PDF...';

  try {
    pdfDoc = await pdfjsLib.getDocument(source).promise;
    pageCount.textContent = pdfDoc.numPages;
    status.textContent = `Załadowano plik PDF (${pdfDoc.numPages} stron).`;
    updateNavigation();
    await renderPage(pageNum);
  } catch (error) {
    console.error('Error loading PDF:', error);
    status.textContent = `Nie można wczytać tego pliku PDF: ${error.message}. Sprawdź, czy adres URL wskazuje bezpośrednio na plik PDF i czy serwer umożliwia dostęp cross-origin (CORS).`;
  } finally {
    loadButton.disabled = false;
  }
};

const loadUrl = async () => {
  if (typeof pdfjsLib === 'undefined') return;
  const url = urlInput.value.trim();
  if (!urlInput.reportValidity()) return;

  loadUrlButton.disabled = true;
  await loadPdf(url, loadUrlButton);
};

const loadFile = async () => {
  if (typeof pdfjsLib === 'undefined') return;
  const file = fileInput.files[0];
  if (!file) {
    fileInput.reportValidity();
    return;
  }

  loadFileButton.disabled = true;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    await loadPdf({ data }, loadFileButton);
  } catch (error) {
    console.error('Error reading PDF file:', error);
    status.textContent = `Nie można odczytać tego pliku PDF: ${error.message}`;
    loadFileButton.disabled = false;
  }
};

loadUrlButton.addEventListener('click', loadUrl);
urlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    loadUrl();
  }
});
loadFileButton.addEventListener('click', loadFile);

if (typeof pdfjsLib !== 'undefined') {
  loadPdf(defaultUrl, loadUrlButton);
}
