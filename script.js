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

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'The request could not be completed.');
  }
  return result;
}

function showFormMessage(form, message, type) {
  if (!form) return;
  let box = form.querySelector('.form-message');
  if (!box) {
    box = document.createElement('p');
    box.className = 'form-message';
    box.setAttribute('role', 'status');
    form.appendChild(box);
  }
  box.className = `form-message ${type}`;
  box.textContent = message;
}

function getDefaultImage(category) {
  return DEFAULT_IMAGES[category] || 'wallet.png';
}

function initSlideshow() {
  const slides = document.querySelectorAll('.mySlides');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length) return;

  let slideIndex = 0;
  const showSlide = (index) => {
    slideIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.style.display = i === slideIndex ? 'block' : 'none';
    });
    dots.forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
  };

  window.currentSlide = (index) => showSlide(index - 1);
  window.plusSlides = (step) => showSlide(slideIndex + step);
  dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
  document.querySelector('.prev')?.addEventListener('click', () => showSlide(slideIndex - 1));
  document.querySelector('.next')?.addEventListener('click', () => showSlide(slideIndex + 1));
  showSlide(0);
}

function initAuthForms() {
  const loginForm = document.getElementById('loginForm');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email')?.value.trim().toLowerCase();
    const password = document.getElementById('password')?.value;
    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.location.href = 'dashboard.html';
    } catch (error) {
      showFormMessage(loginForm, error.message, 'error');
    }
  });

  const registerForm = document.getElementById('registerForm');
  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('regPassword')?.value;
    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      showFormMessage(registerForm, 'Account created successfully! Redirecting...', 'success');
      window.setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (error) {
      showFormMessage(registerForm, error.message, 'error');
    }
  });
}

function initReportForm() {
  const form = document.getElementById('reportForm');
  if (!form) return;

  const reportTypeSelect = document.getElementById('reportType');
  const reportTitle = document.getElementById('reportTitle');
  const reportDescription = document.getElementById('reportDescription');
  const locationLabel = document.getElementById('locationLabel');
  const dateLabel = document.getElementById('dateLabel');
  const submitButton = document.getElementById('reportSubmitBtn');
  const fileInput = document.getElementById('itemImage');
  const preview = document.getElementById('previewImage');

  const updateReportFieldLabels = () => {
    const isLost = (reportTypeSelect?.value || 'lost') === 'lost';
    if (reportTitle) reportTitle.textContent = isLost ? 'Report Lost Item' : 'Report Found Item';
    if (reportDescription) {
      reportDescription.textContent = isLost
        ? 'Please fill out the details below to report your lost item.'
        : 'Please fill out the details below to report an item you found on campus.';
    }
    if (locationLabel) locationLabel.textContent = isLost ? 'Last Seen Location' : 'Found Location';
    if (dateLabel) dateLabel.textContent = isLost ? 'Date Lost' : 'Date Found';
    if (submitButton) submitButton.textContent = isLost ? 'Submit Lost Report' : 'Submit Found Report';
  };

  reportTypeSelect?.addEventListener('change', updateReportFieldLabels);
  updateReportFieldLabels();

  fileInput?.addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFormMessage(form, 'Choose an image file.', 'error');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (preview && typeof reader.result === 'string') preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const category = String(formData.get('itemCategory') || '');
    const uploadedImage = fileInput?.files?.length > 0;

    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          type: reportTypeSelect?.value || 'lost',
          title: formData.get('itemTitle'),
          category,
          location: formData.get('itemLocation'),
          date: formData.get('itemDate'),
          description: formData.get('itemDescription'),
          studentName: formData.get('studentName'),
          studentId: formData.get('studentID'),
        }),
      });
      showFormMessage(
        form,
        uploadedImage
          ? 'Report submitted. Image files are preview-only until image storage is configured.'
          : 'Report submitted successfully!',
        'success',
      );
      window.setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (error) {
      showFormMessage(form, error.message, 'error');
    }
  });

  apiRequest('/api/auth/me')
    .then(({ user }) => {
      if (!user) window.location.href = 'login.html';
    })
    .catch((error) => showFormMessage(form, error.message, 'error'));
}

function appendText(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}

async function renderDashboard() {
  const dashboard = document.querySelector('.dashboard');
  if (!dashboard) return;

  const itemGrid = document.getElementById('itemGrid');
  const activityFeed = document.getElementById('activityFeed');
  const welcomeUser = document.getElementById('welcomeUser');
  const searchInput = document.getElementById('searchBar');
  const categoryFilter = document.getElementById('filterCategory');
  let currentUser;
  let reports = [];

  try {
    const session = await apiRequest('/api/auth/me');
    currentUser = session.user;
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }
    const result = await apiRequest('/api/reports');
    reports = result.reports;
  } catch (error) {
    if (itemGrid) appendText(itemGrid, 'p', error.message, 'empty-state');
    return;
  }

  if (welcomeUser) welcomeUser.textContent = `Hello, ${currentUser.name}!`;

  const render = () => {
    if (!itemGrid || !activityFeed) return;
    itemGrid.replaceChildren();
    activityFeed.replaceChildren();
    const query = searchInput?.value.trim().toLowerCase() || '';
    const category = categoryFilter?.value || '';
    const filtered = reports.filter((report) => {
      const matchesQuery = !query || [
        report.title,
        report.category,
        report.location,
        report.description,
      ].join(' ').toLowerCase().includes(query);
      return matchesQuery && (!category || report.category === category);
    });

    if (!filtered.length) appendText(itemGrid, 'p', 'No items match your current filters.', 'empty-state');

    filtered.forEach((report) => {
      const card = document.createElement('article');
      card.className = 'item-card';
      const image = document.createElement('img');
      image.src = getDefaultImage(report.category);
      image.alt = report.title;
      card.appendChild(image);

      const body = document.createElement('div');
      body.className = 'item-card-body';
      appendText(body, 'span', report.type === 'lost' ? 'Lost' : 'Found', `badge ${report.type}`);
      appendText(body, 'h3', report.title);
      appendText(body, 'p', `Category: ${report.category}`);
      appendText(body, 'p', `Location: ${report.location}`);
      appendText(body, 'p', `Date: ${report.date}`);
      appendText(body, 'span', report.status || 'Open', 'status-badge');
      if (report.type === 'found' && report.status === 'open' && report.ownerId !== currentUser.id) {
        const claimButton = document.createElement('button');
        claimButton.type = 'button';
        claimButton.className = 'btn-claim';
        claimButton.dataset.id = report.id;
        claimButton.textContent = 'Claim';
        body.appendChild(claimButton);
      }
      card.appendChild(body);
      itemGrid.appendChild(card);
    });

    reports.slice(0, 4).forEach((report) => {
      const item = document.createElement('li');
      appendText(item, 'span', '', 'dot');
      appendText(item, 'strong', `${report.type === 'lost' ? 'Lost item' : 'Found item'}: `);
      item.append(`${report.title} in ${report.location}`);
      activityFeed.appendChild(item);
    });
  };

  searchInput?.addEventListener('input', render);
  categoryFilter?.addEventListener('change', render);
  dashboard.addEventListener('click', async (event) => {
    const claimButton = event.target.closest('.btn-claim');
    if (!claimButton) return;
    claimButton.disabled = true;
    try {
      const result = await apiRequest(`/api/reports/claim?id=${encodeURIComponent(claimButton.dataset.id)}`, {
        method: 'POST',
      });
      window.alert(result.message);
      claimButton.textContent = 'Request submitted';
    } catch (error) {
      window.alert(error.message);
      claimButton.disabled = false;
    }
  });
  render();
}

function initLogoutButtons() {
  document.querySelectorAll('.btn-logout').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout failed:', error);
      }
      window.location.href = 'login.html';
    });
  });
}

function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar a').forEach((link) => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSlideshow();
  initAuthForms();
  initReportForm();
  renderDashboard();
  initLogoutButtons();
});
