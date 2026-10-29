const templateButtons = document.querySelectorAll('[data-template]');
const preview = document.getElementById('cv-preview');
const placeholder = document.getElementById('preview-placeholder');
const printButton = document.getElementById('print-cv');
const saveButton = document.getElementById('save-cv');
const status = document.getElementById('status');
const form = document.getElementById('cv-form');

let selectedTemplate = null;
let isPreviewReady = false;
let photoUrl = null;
let fitFrame = null;

const setActionsEnabled = (enabled) => {
  printButton.disabled = !enabled;
  saveButton.disabled = !enabled;
};

const readForm = () => {
  const readEntry = (entry) =>
    Object.fromEntries(
      [...entry.querySelectorAll('[name]')].map((control) => [
        control.name,
        control.type === 'file' ? control.files[0] || null : control.value,
      ]),
    );
  const data = Object.fromEntries(new FormData(form).entries());
  data.education = [...form.querySelectorAll('#education [data-entry]')].map(readEntry);
  data.experience = [...form.querySelectorAll('#experience [data-entry]')].map(readEntry);
  data.languages = [...form.querySelectorAll('#languages [data-entry]')].map(readEntry);
  data.certificates = [...form.querySelectorAll('#certificates [data-entry]')].map(readEntry);
  return data;
};

const createElement = (document, tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const displayDate = (from, to) => {
  const format = (date) => date ? date.replace('-', '/') : '';
  return [format(from), format(to) || (from ? 'obecnie' : '')].filter(Boolean).join(' – ');
};

const splitItems = (text) => text.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

const safeUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const sectionByHeading = (document, phrase) =>
  [...document.querySelectorAll('main h2')]
    .find((heading) => heading.textContent.toLowerCase().includes(phrase))
    ?.closest('section');

const appendGeneratedSection = (document, main, title, values) => {
  const section = createElement(document, 'section', 'generated-section');
  section.append(createElement(document, 'h2', '', title));
  const list = createElement(document, 'ul');
  values.forEach((value) => list.append(createElement(document, 'li', '', value)));
  section.append(list);
  main.querySelector('.cv-fit-content')?.append(section);
  return section;
};

const fitPreviewToPage = () => {
  const document = preview.contentDocument;
  const main = document?.querySelector('main');
  const content = main?.querySelector('.cv-fit-content');
  if (!document || !main || !content) return;

  const pageHeight = main.clientWidth * 297 / 210;

  main.style.height = `${pageHeight}px`;
  main.style.minHeight = '0';

  const styles = document.defaultView.getComputedStyle(main);
  const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const availableHeight = main.clientHeight - verticalPadding;
  const contentHeight = content.scrollHeight;
  const scale = contentHeight > availableHeight && contentHeight > 0
    ? (availableHeight / contentHeight) * 0.98
    : 1;
  document.documentElement.style.setProperty('--cv-fit-scale', String(scale));
};

const schedulePreviewFit = () => {
  if (fitFrame !== null) cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(() => {
    fitFrame = null;
    fitPreviewToPage();
  });
};

const renderContacts = (document, list, data) => {
  const contacts = [
    { value: data.address, icon: '●' },
    { value: data.phone, href: data.phone ? `tel:${data.phone.replace(/[^\d+]/g, '')}` : null, icon: '☎' },
    { value: data.email, href: data.email ? `mailto:${data.email}` : null, icon: '✉' },
    { value: data.linkedin, href: safeUrl(data.linkedin), icon: 'in' },
    { value: data.github, href: safeUrl(data.github), icon: 'GH' },
    { value: data.portfolio, href: safeUrl(data.portfolio), icon: '↗' },
  ].filter((contact) => contact.value);

  list.replaceChildren();
  contacts.forEach(({ value, href, icon }) => {
    const item = createElement(document, 'li');
    const iconElement = createElement(document, 'span', 'contact-icon', icon);
    iconElement.setAttribute('aria-hidden', 'true');
    item.append(iconElement);
    const content = href ? createElement(document, 'a', '', value) : createElement(document, 'span', '', value);
    if (href) content.href = href;
    item.append(content);
    list.append(item);
  });
  list.hidden = contacts.length === 0;
};

const renderExperience = (document, section, data, templateName) => {
  const heading = section.querySelector('h2');
  const entries = data.experience.filter((entry) =>
    Object.values(entry).some((value) => typeof value === 'string' && value.trim()),
  );
  section.replaceChildren(heading);
  section.hidden = entries.length === 0;

  entries.forEach((entry) => {
    const title = entry.jobTitle.trim();
    const company = entry.company.trim();
    const date = displayDate(entry.experienceFrom, entry.experienceTo);
    const details = splitItems(entry.result || '');

    if (templateName === 'simple_photo.html') {
      const article = createElement(document, 'article', 'entry');
      const meta = createElement(document, 'div', 'entry-meta');
      if (date) meta.append(createElement(document, 'p', '', date));
      if (company) meta.append(createElement(document, 'p', '', company));
      const content = createElement(document, 'div', 'entry-content');
      if (title) content.append(createElement(document, 'h3', '', title));
      if (details.length) content.append(createElement(document, 'p', '', details.join(' ')));
      article.append(meta, content);
      section.append(article);
      return;
    }

    const article = templateName === 'black_white.html'
      ? createElement(document, 'section', 'job')
      : createElement(document, 'article', 'job');
    if (templateName === 'no_photo.html') {
      const jobHeading = createElement(document, 'div', 'job-heading');
      if (title) jobHeading.append(createElement(document, 'h3', '', title));
      const meta = createElement(document, 'div', 'job-meta');
      if (company) meta.append(createElement(document, 'p', '', company));
      if (date) meta.append(createElement(document, 'p', '', date));
      jobHeading.append(meta);
      article.append(jobHeading);
    } else {
      if (title) article.append(createElement(document, 'h3', '', title));
      if (company) article.append(createElement(document, 'p', '', company));
      if (date) article.append(createElement(document, 'p', '', date));
    }
    if (details.length) {
      const list = createElement(document, 'ul');
      details.forEach((detail) => list.append(createElement(document, 'li', '', detail)));
      article.append(list);
    }
    section.append(article);
  });
};

const renderEducation = (document, section, data, templateName) => {
  const heading = section.querySelector('h2');
  const entries = data.education.filter((entry) =>
    Object.values(entry).some((value) => typeof value === 'string' && value.trim()),
  );
  section.replaceChildren(heading);
  section.hidden = entries.length === 0;

  entries.forEach((entry) => {
    const school = entry.school.trim();
    const field = entry.fieldOfStudy.trim();
    const address = entry.schoolAddress.trim();
    const date = displayDate(entry.educationFrom, entry.educationTo);

    if (templateName === 'black_white.html') {
      const details = [field, address, date].filter(Boolean).join(' · ');
      section.append(createElement(document, 'p', 'education', [school, details].filter(Boolean).join(' — ')));
    } else if (templateName === 'no_photo.html') {
      const row = createElement(document, 'div', 'education-heading');
      if (field) row.append(createElement(document, 'h3', '', field));
      const meta = createElement(document, 'div', 'education-meta');
      if (school) meta.append(createElement(document, 'p', '', school));
      if (address) meta.append(createElement(document, 'p', '', address));
      if (date) meta.append(createElement(document, 'p', '', date));
      row.append(meta);
      section.append(row);
    } else {
      const row = createElement(document, 'article', 'entry');
      const meta = createElement(document, 'div', 'entry-meta');
      if (date) meta.append(createElement(document, 'p', '', date));
      if (school) meta.append(createElement(document, 'p', '', school));
      const content = createElement(document, 'div', 'entry-content');
      if (field) content.append(createElement(document, 'h3', '', field));
      if (address) content.append(createElement(document, 'p', '', address));
      row.append(meta, content);
      section.append(row);
    }
  });
};

const renderPreview = () => {
  if (!form || !isPreviewReady) return;
  const document = preview.contentDocument;
  const main = document?.querySelector('main');
  if (!document || !main) return;

  const data = readForm();
  const templateName = selectedTemplate.split('/').pop();
  const name = [data.firstName, data.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  const nameHeading = main.querySelector('h1');
  nameHeading.textContent = name;

  const role = main.querySelector('.role');
  if (role) {
    role.textContent = data.experience.find((entry) => entry.jobTitle.trim())?.jobTitle.trim() || '';
    role.hidden = !role.textContent;
  }

  const contacts = main.querySelector('.contact-list');
  if (contacts) renderContacts(document, contacts, data);

  const portraits = main.querySelectorAll('.portrait');
  portraits.forEach((portrait) => {
    if (photoUrl) {
      portrait.src = photoUrl;
      portrait.alt = name || 'Zdjęcie kandydata';
      portrait.hidden = false;
    } else {
      portrait.removeAttribute('src');
      portrait.alt = '';
      portrait.hidden = true;
    }
  });

  const experienceSection = sectionByHeading(document, 'experience') ||
    document.querySelector('.experience');
  if (experienceSection) renderExperience(document, experienceSection, data, templateName);

  const educationSection = sectionByHeading(document, 'education') ||
    document.querySelector('section.education, .education-section');
  if (educationSection) renderEducation(document, educationSection, data, templateName);

  const skillsSection = sectionByHeading(document, 'skills') ||
    document.querySelector('.skills, .skills-section');
  const skills = splitItems(String(data.skills || ''));
  if (skillsSection) {
    skillsSection.hidden = skills.length === 0;
    const list = skillsSection.querySelector('ul');
    if (list) {
      list.replaceChildren(...skills.map((skill) => createElement(document, 'li', '', skill)));
    } else {
      const paragraph = skillsSection.querySelector('p');
      if (paragraph) paragraph.textContent = skills.join(' · ');
    }
  }

  const profileSection = document.querySelector('.editor-interests') ||
    sectionByHeading(document, 'profile') || sectionByHeading(document, 'about') ||
    document.querySelector('.about');
  const interests = splitItems(String(data.interests || '')).join(', ');
  if (profileSection) {
    profileSection.classList.add('editor-interests');
    profileSection.hidden = !interests;
    const heading = profileSection.querySelector('h2');
    if (heading) heading.textContent = 'Zainteresowania';
    const paragraph = profileSection.querySelector('p');
    if (paragraph) paragraph.textContent = interests;
  }

  document.querySelector('.generated-certificates')?.remove();
  const certificateSection = document.querySelector('.editor-certificates') ||
    sectionByHeading(document, 'certification') || document.querySelector('.certifications');
  const certificates = data.certificates.filter((entry) =>
    Object.values(entry).some((value) =>
      value instanceof File ? value.name : typeof value === 'string' && value.trim(),
    ),
  );
  if (certificateSection) {
    certificateSection.classList.add('editor-certificates');
    const heading = certificateSection.querySelector('h2');
    const list = certificateSection.querySelector('.certification-list');
    if (list) {
      list.replaceChildren();
      certificates.forEach((certificate) => {
        const article = createElement(document, 'article', 'certification');
        if (certificate.certificateName.trim()) {
          article.append(createElement(document, 'h3', '', certificate.certificateName.trim()));
        }
        const url = safeUrl(certificate.certificateUrl);
        if (url) {
          const link = createElement(document, 'a', '', certificate.certificateUrl.trim());
          link.href = url;
          const linkParagraph = createElement(document, 'p');
          linkParagraph.append(link);
          article.append(linkParagraph);
        }
        if (certificate.certificateFile instanceof File) {
          article.append(createElement(document, 'p', '', certificate.certificateFile.name));
        }
        list.append(article);
      });
    }
    certificateSection.hidden = certificates.length === 0;
    if (heading) heading.textContent = 'Certyfikaty i szkolenia';
  } else if (certificates.length) {
    appendGeneratedSection(document, main, 'Certyfikaty i szkolenia',
      certificates.map((entry) =>
        entry.certificateName.trim() || entry.certificateUrl.trim() ||
        (entry.certificateFile instanceof File ? entry.certificateFile.name : ''),
      ).filter(Boolean)).classList.add('generated-certificates');
  }

  const languages = data.languages
    .map((entry) => [entry.language.trim(), entry.languageLevel.trim()].filter(Boolean).join(' — '))
    .filter(Boolean);
  document.querySelector('.generated-languages')?.remove();
  if (languages.length) {
    appendGeneratedSection(document, main, 'Języki', languages).classList.add('generated-languages');
  }
  schedulePreviewFit();
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
  if (!preview.contentDocument.getElementById('editor-preview-styles')) {
    const styles = preview.contentDocument.createElement('style');
    styles.id = 'editor-preview-styles';
    styles.textContent = [
      '[hidden] { display: none !important; }',
      'main { overflow: hidden !important; }',
      '.cv-fit-content { width: 100%; transform: scale(var(--cv-fit-scale, 1)); transform-origin: top left; }',
      '.generated-section { margin: 0 0 20px; }',
      '.generated-section h2 { margin-bottom: 12px; font-size: 15px; text-transform: uppercase; }',
      '.generated-section ul { margin: 0; padding-left: 20px; }',
      '.generated-section li, .generated-section p { font-size: 11px; line-height: 1.4; }',
      '@media print { main { height: 297mm !important; min-height: 0 !important; overflow: hidden !important; } }',
    ].join('\n');
    preview.contentDocument.head.append(styles);
  }
  const main = preview.contentDocument.querySelector('main');
  const content = preview.contentDocument.createElement('div');
  content.className = 'cv-fit-content';
  while (main.firstChild) content.append(main.firstChild);
  main.append(content);
  preview.contentWindow.addEventListener('beforeprint', fitPreviewToPage);
  preview.contentWindow.addEventListener('afterprint', schedulePreviewFit);
  renderPreview();
  status.textContent = 'Podgląd CV jest aktualny.';
});

if (form) {
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', renderPreview);
  form.addEventListener('change', (event) => {
    if (event.target.name === 'photo') {
      const photo = event.target.files[0];
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = null;
      if (photo) {
        photoUrl = URL.createObjectURL(photo);
      }
    }
    renderPreview();
  });

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-add], [data-remove]')) {
      requestAnimationFrame(renderPreview);
    }
  });
}

window.addEventListener('resize', schedulePreviewFit);

const openPrintDialog = (saveAsPdf) => {
  if (!isPreviewReady || !preview.contentWindow) return;

  fitPreviewToPage();
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
