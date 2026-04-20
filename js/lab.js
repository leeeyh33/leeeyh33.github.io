const labGrid = document.querySelector("#notes-grid");
const labTabs = document.querySelectorAll(".notes-tab");
const labPageStateKey = "lab-page-state";
let sortedLabPosts = [];
let currentLabCategory = "all";
const i18nReady = window.i18nReady || Promise.resolve();
const getLocale = () => (typeof window.getLocale === "function" ? window.getLocale() : "zh");

const formatLabDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return window.t("notesPage.publishedOn", { year, month, day });
};

const resolveLabCoverPath = (cover) => {
  if (cover === "./cat.png") {
    return "./assets/images/cat.png";
  }

  return cover;
};

const getLocalizedLabTitle = (post) => {
  if (post.title && typeof post.title === "object") {
    const locale = getLocale();
    return post.title[locale] || post.title[post.originalLocale] || Object.values(post.title)[0] || "";
  }

  return post.title || "";
};

const createLabCard = (post) => {
  const localizedTitle = getLocalizedLabTitle(post);

  return `
    <article class="note-card">
      <a class="note-card-link" href="./post.html?slug=${post.slug}">
        <div class="note-card-preview">
          <div class="note-paper">
            <img src="${resolveLabCoverPath(post.cover)}" alt="${window.t("notesPage.coverAlt", { title: localizedTitle })}" class="note-paper-image">
          </div>
        </div>
        <h2 class="note-card-title">${localizedTitle}</h2>
        <p class="note-card-meta">${formatLabDate(post.date)}</p>
      </a>
    </article>
  `;
};

const saveLabPageState = () => {
  sessionStorage.setItem(labPageStateKey, JSON.stringify({
    category: currentLabCategory,
    scrollY: window.scrollY,
  }));
};

const applyActiveLabTab = (category) => {
  labTabs.forEach((item) => {
    item.classList.toggle("active", item.dataset.category === category);
  });
};

const renderLabPosts = (category = "all") => {
  if (!labGrid) {
    return;
  }

  currentLabCategory = category;

  const filteredPosts = sortedLabPosts.filter((post) => {
    return category === "all" ? true : post.category === category;
  });

  const cardsMarkup = filteredPosts.map(createLabCard).join("");

  labGrid.innerHTML = `
    <h1 class="sr-only" id="notes-page-title">${window.t("labPage.heading")}</h1>
    ${cardsMarkup}
  `;
};

labTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const category = tab.dataset.category || "all";

    applyActiveLabTab(category);
    renderLabPosts(category);
  });
});

if (labGrid) {
  labGrid.addEventListener("click", (event) => {
    const cardLink = event.target.closest(".note-card-link");

    if (!cardLink) {
      return;
    }

    saveLabPageState();
  });
}

const loadLabPosts = async () => {
  await i18nReady;

  const response = await fetch("./data/lab.json");
  const posts = await response.json();

  sortedLabPosts = [...posts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const savedState = sessionStorage.getItem(labPageStateKey);

  if (!savedState) {
    applyActiveLabTab("all");
    renderLabPosts("all");
    return;
  }

  try {
    const { category = "all", scrollY = 0 } = JSON.parse(savedState);

    applyActiveLabTab(category);
    renderLabPosts(category);

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      sessionStorage.removeItem(labPageStateKey);
    });
  } catch (error) {
    sessionStorage.removeItem(labPageStateKey);
    applyActiveLabTab("all");
    renderLabPosts("all");
  }
};

loadLabPosts();

window.addEventListener("i18n:change", () => {
  if (!sortedLabPosts.length) {
    return;
  }

  applyActiveLabTab(currentLabCategory);
  renderLabPosts(currentLabCategory);
});
