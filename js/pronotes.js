let currentSubject = null;
let currentChapter = null;
let bookmarksList = JSON.parse(localStorage.getItem('nw_bookmarks') || '[]');
let recentList = JSON.parse(localStorage.getItem('nw_recent') || '[]');

// PDF Viewer State
let currentPdfDoc = null;
let currentPageNum = 1;
let currentActiveNote = null;

document.addEventListener('DOMContentLoaded', () => {
  initProNotesTab();
  initPdfViewer();
});

function initProNotesTab() {
  // Tab Switcher inside Pro Notes Screen
  document.querySelectorAll('.pn-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pn-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetView = btn.getAttribute('data-pn-tab');
      switchProNotesSubView(targetView);
    });
  });

  // Search Input Handler
  const searchInput = document.getElementById('pn-search-input');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length > 2) {
      handleProNotesSearch(query);
    } else if (query.length === 0) {
      switchProNotesSubView('subjects');
    }
  });
}

// Sub-view Router inside Pro Notes Tab
function switchProNotesSubView(viewName) {
  document.querySelectorAll('.pn-subview').forEach(v => v.classList.add('hidden'));
  document.getElementById('pn-empty-state')?.classList.add('hidden');
  const backBtn = document.getElementById('back-nav-btn');

  if (viewName === 'subjects') {
    document.getElementById('pn-view-subjects')?.classList.remove('hidden');
    backBtn?.classList.add('hidden');
    loadSubjects();
  } else if (viewName === 'chapters') {
    document.getElementById('pn-view-chapters')?.classList.remove('hidden');
    backBtn?.classList.remove('hidden');
    loadChapters(currentSubject);
  } else if (viewName === 'notes') {
    document.getElementById('pn-view-notes')?.classList.remove('hidden');
    backBtn?.classList.remove('hidden');
    loadNotesAndEbooks(currentChapter);
  } else if (viewName === 'bookmarks') {
    document.getElementById('pn-view-bookmarks')?.classList.remove('hidden');
    backBtn?.classList.add('hidden');
    renderBookmarks();
  } else if (viewName === 'recent') {
    document.getElementById('pn-view-recent')?.classList.remove('hidden');
    backBtn?.classList.add('hidden');
    renderRecentViewed();
  }
}

// 1. Fetch & Load Subjects
async function loadSubjects() {
  const loadingEl = document.getElementById('pn-subjects-loading');
  const gridEl = document.getElementById('pn-subjects-grid');
  loadingEl?.classList.remove('hidden');
  gridEl?.classList.add('hidden');

  try {
    const { data: subjects, error } = await supabase.from('subjects').select('*');
    if (error) throw error;

    loadingEl?.classList.add('hidden');
    gridEl?.classList.remove('hidden');
    gridEl.innerHTML = '';

    if (!subjects || subjects.length === 0) {
      showPNEmptyState("No Subjects Available", "Subjects will appear here once added by admin.");
      return;
    }

    subjects.forEach(sub => {
      const card = document.createElement('div');
      card.className = 'subject-card';
      card.innerHTML = `
        <div class="subject-icon-box">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <h4>${sub.name}</h4>
      `;
      card.addEventListener('click', () => {
        currentSubject = sub;
        switchProNotesSubView('chapters');
      });
      gridEl.appendChild(card);
    });

  } catch (err) {
    loadingEl?.classList.add('hidden');
    showPNEmptyState("Unable to load subjects", getFriendlyErrorMessage(err));
  }
}

// 2. Fetch & Load Chapters
async function loadChapters(subject) {
  if (!subject) return;
  const headerEl = document.getElementById('pn-active-subject-header');
  const listEl = document.getElementById('pn-chapters-list');
  headerEl.textContent = `Subject: ${subject.name}`;
  listEl.innerHTML = '';

  try {
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subject.id)
      .order('chapter_number', { ascending: true });

    if (error) throw error;

    if (!chapters || chapters.length === 0) {
      showPNEmptyState("No Chapters Found", "No chapters found for this subject.");
      return;
    }

    chapters.forEach(ch => {
      const item = document.createElement('div');
      item.className = 'chapter-item-card';
      item.innerHTML = `
        <h5>Ch ${ch.chapter_number || ''}: ${ch.name}</h5>
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      `;
      item.addEventListener('click', () => {
        currentChapter = ch;
        switchProNotesSubView('notes');
      });
      listEl.appendChild(item);
    });

  } catch (err) {
    showPNEmptyState("Error Loading Chapters", getFriendlyErrorMessage(err));
  }
}

// 3. Fetch & Load Pro Notes + Ebook for Chapter
async function loadNotesAndEbooks(chapter) {
  if (!chapter) return;
  const headerEl = document.getElementById('pn-active-chapter-header');
  const container = document.getElementById('pn-notes-list');
  headerEl.textContent = chapter.name;
  container.innerHTML = '';

  try {
    // Fetch Pro Notes
    const { data: notes } = await supabase
      .from('pro_notes')
      .select('*')
      .eq('chapter_id', chapter.id)
      .eq('is_active', true);

    // Fetch Ebooks
    const { data: ebooks } = await supabase
      .from('ebooks')
      .select('*')
      .eq('chapter_id', chapter.id)
      .eq('is_active', true);

    if ((!notes || notes.length === 0) && (!ebooks || ebooks.length === 0)) {
      showPNEmptyState("No Content Yet", "Pro Notes or Ebooks have not been uploaded for this chapter.");
      return;
    }

    // Render Pro Notes
    notes?.forEach(note => {
      const card = document.createElement('div');
      card.className = 'content-item-card';
      card.innerHTML = `
        <div class="content-item-header">
          <div>
            <h4 class="content-item-title">${note.title}</h4>
            <p class="content-item-desc">${note.description || 'Verified PDF Note'}</p>
          </div>
          <span class="badge badge-gold">Pro Note</span>
        </div>
        <div class="content-actions">
          <button class="btn btn-primary btn-sm open-pdf-btn">Open Note</button>
        </div>
      `;
      card.querySelector('.open-pdf-btn').addEventListener('click', () => {
        openPdfViewer(note);
      });
      container.appendChild(card);
    });

    // Render Ebooks (Only show "Read" button if exact URL exists)
    ebooks?.forEach(ebook => {
      if (ebook.url) {
        const card = document.createElement('div');
        card.className = 'content-item-card';
        card.innerHTML = `
          <div class="content-item-header">
            <div>
              <h4 class="content-item-title">${ebook.title}</h4>
              <p class="content-item-desc">Official Ebook Reference</p>
            </div>
            <span class="badge">Ebook</span>
          </div>
          <div class="content-actions">
            <button class="btn btn-secondary btn-sm read-ebook-btn">Read</button>
          </div>
        `;
        card.querySelector('.read-ebook-btn').addEventListener('click', () => {
          window.open(ebook.url, '_blank');
        });
        container.appendChild(card);
      }
    });

  } catch (err) {
    showPNEmptyState("Error Loading Notes", getFriendlyErrorMessage(err));
  }
}

// 4. In-App PDF Viewer Modal Handler
async function openPdfViewer(note) {
  currentActiveNote = note;
  addToRecent(note);

  const modal = document.getElementById('pdf-viewer-modal');
  const titleEl = document.getElementById('pdf-modal-title');
  const spinner = document.getElementById('pdf-loading-spinner');
  
  titleEl.textContent = note.title;
  modal.classList.remove('hidden');
  spinner.classList.remove('hidden');

  updateBookmarkIconState(note.id);

  try {
    // Get Public URL from Supabase Storage
    const { data } = supabase.storage.from('notes_pdf').getPublicUrl(note.storage_path);
    const pdfUrl = data.publicUrl;

    // Load PDF using PDF.js
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    currentPdfDoc = await loadingTask.promise;
    currentPageNum = 1;
    
    spinner.classList.add('hidden');
    renderPdfPage(currentPageNum);

  } catch (err) {
    spinner.textContent = "Failed to load PDF file.";
  }
}

function renderPdfPage(num) {
  if (!currentPdfDoc) return;
  currentPdfDoc.getPage(num).then(page => {
    const canvas = document.getElementById('pdf-render-canvas');
    const ctx = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.2 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    page.render({ canvasContext: ctx, viewport: viewport });
    document.getElementById('page-num-display').textContent = `Page ${num} / ${currentPdfDoc.numPages}`;
  });
}

function initPdfViewer() {
  document.getElementById('close-pdf-btn')?.addEventListener('click', () => {
    document.getElementById('pdf-viewer-modal').classList.add('hidden');
  });

  document.getElementById('prev-page-btn')?.addEventListener('click', () => {
    if (currentPageNum > 1) {
      currentPageNum--;
      renderPdfPage(currentPageNum);
    }
  });

  document.getElementById('next-page-btn')?.addEventListener('click', () => {
    if (currentPdfDoc && currentPageNum < currentPdfDoc.numPages) {
      currentPageNum++;
      renderPdfPage(currentPageNum);
    }
  });

  // Bookmark Toggle
  document.getElementById('bookmark-pdf-btn')?.addEventListener('click', () => {
    if (!currentActiveNote) return;
    toggleBookmark(currentActiveNote);
  });

  // Download Action
  document.getElementById('download-pdf-btn')?.addEventListener('click', () => {
    if (!currentActiveNote) return;
    const { data } = supabase.storage.from('notes_pdf').getPublicUrl(currentActiveNote.storage_path);
    window.open(data.publicUrl, '_blank');
  });

  // Share Action
  document.getElementById('share-pdf-btn')?.addEventListener('click', () => {
    if (navigator.share && currentActiveNote) {
      navigator.share({
        title: currentActiveNote.title,
        text: `Check out ${currentActiveNote.title} on Notes Win!`,
        url: window.location.href
      });
    } else {
      alert("Sharing link copied to clipboard!");
    }
  });
}

// 5. Bookmarks & Recent Sync
function toggleBookmark(note) {
  const index = bookmarksList.findIndex(b => b.id === note.id);
  if (index > -1) {
    bookmarksList.splice(index, 1);
  } else {
    bookmarksList.push(note);
  }
  localStorage.setItem('nw_bookmarks', JSON.stringify(bookmarksList));
  updateBookmarkIconState(note.id);
}

function updateBookmarkIconState(noteId) {
  const isBookmarked = bookmarksList.some(b => b.id === noteId);
  const iconBtn = document.getElementById('bookmark-pdf-btn');
  if (iconBtn) {
    iconBtn.classList.toggle('bookmarked', isBookmarked);
  }
}

function addToRecent(note) {
  recentList = recentList.filter(r => r.id !== note.id);
  recentList.unshift(note);
  if (recentList.length > 20) recentList.pop();
  localStorage.setItem('nw_recent', JSON.stringify(recentList));
}

function renderBookmarks() {
  const container = document.getElementById('pn-bookmarks-list');
  container.innerHTML = '';
  if (bookmarksList.length === 0) {
    showPNEmptyState("No Bookmarks Yet", "Save notes to access them quickly here.");
    return;
  }
  bookmarksList.forEach(note => {
    const card = document.createElement('div');
    card.className = 'content-item-card';
    card.innerHTML = `
      <div class="content-item-header">
        <h4 class="content-item-title">${note.title}</h4>
        <span class="badge badge-gold">Saved Note</span>
      </div>
      <button class="btn btn-primary btn-sm open-pdf-btn">Open Note</button>
    `;
    card.querySelector('.open-pdf-btn').addEventListener('click', () => openPdfViewer(note));
    container.appendChild(card);
  });
}

function renderRecentViewed() {
  const container = document.getElementById('pn-recent-list');
  container.innerHTML = '';
  if (recentList.length === 0) {
    showPNEmptyState("No Recent Notes", "Notes you read will appear here.");
    return;
  }
  recentList.forEach(note => {
    const card = document.createElement('div');
    card.className = 'content-item-card';
    card.innerHTML = `
      <div class="content-item-header">
        <h4 class="content-item-title">${note.title}</h4>
        <span class="badge">Recent</span>
      </div>
      <button class="btn btn-primary btn-sm open-pdf-btn">Open Note</button>
    `;
    card.querySelector('.open-pdf-btn').addEventListener('click', () => openPdfViewer(note));
    container.appendChild(card);
  });
}

// Helper: Show Empty State Box
function showPNEmptyState(title, desc) {
  const emptyEl = document.getElementById('pn-empty-state');
  if (emptyEl) {
    document.getElementById('pn-empty-title').textContent = title;
    document.getElementById('pn-empty-desc').textContent = desc;
    emptyEl.classList.remove('hidden');
  }
}

// Global Back Button Handler
document.getElementById('back-nav-btn')?.addEventListener('click', () => {
  const chaptersView = document.getElementById('pn-view-chapters');
  const notesView = document.getElementById('pn-view-notes');

  if (!notesView.classList.contains('hidden')) {
    switchProNotesSubView('chapters');
  } else if (!chaptersView.classList.contains('hidden')) {
    switchProNotesSubView('subjects');
  }
});
                          
