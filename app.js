const templateButtons = document.querySelectorAll('[data-template]');
const preview = document.getElementById('cv-preview');
const placeholder = document.getElementById('preview-placeholder');
const printButton = document.getElementById('print-cv');
const saveButton = document.getElementById('save-cv');
const openButton = document.getElementById('open-cv');
const loadInput = document.getElementById('load-cv-file');
const status = document.getElementById('status');
const form = document.getElementById('cv-form');
const translateButton = document.getElementById('translate-cv');
const originalButton = document.getElementById('show-original-cv');
const translationEndpointConfig = document.querySelector('meta[name="translation-endpoint"]')?.content.trim() || '';

const normalizeTranslationEndpoint = (value) => {
  if (!value) return '';
  const normalizedValue = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  return new URL(normalizedValue).href;
};

let translationEndpoint = '';
try {
  translationEndpoint = normalizeTranslationEndpoint(translationEndpointConfig);
} catch {
  translationEndpoint = '';
}

let selectedTemplate = null;
let isPreviewReady = false;
let photoUrl = null;
let fitFrame = null;
let translatedData = null;
let isTranslating = false;
let formRevision = 0;

const setActionsEnabled = (enabled) => {
  printButton.disabled = !enabled;
  saveButton.disabled = !enabled;
  if (translateButton) {
    translateButton.disabled = !enabled || !translationEndpoint || isTranslating;
  }
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

const displayDate = (from, to, isEnglish = false) => {
  const format = (date) => date ? date.replace('-', '/') : '';
  return [format(from), format(to) || (from ? (isEnglish ? 'Present' : 'obecnie') : '')]
    .filter(Boolean).join(' – ');
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

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const serializeFile = async (file) => {
  if (!file?.name) return null;
  return {
    name: file.name,
    type: file.type,
    dataUrl: await fileToDataUrl(file),
  };
};

const restoreFile = async (savedFile) => {
  if (!savedFile?.dataUrl || !savedFile.name) return null;
  const blob = await (await fetch(savedFile.dataUrl)).blob();
  return new File([blob], savedFile.name, { type: savedFile.type || blob.type });
};

const assignFile = (input, file) => {
  if (!file) {
    input.value = '';
    return;
  }
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
};

const serializeCv = async () => {
  const data = readForm();
  data.photo = await serializeFile(form.querySelector('[name="photo"]').files[0]);
  delete data.certificateFile;
  for (const certificate of data.certificates) {
    certificate.certificateFile = await serializeFile(certificate.certificateFile);
  }
  return {
    format: 'cv-generator',
    version: 1,
    template: selectedTemplate,
    data,
  };
};

const populateForm = async (savedCv) => {
  if (savedCv?.format !== 'cv-generator' || savedCv.version !== 1 ||
    !savedCv.data || typeof savedCv.data !== 'object') {
    throw new Error('Plik nie jest zapisanym CV z tego generatora.');
  }

  const data = savedCv.data;
  translatedData = null;
  formRevision += 1;
  originalButton.hidden = true;
  translateButton.textContent = 'Tłumacz CV na angielski';
  const dynamicFields = new Set([
    'school', 'fieldOfStudy', 'schoolAddress', 'educationFrom', 'educationTo',
    'jobTitle', 'company', 'experienceFrom', 'experienceTo', 'result',
    'language', 'languageLevel', 'certificateName', 'certificateUrl', 'certificateFile',
  ]);
  form.querySelectorAll('[name]').forEach((control) => {
    if (control.type !== 'file' && !dynamicFields.has(control.name) &&
      Object.hasOwn(data, control.name)) {
      control.value = data[control.name] ?? '';
    }
  });

  const sections = [
    { id: 'education', template: 'education-template', key: 'education' },
    { id: 'experience', template: 'experience-template', key: 'experience' },
    { id: 'languages', template: 'languages-template', key: 'languages' },
    { id: 'certificates', template: 'certificates-template', key: 'certificates' },
  ];
  for (const section of sections) {
    const list = form.querySelector(`#${section.id} .entry-list`);
    const template = document.getElementById(section.template);
    list.replaceChildren();
    for (const [index, values] of (Array.isArray(data[section.key]) ? data[section.key] : []).entries()) {
      const entry = template.content.firstElementChild.cloneNode(true);
      entry.querySelector('.entry-title').textContent = `${list.dataset.name} ${index + 1}`;
      for (const control of entry.querySelectorAll('[name]')) {
        const value = values[control.name];
        if (control.type === 'file') {
          assignFile(control, await restoreFile(value));
        } else if (value !== undefined) {
          control.value = value;
        }
      }
      list.append(entry);
    }
  }

  const photoInput = form.querySelector('[name="photo"]');
  const photo = await restoreFile(data.photo);
  if (photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photoUrl);
  assignFile(photoInput, photo);
  photoUrl = photo ? URL.createObjectURL(photo) : null;

  const templateButton = [...templateButtons].find((button) =>
    button.dataset.template === savedCv.template,
  ) || templateButtons[0];
  templateButton?.click();
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

const englishHeadings = new Map([
  ['umiejętności', 'Skills'],
  ['skills', 'Skills'],
  ['edukacja', 'Education'],
  ['education', 'Education'],
  ['doświadczenie', 'Experience'],
  ['doświadczenie zawodowe', 'Experience'],
  ['experience', 'Experience'],
  ['profil', 'Profile'],
  ['profile', 'Profile'],
  ['o mnie', 'About Me'],
  ['about', 'About Me'],
  ['about me', 'About Me'],
  ['certyfikaty i szkolenia', 'Certifications'],
  ['certifications', 'Certifications'],
  ['języki', 'Languages'],
  ['języki obce', 'Languages'],
  ['languages', 'Languages'],
  ['zainteresowania', 'Interests'],
  ['interests', 'Interests'],
  ['references', 'References'],
]);

const applyEnglishHeadings = (document) => {
  document.querySelectorAll('main h2').forEach((heading) => {
    const translation = englishHeadings.get(heading.textContent.trim().toLocaleLowerCase('pl'));
    if (translation) heading.textContent = translation;
  });
};

const getTranslatableFields = (data) => [
  ...['skills', 'interests'].map((key) => ({ object: data, key })),
  ...data.education.map((entry) => ({ object: entry, key: 'fieldOfStudy' })),
  ...data.experience.flatMap((entry) => [
    { object: entry, key: 'jobTitle' },
    { object: entry, key: 'result' },
  ]),
  ...data.languages.map((entry) => ({ object: entry, key: 'language' })),
  ...data.certificates.map((entry) => ({ object: entry, key: 'certificateName' })),
].filter(({ object, key }) => typeof object[key] === 'string' && object[key].trim());

const requestTranslations = async (texts) => {
  if (texts.reduce((sum, text) => sum + text.length, 0) > 12000) {
    throw new Error('Tekst CV przekracza limit 12 000 znaków na jedno tłumaczenie.');
  }
  let endpoint;
  try {
    endpoint = new URL(normalizeTranslationEndpoint(translationEndpoint));
  } catch {
    throw new Error('Adres usługi tłumaczenia jest nieprawidłowy. Użyj pełnego adresu https://.');
  }
  if (endpoint.protocol !== 'https:' &&
    !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) {
    throw new Error('Adres usługi tłumaczenia musi używać HTTPS.');
  }

  const translations = [];
  for (let index = 0; index < texts.length; index += 50) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: texts.slice(index, index + 50) }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || `Usługa tłumaczenia zwróciła błąd (${response.status}).`);
    }
    if (!Array.isArray(result?.translations) ||
      result.translations.length !== Math.min(50, texts.length - index) ||
      result.translations.some((text) => typeof text !== 'string')) {
      throw new Error('Usługa tłumaczenia zwróciła nieprawidłową odpowiedź.');
    }
    translations.push(...result.translations);
  }
  return translations;
};

const createTranslatedData = async () => {
  const sourceData = readForm();
  const data = {
    ...sourceData,
    education: sourceData.education.map((entry) => ({ ...entry })),
    experience: sourceData.experience.map((entry) => ({ ...entry })),
    languages: sourceData.languages.map((entry) => ({ ...entry })),
    certificates: sourceData.certificates.map((entry) => ({ ...entry })),
  };
  const fields = getTranslatableFields(data);
  const translations = await requestTranslations(fields.map(({ object, key }) => object[key]));
  fields.forEach(({ object, key }, index) => {
    object[key] = translations[index];
  });
  return data;
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
    const date = displayDate(entry.experienceFrom, entry.experienceTo, Boolean(translatedData));
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
    const date = displayDate(entry.educationFrom, entry.educationTo, Boolean(translatedData));

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

  const data = translatedData || readForm();
  document.documentElement.lang = translatedData ? 'en-US' : 'pl';
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
  if (translatedData) applyEnglishHeadings(document);
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
    const templateUrl = new URL(selectedTemplate, window.location.href);
    templateUrl.searchParams.set('preview', Date.now());
    preview.src = templateUrl.href;
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
  status.textContent = form && !translationEndpoint
    ? 'Podgląd CV jest aktualny. Aby włączyć tłumaczenie, skonfiguruj adres Cloudflare Worker w index.html.'
    : 'Podgląd CV jest aktualny.';
});

if (form) {
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', () => {
      invalidateTranslation();
      renderPreview();
  });
  form.addEventListener('change', (event) => {
      invalidateTranslation();
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
      invalidateTranslation();
      requestAnimationFrame(renderPreview);
    }
  });
}

window.addEventListener('resize', schedulePreviewFit);

const invalidateTranslation = () => {
  formRevision += 1;
  if (!translatedData) return;
  translatedData = null;
  originalButton.hidden = true;
  translateButton.textContent = 'Tłumacz CV na angielski';
  status.textContent = 'Formularz został zmieniony. Wyświetlany jest oryginał CV.';
};

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

const saveCv = async () => {
  try {
    const savedCv = await serializeCv();
    const blob = new Blob([JSON.stringify(savedCv, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'moje-cv.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Zapisano dane CV do pliku moje-cv.json.';
  } catch (error) {
    console.error('Nie można zapisać CV:', error);
    status.textContent = 'Nie udało się zapisać CV. Spróbuj ponownie.';
  }
};

const loadExistingCv = async (file) => {
  try {
    const savedCv = JSON.parse(await file.text());
    await populateForm(savedCv);
    status.textContent = 'CV wczytane. Formularz został uzupełniony danymi.';
  } catch (error) {
    status.textContent = error instanceof Error
      ? error.message
      : 'Nie udało się wczytać pliku CV.';
  }
};

openButton.addEventListener('click', () => loadInput.click());
loadInput.addEventListener('change', () => {
  const file = loadInput.files[0];
  loadInput.value = '';
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
    status.textContent = 'Wybierz plik CV zapisany w formacie JSON.';
    return;
  }
  loadExistingCv(file);
});

printButton.addEventListener('click', () => openPrintDialog(false));
saveButton.addEventListener('click', saveCv);
translateButton?.addEventListener('click', async () => {
  if (!translationEndpoint) {
    status.textContent = 'Najpierw skonfiguruj adres Cloudflare Worker w index.html.';
    return;
  }

  isTranslating = true;
  const revisionAtStart = formRevision;
  translateButton.disabled = true;
  originalButton.disabled = true;
  status.textContent = 'Tłumaczenie CV na angielski...';
  try {
    const result = await createTranslatedData();
    if (revisionAtStart !== formRevision) {
      throw new Error('Formularz został zmieniony podczas tłumaczenia. Spróbuj ponownie.');
    }
    translatedData = result;
    originalButton.hidden = false;
    translateButton.textContent = 'Przetłumacz ponownie';
    renderPreview();
    status.textContent = 'Podgląd CV został przetłumaczony. Oryginalne dane formularza nie zostały zmienione.';
  } catch (error) {
    console.error('Nie udało się przetłumaczyć CV:', error);
    status.textContent = error instanceof Error
      ? `Nie udało się przetłumaczyć CV: ${error.message}`
      : 'Nie udało się przetłumaczyć CV. Spróbuj ponownie.';
  } finally {
    isTranslating = false;
    originalButton.disabled = false;
    setActionsEnabled(isPreviewReady);
  }
});

originalButton?.addEventListener('click', () => {
  formRevision += 1;
  translatedData = null;
  originalButton.hidden = true;
  translateButton.textContent = 'Tłumacz CV na angielski';
  renderPreview();
  status.textContent = 'Wyświetlany jest oryginał CV.';
});

if (form && !translationEndpoint) {
  status.textContent = 'Aby włączyć tłumaczenie, skonfiguruj adres Cloudflare Worker w index.html.';
}

templateButtons[0]?.click();
