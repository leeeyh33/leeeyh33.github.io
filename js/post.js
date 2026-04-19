const postContent = document.querySelector("#post-content");
const i18nReady = window.i18nReady || Promise.resolve();
let isPostLoading = false;
const getLocale = () => (typeof window.getLocale === "function" ? window.getLocale() : "zh");

const formatPostDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}/${month}/${day}`;
};

const renderPostMessage = (message) => {
  if (!postContent) {
    return;
  }

  postContent.innerHTML = `<p>${message}</p>`;
};

const getLocalizedTitle = (postMeta) => {
  if (postMeta.title && typeof postMeta.title === "object") {
    const locale = getLocale();
    return postMeta.title[locale] || postMeta.title[postMeta.originalLocale] || Object.values(postMeta.title)[0] || "";
  }

  return postMeta.title || "";
};

const preserveMarkdownBlankLines = (markdown) => {
  return markdown.replace(/\n{3,}/g, (match) => {
    const extraBreaks = match.length - 2;
    const spacers = Array.from({ length: extraBreaks }, () => "<div class=\"post-spacer\" aria-hidden=\"true\"></div>").join("\n");

    return `\n\n${spacers}\n\n`;
  });
};

const fetchMarkdownForLocale = async (slug, locale, originalLocale) => {
  const candidates = [];

  if (locale) {
    candidates.push({
      url: `./posts/${slug}.${locale}.md`,
      isTranslated: locale !== originalLocale,
    });
  }

  if (originalLocale && originalLocale !== locale) {
    candidates.push({
      url: `./posts/${slug}.${originalLocale}.md`,
      isTranslated: false,
    });
  }

  candidates.push({
    url: `./posts/${slug}.md`,
    isTranslated: false,
  });

  for (const candidate of candidates) {
    const response = await fetch(candidate.url);

    if (!response.ok) {
      continue;
    }

    return {
      markdown: await response.text(),
      isTranslated: candidate.isTranslated,
    };
  }

  throw new Error("Post not found");
};

const loadPost = async () => {
  if (isPostLoading) {
    return;
  }

  isPostLoading = true;
  await i18nReady;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    renderPostMessage(window.t("postPage.missingSlug"));
    return;
  }

  try {
    const postIndexResponse = await fetch("./data/notes.json");

    if (!postIndexResponse.ok) {
      throw new Error("Notes metadata not found");
    }

    const posts = await postIndexResponse.json();
    const postMeta = posts.find((post) => post.slug === slug);

    if (!postMeta) {
      throw new Error("Post metadata not found");
    }

    const localizedTitle = getLocalizedTitle(postMeta);
    const { markdown, isTranslated } = await fetchMarkdownForLocale(
      slug,
      getLocale(),
      postMeta.originalLocale || "ja",
    );
    const html = window.marked.parse(preserveMarkdownBlankLines(markdown));

    if (postContent) {
      postContent.innerHTML = `
        <header class="post-header">
          <h1 class="post-title">${localizedTitle}</h1>
          <div class="post-meta">
            <span class="post-meta-avatar" aria-hidden="true">${postMeta.avatar || "🐱"}</span>
            <span class="post-meta-author">${postMeta.author || "cat3lee"}</span>
            <span class="post-meta-separator" aria-hidden="true">·</span>
            <span class="post-meta-date">${formatPostDate(postMeta.date)}</span>
          </div>
          ${isTranslated ? `
            <p class="post-meta-note">
              <span>${window.t("postPage.translatedNotice")}</span>
              <a
                href="./post.html?slug=${slug}"
                class="post-meta-link"
                data-original-locale="${postMeta.originalLocale || "ja"}"
              >${window.t("postPage.viewOriginal")}</a>
            </p>
          ` : ""}
        </header>
        <div class="post-body">${html}</div>
      `;
    }

    const bodyFirstHeading = postContent?.querySelector(".post-body h1");

    if (bodyFirstHeading) {
      bodyFirstHeading.remove();
    }

    document.title = window.t("postPage.titleWithPost", {
      title: localizedTitle || window.t("postPage.title"),
    });
  } catch (error) {
    renderPostMessage(window.t("postPage.loadError"));
  } finally {
    isPostLoading = false;
  }
};

loadPost();

window.addEventListener("i18n:change", () => {
  loadPost();
});

if (postContent) {
  postContent.addEventListener("click", async (event) => {
    const originalLink = event.target.closest(".post-meta-link[data-original-locale]");

    if (!originalLink || typeof window.setLocale !== "function") {
      return;
    }

    event.preventDefault();
    await window.setLocale(originalLink.dataset.originalLocale);
  });
}
