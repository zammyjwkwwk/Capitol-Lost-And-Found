const STORAGE_KEYS = {
  reports: 'cuLostFoundReports',
  admin: 'cuLostFoundAdminSession',
};

const ADMIN_ACCOUNT = {
  username: 'admin@capitol.edu',
  password: 'cuadmin2026',
};

const DEMO_REPORTS = [
  {
    id: 'demo-lost-wallet',
    type: 'lost',
    title: 'Lost wallet near the library',
    category: 'Wallet',
    location: 'Main Library',
    date: '2026-10-03',
    description: 'Black leather wallet with student ID and a few cash bills. Last seen near the library entrance.',
    reporter: 'Maria Santos',
    image: 'wallet.png',
    status: 'not_claimed',
    creatorCode: 'CU-123456',
    comments: [
      { name: 'Campus Security', text: 'We can check the front desk if it was turned in.', createdAt: '2026-10-03T08:30:00.000Z' },
    ],
    createdAt: '2026-10-03T08:00:00.000Z',
  },
  {
    id: 'demo-found-phone',
    type: 'found',
    title: 'Found iPhone at the student center',
    category: 'Phone',
    location: 'Student Center',
    date: '2026-10-04',
    description: 'Blue phone case with a cracked screen. It was found on the table outside the cafeteria.',
    reporter: 'Jonah Cruz',
    image: 'phone.png',
    status: 'not_claimed',
    creatorCode: 'CU-654321',
    comments: [
      { name: 'R. Tan', text: 'I think this might be mine. I can provide the lock screen details.', createdAt: '2026-10-04T10:15:00.000Z' },
    ],
    createdAt: '2026-10-04T09:30:00.000Z',
  },
  {
    id: 'demo-claimed-laptop',
    type: 'found',
    title: 'Found laptop in the engineering block',
    category: 'Laptop',
    location: 'Engineering Building',
    date: '2026-10-01',
    description: 'Silver laptop with a sticker on the lid. It was left in one of the classrooms.',
    reporter: 'Alia Gomez',
    image: 'laptop.png',
    status: 'claimed',
    creatorCode: 'CU-246810',
    comments: [
      { name: 'A. Reyes', text: 'This looks like my laptop. Please contact me.', createdAt: '2026-10-01T14:20:00.000Z' },
    ],
    createdAt: '2026-10-01T12:00:00.000Z',
    claimedAt: '2026-10-02T09:00:00.000Z',
  },
];

function seedDemoData() {
  try {
    const existing = readReports();
    if (existing.length > 0) return;
    saveReports(DEMO_REPORTS);
  } catch {
    // Ignore storage errors for presentation mode.
  }
}

const DEFAULT_IMAGES = {
  Wallet: 'wallet.png',
  Phone: 'phone.png',
  Laptop: 'laptop.png',
  Keys: 'keys.png',
  Umbrella: 'umbrella.png',
  Books: 'book.png',
  Bag: 'wallet.png',
  Calculator: 'calculator.png',
  Clothing: 'book.png',
  Accessories: 'keys.png',
  Electronics: 'laptop.png',
  Others: 'wallet.png',
};

function readReports() {
  try {
    const reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.reports) || '[]');
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    return true;
  } catch {
    return false;
  }
}

function appendText(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}

function showMessage(container, text, type = '') {
  if (!container) return;
  let message = container.querySelector('.form-message');
  if (!message) {
    message = document.createElement('p');
    message.className = 'form-message';
    message.setAttribute('role', 'status');
    container.appendChild(message);
  }
  message.className = `form-message ${type}`.trim();
  message.textContent = text;
}

function getDefaultImage(category) {
  return DEFAULT_IMAGES[category] || 'wallet.png';
}

function makeCreatorCode() {
  const numbers = new Uint32Array(1);
  window.crypto?.getRandomValues(numbers);
  const value = numbers[0] || Math.floor(Math.random() * 1000000);
  return `CU-${String(value % 1000000).padStart(6, '0')}`;
}

function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar a').forEach((link) => {
    const target = link.getAttribute('href')?.split(/[?#]/, 1)[0];
    if (target === currentPage) link.classList.add('active');
  });
}

function initReportForm() {
  const form = document.getElementById('reportForm');
  if (!form) return;

  const typeSelect = document.getElementById('reportType');
  const title = document.getElementById('reportTitle');
  const description = document.getElementById('reportDescription');
  const locationLabel = document.getElementById('locationLabel');
  const dateLabel = document.getElementById('dateLabel');
  const submitButton = document.getElementById('reportSubmitBtn');
  const fileInput = document.getElementById('itemImage');
  const preview = document.getElementById('previewImage');
  const params = new URLSearchParams(window.location.search);
  if (['lost', 'found'].includes(params.get('type'))) typeSelect.value = params.get('type');

  function updateReportLabels() {
    const isLost = typeSelect.value === 'lost';
    title.textContent = isLost ? 'Report a Lost Item' : 'Report a Found Item';
    description.textContent = isLost
      ? 'Share what you lost so the campus community can help.'
      : 'Tell the campus community what you found.';
    locationLabel.textContent = isLost ? 'Last seen location' : 'Found location';
    dateLabel.textContent = isLost ? 'Date lost' : 'Date found';
    submitButton.textContent = isLost ? 'Post lost item' : 'Post found item';
  }

  typeSelect.addEventListener('change', updateReportLabels);
  updateReportLabels();

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 350000) {
      showMessage(form, 'Choose an image smaller than 350 KB.', 'error');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') preview.src = reader.result;
    });
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const file = fileInput?.files?.[0];
    const saveReport = (image) => {
      const reports = readReports();
      const creatorCode = makeCreatorCode();
      const report = {
        id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        type: typeSelect.value,
        title: String(formData.get('itemTitle')).trim(),
        category: String(formData.get('itemCategory')),
        location: String(formData.get('itemLocation')).trim(),
        date: String(formData.get('itemDate')),
        description: String(formData.get('itemDescription')).trim(),
        reporter: String(formData.get('studentName')).trim(),
        image: image || '',
        status: 'not_claimed',
        creatorCode,
        comments: [],
        createdAt: new Date().toISOString(),
      };

      if (!saveReports([report, ...reports])) {
        showMessage(form, 'This browser is out of storage space. Try a smaller image or remove old reports.', 'error');
        return;
      }

      showMessage(form, `Your report is posted. Save your creator code: ${creatorCode}. You need it to mark this item claimed.`, 'success');
      form.reset();
      preview.src = 'cu-bg.png';
      typeSelect.value = report.type;
      updateReportLabels();
    };

    if (!file) {
      saveReport('');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => saveReport(typeof reader.result === 'string' ? reader.result : ''));
    reader.addEventListener('error', () => showMessage(form, 'The selected image could not be read.', 'error'));
    reader.readAsDataURL(file);
  });
}

function renderComments(list, comments) {
  list.replaceChildren();
  if (!comments.length) {
    appendText(list, 'li', 'No comments yet.', 'comment-empty');
    return;
  }
  comments.forEach((comment) => {
    const item = document.createElement('li');
    appendText(item, 'strong', `${comment.name}: `);
    item.appendChild(document.createTextNode(comment.text));
    list.appendChild(item);
  });
}

function renderDashboard() {
  const dashboard = document.querySelector('.dashboard');
  if (!dashboard) return;

  const itemGrid = document.getElementById('itemGrid');
  const searchInput = document.getElementById('searchBar');
  const typeFilter = document.getElementById('filterType');
  const statusFilter = document.getElementById('filterStatus');
  const categoryFilter = document.getElementById('filterCategory');
  const count = document.getElementById('reportCount');

  function render() {
    const reports = readReports();
    const query = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    const status = statusFilter.value;
    const category = categoryFilter.value;
    const filtered = reports.filter((report) => {
      const searchable = [report.title, report.category, report.location, report.description, report.reporter].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (!type || report.type === type)
        && (!status || report.status === status)
        && (!category || report.category === category);
    });

    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'report' : 'reports'}`;
    itemGrid.replaceChildren();
    if (!filtered.length) {
      appendText(itemGrid, 'p', reports.length ? 'No reports match these filters.' : 'No reports yet. Be the first to post one.', 'empty-state');
      return;
    }

    filtered.forEach((report) => {
      const card = document.createElement('article');
      card.className = 'item-card';
      const image = document.createElement('img');
      image.src = report.image || getDefaultImage(report.category);
      image.alt = report.title;
      image.loading = 'lazy';
      card.appendChild(image);

      const body = document.createElement('div');
      body.className = 'item-card-body';
      appendText(body, 'span', report.type === 'lost' ? 'Lost' : 'Found', `badge ${report.type}`);
      appendText(body, 'h2', report.title);
      appendText(body, 'p', `${report.category} · ${report.location}`);
      appendText(body, 'p', report.description);
      appendText(body, 'p', `Reported by ${report.reporter} · ${report.date}`);
      const claimed = report.status === 'claimed';
      appendText(body, 'span', claimed ? 'Claimed' : 'Not Claimed', `status-badge ${claimed ? 'status-claimed' : 'status-not-claimed'}`);

      if (!claimed) {
        const statusForm = document.createElement('form');
        statusForm.className = 'status-form';
        statusForm.dataset.id = report.id;
        const codeInput = document.createElement('input');
        codeInput.name = 'creatorCode';
        codeInput.type = 'password';
        codeInput.autocomplete = 'off';
        codeInput.placeholder = 'Creator code';
        codeInput.setAttribute('aria-label', `Creator code for ${report.title}`);
        codeInput.required = true;
        const claimButton = document.createElement('button');
        claimButton.type = 'submit';
        claimButton.className = 'btn-secondary';
        claimButton.textContent = 'Mark claimed';
        statusForm.append(codeInput, claimButton);
        body.appendChild(statusForm);
      }

      const comments = Array.isArray(report.comments) ? report.comments : [];
      const commentsSection = document.createElement('section');
      commentsSection.className = 'comments-section';
      appendText(commentsSection, 'h3', `Comments (${comments.length})`);
      const commentList = document.createElement('ul');
      commentList.className = 'comment-list';
      renderComments(commentList, comments);
      commentsSection.appendChild(commentList);

      const commentForm = document.createElement('form');
      commentForm.className = 'comment-form';
      commentForm.dataset.id = report.id;
      const nameInput = document.createElement('input');
      nameInput.name = 'name';
      nameInput.placeholder = 'Your name';
      nameInput.maxLength = 60;
      nameInput.required = true;
      nameInput.setAttribute('aria-label', 'Your name');
      const commentInput = document.createElement('textarea');
      commentInput.name = 'text';
      commentInput.rows = 2;
      commentInput.maxLength = 500;
      commentInput.placeholder = 'Add a helpful comment';
      commentInput.required = true;
      commentInput.setAttribute('aria-label', 'Comment');
      const commentButton = document.createElement('button');
      commentButton.type = 'submit';
      commentButton.className = 'btn-secondary';
      commentButton.textContent = 'Post comment';
      commentForm.append(nameInput, commentInput, commentButton);
      commentsSection.appendChild(commentForm);
      body.appendChild(commentsSection);
      card.appendChild(body);
      itemGrid.appendChild(card);
    });
  }

  [searchInput, typeFilter, statusFilter, categoryFilter].forEach((control) => {
    control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', render);
  });

  dashboard.addEventListener('submit', (event) => {
    const commentForm = event.target.closest('.comment-form');
    const statusForm = event.target.closest('.status-form');
    if (!commentForm && !statusForm) return;
    event.preventDefault();
    const reports = readReports();
    const report = reports.find((item) => item.id === (commentForm || statusForm).dataset.id);
    if (!report) return;

    if (commentForm) {
      report.comments = Array.isArray(report.comments) ? report.comments : [];
      report.comments.push({
        name: commentForm.elements.name.value.trim(),
        text: commentForm.elements.text.value.trim(),
        createdAt: new Date().toISOString(),
      });
    } else {
      const enteredCode = statusForm.elements.creatorCode.value.trim().toUpperCase();
      if (report.status !== 'not_claimed' || enteredCode !== report.creatorCode) {
        window.alert('That creator code does not match this report. Only the original poster can mark it claimed.');
        return;
      }
      report.status = 'claimed';
      report.claimedAt = new Date().toISOString();
    }

    if (!saveReports(reports)) {
      window.alert('The browser could not save this change. Check available local storage.');
      return;
    }
    render();
  });

  window.addEventListener('storage', render);
  render();
}

function initGallery() {
  const gallery = document.getElementById('galleryGrid');
  const dialog = document.getElementById('imageDialog');
  if (!gallery || !dialog) return;
  const enlargedImage = dialog.querySelector('img');
  const closeButton = dialog.querySelector('[data-close-dialog]');

  gallery.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-image]');
    if (!button) return;
    enlargedImage.src = button.dataset.galleryImage;
    enlargedImage.alt = button.dataset.galleryAlt || 'Campus photo';
    dialog.showModal();
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = form.elements.username.value.trim().toLowerCase();
    const password = form.elements.password.value;
    if (username !== ADMIN_ACCOUNT.username || password !== ADMIN_ACCOUNT.password) {
      showMessage(form, 'Incorrect demo admin username or password.', 'error');
      return;
    }
    localStorage.setItem(STORAGE_KEYS.admin, 'true');
    window.location.href = 'admin-dashboard.html';
  });
}

function initAdminDashboard() {
  const panel = document.getElementById('adminPanel');
  if (!panel) return;
  if (localStorage.getItem(STORAGE_KEYS.admin) !== 'true') {
    window.location.replace('admin-login.html');
    return;
  }

  const list = document.getElementById('adminReportList');
  const stats = document.getElementById('adminStats');
  function render() {
    const reports = readReports();
    const lost = reports.filter((report) => report.type === 'lost').length;
    const found = reports.length - lost;
    const claimed = reports.filter((report) => report.status === 'claimed').length;
    stats.replaceChildren();
    [
      ['All reports', reports.length],
      ['Lost', lost],
      ['Found', found],
      ['Claimed', claimed],
    ].forEach(([label, value]) => {
      const statistic = document.createElement('div');
      statistic.className = 'stat';
      appendText(statistic, 'span', label);
      appendText(statistic, 'strong', String(value));
      stats.appendChild(statistic);
    });

    list.replaceChildren();
    if (!reports.length) appendText(list, 'p', 'There are no reports to review.', 'empty-state');
    reports.forEach((report) => {
      const row = document.createElement('article');
      row.className = 'admin-report';
      const details = document.createElement('div');
      appendText(details, 'h2', report.title);
      appendText(details, 'p', `${report.type} · ${report.category} · ${report.status.replace('_', ' ')}`);
      appendText(details, 'p', `${report.location} · ${report.reporter} · ${report.date}`);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'btn-danger';
      deleteButton.textContent = 'Delete report';
      deleteButton.dataset.deleteId = report.id;
      row.append(details, deleteButton);
      list.appendChild(row);
    });
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    if (!button) return;
    if (!window.confirm('Delete this report and its comments? This cannot be undone.')) return;
    const reports = readReports().filter((report) => report.id !== button.dataset.deleteId);
    if (!saveReports(reports)) {
      window.alert('The report could not be deleted from local storage.');
      return;
    }
    render();
  });

  document.getElementById('adminLogout')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.admin);
    window.location.href = 'admin-login.html';
  });
  window.addEventListener('storage', render);
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  seedDemoData();
  initNavigation();
  initReportForm();
  renderDashboard();
  initGallery();
  initAdminLogin();
  initAdminDashboard();
});