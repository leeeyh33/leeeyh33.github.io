const notesGrid = document.querySelector("#notes-grid");
const notesTabs = document.querySelectorAll(".notes-tab");
const notesPageStateKey = "notes-page-state";
let sortedPosts = [];
let currentCategory = "all";
const i18nReady = window.i18nReady || Promise.resolve();
const getLocale = () => (typeof window.getLocale === "function" ? window.getLocale() : "zh");

const formatPostDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return window.t("notesPage.publishedOn", { year, month, day });
};

const resolveCoverPath = (cover) => {
  if (cover === "./cat.png") {
    return "./assets/images/cat.png";
  }

  return cover;
};

const getLocalizedTitle = (post) => {
  if (post.title && typeof post.title === "object") {
    const locale = getLocale();
    return post.title[locale] || post.title[post.originalLocale] || Object.values(post.title)[0] || "";
  }

  return post.title || "";
};

const createNoteCard = (post) => {
  const localizedTitle = getLocalizedTitle(post);

  return `
    <article class="note-card">
      <a class="note-card-link" href="./post.html?slug=${post.slug}">
        <div class="note-card-preview">
          <div class="note-paper">
            <img src="${resolveCoverPath(post.cover)}" alt="${window.t("notesPage.coverAlt", { title: localizedTitle })}" class="note-paper-image">
          </div>
        </div>
        <h2 class="note-card-title">${localizedTitle}</h2>
        <p class="note-card-meta">${formatPostDate(post.date)}</p>
      </a>
    </article>
  `;
};

const saveNotesPageState = () => {
  sessionStorage.setItem(notesPageStateKey, JSON.stringify({
    category: currentCategory,
    scrollY: window.scrollY,
  }));
};

const applyActiveTab = (category) => {
  notesTabs.forEach((item) => {
    item.classList.toggle("active", item.dataset.category === category);
  });
};

const renderPosts = (category = "all") => {
  if (!notesGrid) {
    return;
  }

  currentCategory = category;

  const filteredPosts = sortedPosts.filter((post) => {
    return category === "all" ? true : post.category === category;
  });

  const cardsMarkup = filteredPosts.map(createNoteCard).join("");

  notesGrid.innerHTML = `
    <h1 class="sr-only" id="notes-page-title">${window.t("notesPage.heading")}</h1>
    ${cardsMarkup}
  `;
};

notesTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const category = tab.dataset.category || "all";

    applyActiveTab(category);
    renderPosts(category);
  });
});

if (notesGrid) {
  notesGrid.addEventListener("click", (event) => {
    const cardLink = event.target.closest(".note-card-link");

    if (!cardLink) {
      return;
    }

    saveNotesPageState();
  });
}

const loadPosts = async () => {
  await i18nReady;

  const response = await fetch("./data/notes.json");
  const posts = await response.json();

  sortedPosts = [...posts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const savedState = sessionStorage.getItem(notesPageStateKey);

  if (!savedState) {
    applyActiveTab("all");
    renderPosts("all");
    return;
  }

  try {
    const { category = "all", scrollY = 0 } = JSON.parse(savedState);

    applyActiveTab(category);
    renderPosts(category);

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      sessionStorage.removeItem(notesPageStateKey);
    });
  } catch (error) {
    sessionStorage.removeItem(notesPageStateKey);
    applyActiveTab("all");
    renderPosts("all");
  }
};

loadPosts();

window.addEventListener("i18n:change", () => {
  if (!sortedPosts.length) {
    return;
  }

  applyActiveTab(currentCategory);
  renderPosts(currentCategory);
});
