// =========================
// 1. 抓到要操作的元素
// =========================

const pillMenu = document.querySelector(".pill-menu");
const pillMenuHeader = document.querySelector(".pill-menu-header");
const languageDial = document.querySelector(".language-dial");
const languageDialTrigger = document.querySelector(".language-dial-trigger");
const languageOptions = document.querySelectorAll(".language-option");
const pillMenuLinks = document.querySelectorAll(".pill-menu-item");
const footerHomeLinks = document.querySelectorAll('.footer-link-icon-only[href="#home"]');
const pageBackButton = document.querySelector(".page-back-button");
let closeTimerId = null;
let closeCleanupTimerId = null;

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

if (languageDial && languageDialTrigger) {
  languageDialTrigger.addEventListener("click", () => {
    const isOpen = languageDial.classList.toggle("open");

    languageDial.setAttribute("aria-expanded", String(isOpen));
    languageDialTrigger.setAttribute("aria-expanded", String(isOpen));
  });
}

if (languageOptions.length > 0) {
  languageOptions.forEach((option) => {
    option.addEventListener("click", async () => {
      const nextLocale = option.dataset.lang;

      if (!nextLocale || typeof window.setLocale !== "function") {
        return;
      }

      await window.setLocale(nextLocale);

      if (languageDial) {
        languageDial.classList.remove("open");
        languageDial.setAttribute("aria-expanded", "false");
      }

      if (languageDialTrigger) {
        languageDialTrigger.setAttribute("aria-expanded", "false");
      }
    });
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
