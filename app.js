const defaultUrl = 'https://fgpw.pl/wp-content/uploads/2026/02/Szablon-CV-Remote-Ready-Wzor-Niezbednik-Kandydata-4.0.pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const scale = 1.5,
      canvas = document.getElementById('pdf-render'),
      ctx = canvas.getContext('2d');
const urlForm = document.getElementById('pdf-url-form');
const urlInput = document.getElementById('pdf-url');
const fileForm = document.getElementById('pdf-file-form');
const fileInput = document.getElementById('pdf-file');
const loadUrlButton = document.getElementById('load-pdf-url');
const loadFileButton = document.getElementById('load-pdf-file');
const status = document.getElementById('pdf-status');
const pageNumber = document.getElementById('page-num');
const pageCount = document.getElementById('page-count');
const previousButton = document.getElementById('prev-page');
const nextButton = document.getElementById('next-page');

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
      status.textContent = `Could not display page ${num}: ${error.message}`;
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
  status.textContent = 'Loading PDF...';

  try {
    pdfDoc = await pdfjsLib.getDocument(source).promise;
    pageCount.textContent = pdfDoc.numPages;
    status.textContent = `Loaded PDF (${pdfDoc.numPages} pages).`;
    updateNavigation();
    await renderPage(pageNum);
  } catch (error) {
    console.error('Error loading PDF:', error);
    status.textContent = `Could not load this PDF: ${error.message}. Check that the URL points directly to a PDF and that its server allows cross-origin access (CORS).`;
  } finally {
    loadButton.disabled = false;
  }
};

urlForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  loadUrlButton.disabled = true;
  await loadPdf(url, loadUrlButton);
});

fileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;

  loadFileButton.disabled = true;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    await loadPdf({ data }, loadFileButton);
  } catch (error) {
    console.error('Error reading PDF file:', error);
    status.textContent = `Could not read this PDF file: ${error.message}`;
    loadFileButton.disabled = false;
  }
});

urlForm.requestSubmit();
