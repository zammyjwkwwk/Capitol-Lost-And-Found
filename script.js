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

function initYouTubeEmbed() {
  const form = document.getElementById('videoForm');
  const input = document.getElementById('youtubeUrl');
  const frameContainer = document.getElementById('videoFrame');
  const message = document.getElementById('videoMessage');
  if (!form || !input || !frameContainer || !message) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let videoId = '';
    try {
      const url = new URL(input.value.trim());
      const host = url.hostname.toLowerCase();
      if (host === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
        videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1) || '';
      }
    } catch {
      videoId = '';
    }

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      frameContainer.replaceChildren();
      frameContainer.hidden = true;
      message.textContent = 'Enter a valid YouTube video link to display the embed.';
      message.classList.add('error');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
    iframe.title = 'Lost and Found tutorial video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    frameContainer.replaceChildren(iframe);
    frameContainer.hidden = false;
    message.classList.remove('error');
    message.textContent = 'YouTube video embedded below.';
  });
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
  const commentsByReport = new Map();
  const commentsLoading = new Set();
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
      const isOwner = report.ownerId === currentUser.id;
      const isClaimed = report.status === 'claimed';
      appendText(
        body,
        'span',
        isClaimed ? 'Claimed' : 'Not Claimed',
        `status-badge ${isClaimed ? 'status-claimed' : 'status-not-claimed'}`,
      );

      if (isOwner) {
        const statusForm = document.createElement('form');
        statusForm.className = 'status-form';
        statusForm.dataset.id = report.id;
        const statusLabel = appendText(statusForm, 'label', 'Update claim status');
        const statusSelect = document.createElement('select');
        statusSelect.id = `claim-status-${report.id}`;
        statusSelect.name = 'status';
        statusSelect.setAttribute('aria-label', 'Claim status');
        statusLabel.htmlFor = statusSelect.id;
        [
          ['not_claimed', 'Not Claimed'],
          ['claimed', 'Claimed'],
        ].forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          statusSelect.appendChild(option);
        });
        statusSelect.value = isClaimed ? 'claimed' : 'not_claimed';
        statusForm.appendChild(statusSelect);
        const statusButton = document.createElement('button');
        statusButton.type = 'submit';
        statusButton.className = 'btn-secondary';
        statusButton.textContent = 'Save status';
        statusForm.appendChild(statusButton);
        body.appendChild(statusForm);
      }

      if (report.type === 'found' && !isClaimed && !isOwner) {
        const claimButton = document.createElement('button');
        claimButton.type = 'button';
        claimButton.className = 'btn-claim';
        claimButton.dataset.id = report.id;
        claimButton.textContent = 'Request claim';
        body.appendChild(claimButton);
      }

      const commentsSection = document.createElement('section');
      commentsSection.className = 'comments-section';
      appendText(commentsSection, 'h4', 'Comments');
      const commentList = document.createElement('ul');
      commentList.className = 'comment-list';
      commentList.dataset.id = report.id;
      commentList.setAttribute('aria-live', 'polite');
      if (!commentsByReport.has(report.id)) {
        appendText(commentList, 'li', 'Loading comments...', 'comment-empty');
      }
      commentsSection.appendChild(commentList);
      if (commentsByReport.has(report.id)) {
        renderComments(commentList, commentsByReport.get(report.id));
      }
      const commentForm = document.createElement('form');
      commentForm.className = 'comment-form';
      commentForm.dataset.id = report.id;
      const commentInput = document.createElement('textarea');
      commentInput.name = 'body';
      commentInput.rows = 2;
      commentInput.maxLength = 1000;
      commentInput.placeholder = 'Write a comment...';
      commentInput.setAttribute('aria-label', 'Write a comment');
      commentInput.required = true;
      commentForm.appendChild(commentInput);
      const commentButton = document.createElement('button');
      commentButton.type = 'submit';
      commentButton.className = 'btn-secondary';
      commentButton.textContent = 'Comment';
      commentForm.appendChild(commentButton);
      commentsSection.appendChild(commentForm);
      body.appendChild(commentsSection);
      card.appendChild(body);
      itemGrid.appendChild(card);
      if (!commentsByReport.has(report.id) && !commentsLoading.has(report.id)) {
        loadComments(report.id, commentsByReport, commentsLoading);
      }
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
  dashboard.addEventListener('submit', async (event) => {
    const commentForm = event.target.closest('.comment-form');
    if (commentForm) {
      event.preventDefault();
      const commentInput = commentForm.querySelector('[name="body"]');
      const submitButton = commentForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      try {
        const { comment } = await apiRequest(
          `/api/reports/${encodeURIComponent(commentForm.dataset.id)}/comments`,
          {
            method: 'POST',
            body: JSON.stringify({ body: commentInput.value }),
          },
        );
        const commentList = commentForm.parentElement.querySelector('.comment-list');
        const comments = commentsByReport.get(commentForm.dataset.id) || [];
        comments.push(comment);
        commentsByReport.set(commentForm.dataset.id, comments);
        if (commentList) renderComments(commentList, comments);
        commentForm.reset();
      } catch (error) {
        window.alert(error.message);
      } finally {
        submitButton.disabled = false;
      }
      return;
    }

    const statusForm = event.target.closest('.status-form');
    if (!statusForm) return;
    event.preventDefault();
    const statusButton = statusForm.querySelector('button[type="submit"]');
    statusButton.disabled = true;
    try {
      const { report: updatedReport } = await apiRequest(
        `/api/reports/status?id=${encodeURIComponent(statusForm.dataset.id)}`,
        {
          method: 'POST',
          body: JSON.stringify({ status: statusForm.querySelector('[name="status"]').value }),
        },
      );
      reports = reports.map((report) => report.id === updatedReport.id
        ? { ...report, status: updatedReport.status }
        : report);
      render();
    } catch (error) {
      window.alert(error.message);
      statusButton.disabled = false;
    }
  });
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

function renderComments(list, comments) {
  list.replaceChildren();
  if (!comments.length) {
    appendText(list, 'li', 'No comments yet.', 'comment-empty');
    return;
  }
  comments.forEach((comment) => appendComment(list, comment));
}

function appendComment(list, comment) {
  const item = document.createElement('li');
  appendText(item, 'strong', `${comment.authorName}: `);
  item.append(document.createTextNode(comment.body));
  list.appendChild(item);
}

async function loadComments(reportId, cache, loading) {
  loading.add(reportId);
  try {
    const { comments } = await apiRequest(`/api/reports/${encodeURIComponent(reportId)}/comments`);
    if (cache.has(reportId)) return;
    cache.set(reportId, comments);
    document.querySelectorAll('.comment-list').forEach((list) => {
      if (list.dataset.id === reportId) renderComments(list, comments);
    });
  } catch (error) {
    document.querySelectorAll('.comment-list').forEach((list) => {
      if (list.dataset.id === reportId) {
        list.replaceChildren();
        appendText(list, 'li', error.message, 'comment-error');
      }
    });
  } finally {
    loading.delete(reportId);
  }
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

  apiRequest('/api/auth/me')
    .then(({ user }) => {
      document.querySelectorAll('.navbar a').forEach((link) => {
        if (link.classList.contains('btn-logout')) return;
        const targetPage = link.getAttribute('href')?.split(/[?#]/, 1)[0].split('/').pop();
        if (targetPage === 'login.html' || targetPage === 'register.html') {
          link.hidden = Boolean(user);
        }
      });
      document.querySelectorAll('.navbar .btn-logout').forEach((link) => {
        link.hidden = !user;
      });

      if (user && (currentPage === 'login.html' || currentPage === 'register.html')) {
        window.location.replace('dashboard.html');
      }
    })
    .catch((error) => {
      console.error('Could not check the current sign-in status:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSlideshow();
  initYouTubeEmbed();
  initAuthForms();
  initReportForm();
  renderDashboard();
  initLogoutButtons();
});
