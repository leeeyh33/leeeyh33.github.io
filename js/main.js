// =========================
// 1. 抓到要操作的元素
// =========================

const pillMenu = document.querySelector(".pill-menu");
const pillMenuHeader = document.querySelector(".pill-menu-header");
const pillMenuLinks = document.querySelectorAll(".pill-menu-item");
const footerHomeLinks = document.querySelectorAll('.footer-link-icon-only[href="#home"]');
const pageBackButton = document.querySelector(".page-back-button");
const introReadIn = document.querySelector(".intro-read-in");
const introReadInLinksWrap = document.querySelector(".intro-read-in-links");
const introReadInLinks = document.querySelectorAll(".intro-read-in-link[data-lang]");
const homeNotesHighlight = document.querySelector("#home-notes-highlight");
let closeTimerId = null;
let closeCleanupTimerId = null;
let homeNotesPosts = [];

const readCssTimeMs = (element, variableName) => {
  const rawValue = getComputedStyle(element).getPropertyValue(variableName).trim();

  if (rawValue.endsWith("ms")) {
    return Number.parseFloat(rawValue);
  }

  if (rawValue.endsWith("s")) {
    return Number.parseFloat(rawValue) * 1000;
  }

  return 0;
};

const closePillMenuImmediately = () => {
  if (!pillMenu) {
    return;
  }

  pillMenu.classList.remove("open", "closing");
  pillMenu.setAttribute("aria-expanded", "false");

  if (pillMenuHeader) {
    pillMenuHeader.setAttribute("aria-expanded", "false");
  }

  if (closeTimerId) {
    window.clearTimeout(closeTimerId);
    closeTimerId = null;
  }

  if (closeCleanupTimerId) {
    window.clearTimeout(closeCleanupTimerId);
    closeCleanupTimerId = null;
  }
};

const syncIntroReadIn = () => {
  if (!introReadIn || !introReadInLinksWrap || typeof window.getLocale !== "function") {
    return;
  }

  const locale = window.getLocale();
  const labels = {
    en: typeof window.t === "function" ? window.t("language.options.en") : "EN",
    zh: typeof window.t === "function" ? window.t("language.options.zh") : "中文",
    ja: typeof window.t === "function" ? window.t("language.options.jp") : "日本語",
  };

  introReadInLinks.forEach((link) => {
    const linkLocale = link.dataset.lang;
    link.textContent = labels[linkLocale] || linkLocale;
    link.hidden = linkLocale === locale;
  });

  introReadInLinksWrap.querySelectorAll(".intro-read-in-separator").forEach((separator) => {
    separator.remove();
  });

  const visibleLinks = Array.from(introReadInLinks).filter((link) => !link.hidden);
  visibleLinks.forEach((link, index) => {
    if (index === 0) {
      return;
    }

    const separator = document.createElement("span");
    separator.className = "intro-read-in-separator";
    separator.textContent = "/";
    introReadInLinksWrap.insertBefore(separator, link);
  });
};

const formatHomeHighlightDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (typeof window.t === "function") {
    return window.t("notesPage.publishedOn", { year, month, day });
  }

  return `${year}/${month}/${day}`;
};

const getLocalizedPostTitle = (post) => {
  if (post.title && typeof post.title === "object") {
    const locale = typeof window.getLocale === "function" ? window.getLocale() : "zh";
    return post.title[locale] || post.title[post.originalLocale] || Object.values(post.title)[0] || "";
  }

  return post.title || "";
};

const renderHomeHighlights = () => {
  if (!homeNotesHighlight) {
    return;
  }

  const highlightedPosts = homeNotesPosts
    .filter((post) => post.highlight)
    .sort((a, b) => {
      const orderA = typeof a.highlightOrder === "number" ? a.highlightOrder : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.highlightOrder === "number" ? b.highlightOrder : Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  if (!highlightedPosts.length) {
    homeNotesHighlight.innerHTML = `<div class="section-placeholder">${typeof window.t === "function" ? window.t("home.sections.notes.placeholder") : ""}</div>`;
    return;
  }

  homeNotesHighlight.innerHTML = highlightedPosts.map((post) => {
    const localizedTitle = getLocalizedPostTitle(post);

    return `
      <article class="home-note-card">
        <a class="home-note-card-link" href="./post.html?slug=${post.slug}">
          <div class="home-note-card-preview">
            <img
              src="${post.cover}"
              alt="${typeof window.t === "function" ? window.t("notesPage.coverAlt", { title: localizedTitle }) : localizedTitle}"
              class="home-note-card-image"
            >
          </div>
          <h3 class="home-note-card-title">${localizedTitle}</h3>
          <p class="home-note-card-meta">${formatHomeHighlightDate(post.date)}</p>
        </a>
      </article>
    `;
  }).join("");
};

const loadHomeHighlights = async () => {
  if (!homeNotesHighlight) {
    return;
  }

  try {
    const response = await fetch("./data/notes.json");

    if (!response.ok) {
      throw new Error("Failed to load notes");
    }

    homeNotesPosts = await response.json();
    renderHomeHighlights();
  } catch (error) {
    homeNotesHighlight.innerHTML = `<div class="section-placeholder">${typeof window.t === "function" ? window.t("home.sections.notes.placeholder") : ""}</div>`;
  }
};



// =========================
// 2. 點擊 header 時切換 open 狀態
// =========================

if (pillMenu && pillMenuHeader) {
  pillMenuHeader.addEventListener("click", () => {
    const isOpen = pillMenu.classList.contains("open");
    const isClosing = pillMenu.classList.contains("closing");
    const menuCloseDelayMs = readCssTimeMs(pillMenu, "--menu-close-delay");
    const menuPanelExpandDurationMs = readCssTimeMs(pillMenu, "--menu-panel-expand-duration");
    const menuCloseBounceDurationMs = readCssTimeMs(pillMenu, "--menu-close-bounce-duration");

    if (closeTimerId) {
      window.clearTimeout(closeTimerId);
      closeTimerId = null;
    }

    if (closeCleanupTimerId) {
      window.clearTimeout(closeCleanupTimerId);
      closeCleanupTimerId = null;
    }

    if (isOpen && !isClosing) {
      pillMenu.classList.add("closing");
      pillMenu.setAttribute("aria-expanded", "false");
      pillMenuHeader.setAttribute("aria-expanded", "false");

      closeTimerId = window.setTimeout(() => {
        pillMenu.classList.remove("open");
        closeTimerId = null;
      }, menuCloseDelayMs);

      closeCleanupTimerId = window.setTimeout(() => {
        pillMenu.classList.remove("closing");
        closeCleanupTimerId = null;
      }, menuCloseDelayMs + menuPanelExpandDurationMs + menuCloseBounceDurationMs);

      return;
    }

    pillMenu.classList.remove("closing");
    pillMenu.classList.add("open");

    pillMenu.setAttribute("aria-expanded", "true");
    pillMenuHeader.setAttribute("aria-expanded", "true");
  });
}

if (pillMenu && pillMenuLinks.length > 0) {
  pillMenuLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || !targetId.startsWith("#")) {
        closePillMenuImmediately();
        return;
      }

      if (targetId === "#home") {
        event.preventDefault();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        if (pillMenu.classList.contains("open")) {
          pillMenu.classList.add("closing");
          pillMenu.setAttribute("aria-expanded", "false");
          pillMenuHeader?.setAttribute("aria-expanded", "false");

          const menuCloseDelayMs = readCssTimeMs(pillMenu, "--menu-close-delay");
          const menuPanelExpandDurationMs = readCssTimeMs(pillMenu, "--menu-panel-expand-duration");
          const menuCloseBounceDurationMs = readCssTimeMs(pillMenu, "--menu-close-bounce-duration");

          if (closeTimerId) {
            window.clearTimeout(closeTimerId);
          }

          if (closeCleanupTimerId) {
            window.clearTimeout(closeCleanupTimerId);
          }

          closeTimerId = window.setTimeout(() => {
            pillMenu.classList.remove("open");
            closeTimerId = null;
          }, menuCloseDelayMs);

          closeCleanupTimerId = window.setTimeout(() => {
            pillMenu.classList.remove("closing");
            closeCleanupTimerId = null;
          }, menuCloseDelayMs + menuPanelExpandDurationMs + menuCloseBounceDurationMs);
        }

        return;
      }

      const targetElement = document.querySelector(targetId);

      if (!targetElement) {
        return;
      }

      event.preventDefault();

      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      if (pillMenu.classList.contains("open")) {
        pillMenu.classList.add("closing");
        pillMenu.setAttribute("aria-expanded", "false");
        pillMenuHeader?.setAttribute("aria-expanded", "false");

        const menuCloseDelayMs = readCssTimeMs(pillMenu, "--menu-close-delay");
        const menuPanelExpandDurationMs = readCssTimeMs(pillMenu, "--menu-panel-expand-duration");
        const menuCloseBounceDurationMs = readCssTimeMs(pillMenu, "--menu-close-bounce-duration");

        if (closeTimerId) {
          window.clearTimeout(closeTimerId);
        }

        if (closeCleanupTimerId) {
          window.clearTimeout(closeCleanupTimerId);
        }

        closeTimerId = window.setTimeout(() => {
          pillMenu.classList.remove("open");
          closeTimerId = null;
        }, menuCloseDelayMs);

        closeCleanupTimerId = window.setTimeout(() => {
          pillMenu.classList.remove("closing");
          closeCleanupTimerId = null;
        }, menuCloseDelayMs + menuPanelExpandDurationMs + menuCloseBounceDurationMs);
      }
    });
  });
}

window.addEventListener("pageshow", () => {
  closePillMenuImmediately();
});

if (introReadIn) {
  if (window.i18nReady && typeof window.i18nReady.then === "function") {
    window.i18nReady.then(() => {
      syncIntroReadIn();
    });
  } else {
    syncIntroReadIn();
  }

  window.addEventListener("i18n:change", syncIntroReadIn);
}

if (introReadInLinks.length > 0) {
  introReadInLinks.forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();

      const nextLocale = link.dataset.lang;

      if (!nextLocale || typeof window.setLocale !== "function") {
        return;
      }

      await window.setLocale(nextLocale);
    });
  });
}

if (homeNotesHighlight) {
  if (window.i18nReady && typeof window.i18nReady.then === "function") {
    window.i18nReady.then(() => {
      loadHomeHighlights();
    });
  } else {
    loadHomeHighlights();
  }

  window.addEventListener("i18n:change", () => {
    if (homeNotesPosts.length) {
      renderHomeHighlights();
    }
  });
}

if (footerHomeLinks.length > 0) {
  footerHomeLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  });
}

if (pageBackButton) {
  pageBackButton.addEventListener("click", (event) => {
    if (window.history.length <= 1) {
      return;
    }

    event.preventDefault();
    window.history.back();
  });
}
