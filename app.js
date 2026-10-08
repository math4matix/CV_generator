// URL of the PDF document (Replace with your local or external PDF path)
const url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

// 1. Specify the PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const scale = 1.5, // Canvas zoom scale
      canvas = document.getElementById('pdf-render'),
      ctx = canvas.getContext('2d');

// 2. Render specified page
const renderPage = (num) => {
  pageIsRendering = true;

  pdfDoc.getPage(num).then((page) => {
    // Set scale/viewport
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderCtx = {
      canvasContext: ctx,
      viewport: viewport
    };

    page.render(renderCtx).promise.then(() => {
      pageIsRendering = false;

      if (pageNumIsPending !== null) {
        renderPage(pageNumIsPending);
        pageNumIsPending = null;
      }
    });

    // Update current page indicator
    document.getElementById('page-num').textContent = num;
  });
};

// Queue page rendering if another page is currently rendering
const queueRenderPage = (num) => {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
};

// Show previous page
document.getElementById('prev-page').addEventListener('click', () => {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
});

// Show next page
document.getElementById('next-page').addEventListener('click', () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
});

// 3. Load PDF Document
pdfjsLib.getDocument(url).promise.then((pdf) => {
  pdfDoc = pdf;
  document.getElementById('page-count').textContent = pdfDoc.numPages;

  renderPage(pageNum);
}).catch((err) => {
  console.error('Error loading PDF:', err);
});