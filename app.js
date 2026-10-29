let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null,
    pdfFileName = 'document.pdf';

const scale = 1.5,
      canvas = document.getElementById('pdf-render'),
      ctx = canvas.getContext('2d');
const fileInput = document.getElementById('pdf-file');
const loadFileButton = document.getElementById('load-pdf-file');
const status = document.getElementById('pdf-status');
const pageNumber = document.getElementById('page-num');
const pageCount = document.getElementById('page-count');
const previousButton = document.getElementById('prev-page');
const nextButton = document.getElementById('next-page');
const printButton = document.getElementById('print-pdf');
const saveButton = document.getElementById('save-pdf');
const printDocument = document.getElementById('print-document');

if (typeof pdfjsLib === 'undefined') {
  status.textContent = 'Biblioteka do podglądu PDF nie mogła zostać załadowana. Sprawdź połączenie z internetem i odśwież stronę.';
  loadFileButton.disabled = true;
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const updateNavigation = () => {
  previousButton.disabled = !pdfDoc || pageNum <= 1;
  nextButton.disabled = !pdfDoc || pageNum >= pdfDoc.numPages;
  printButton.disabled = !pdfDoc;
  saveButton.disabled = !pdfDoc;
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

const loadPdf = async (data, fileName) => {
  pdfDoc = null;
  pdfFileName = fileName || 'document.pdf';
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
    pdfDoc = await pdfjsLib.getDocument(data).promise;
    pageCount.textContent = pdfDoc.numPages;
    status.textContent = `Załadowano plik PDF (${pdfDoc.numPages} stron).`;
    updateNavigation();
    await renderPage(pageNum);
  } catch (error) {
    console.error('Error loading PDF:', error);
    status.textContent = `Nie można wczytać tego pliku PDF: ${error.message}`;
  } finally {
    loadFileButton.disabled = false;
  }
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
    await loadPdf({ data }, file.name);
  } catch (error) {
    console.error('Error reading PDF file:', error);
    status.textContent = `Nie można odczytać tego pliku PDF: ${error.message}`;
    loadFileButton.disabled = false;
  }
};

loadFileButton.addEventListener('click', loadFile);

printButton.addEventListener('click', async () => {
  if (!pdfDoc) return;

  printButton.disabled = true;
  printButton.textContent = 'Przygotowywanie...';
  printDocument.replaceChildren();

  try {
    const currentPdf = pdfDoc;
    for (let number = 1; number <= currentPdf.numPages; number++) {
      const page = await currentPdf.getPage(number);
      const viewport = page.getViewport({ scale });
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      await page.render({
        canvasContext: pageCanvas.getContext('2d'),
        viewport
      }).promise;

      const image = document.createElement('img');
      image.className = 'print-page';
      image.src = pageCanvas.toDataURL('image/png');
      image.alt = `Strona ${number}`;
      printDocument.append(image);
    }

    window.print();
  } catch (error) {
    console.error('Error preparing PDF for printing:', error);
    status.textContent = `Nie można przygotować dokumentu do drukowania: ${error.message}`;
  } finally {
    printButton.textContent = 'Drukuj';
    updateNavigation();
  }
});

saveButton.addEventListener('click', async () => {
  if (!pdfDoc) return;

  saveButton.disabled = true;
  try {
    const data = await pdfDoc.getData();
    const blob = new Blob([data], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = pdfFileName.toLowerCase().endsWith('.pdf')
      ? pdfFileName
      : `${pdfFileName}.pdf`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error saving PDF:', error);
    status.textContent = `Nie można zapisać pliku PDF: ${error.message}`;
  } finally {
    updateNavigation();
  }
});
