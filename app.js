const DEFAULT_CHARACTERS = [
  {
    id: "nagisa",
    name: "凪紗",
    reading: "Nagisa",
    accent: "#79d3ff",
    summary: "わたしはわたしの形にしたいんだ",
    profile: "",
    image: "",
  },
  {
    id: "kaede",
    name: "楓",
    reading: "Kaede",
    accent: "#f19b74",
    summary: "まだ名前のない場所へ行きたい",
    profile: "",
    image: "",
  },
  {
    id: "asami",
    name: "亜咲海",
    reading: "Asami",
    accent: "#caa2ff",
    summary: "この声が波になるまで",
    profile: "",
    image: "",
  },
  {
    id: "haruka",
    name: "ハルカ",
    reading: "Haruka",
    accent: "#8fd6a5",
    summary: "遠くても、ちゃんと届くよ",
    profile: "",
    image: "",
  },
  {
    id: "kirari",
    name: "星莉",
    reading: "Kirari",
    accent: "#d6b34e",
    summary: "未完成のまま光っていたい",
    profile: "",
    image: "",
  },
  {
    id: "production-notes",
    name: "制作ノート",
    reading: "Production Notes",
    accent: "#58a6b8",
    summary: "試したこと、比べたこと、作ってみたこと",
    profile: "AI動画、生成ツール、執筆環境、制作プロセスの比較検証や作ってみた記録。作品そのものではなく、制作の裏側をまとめています。",
    image: "assets/character/archive.jpeg",
  },
  {
    id: "uketara",
    name: "アーカイブ",
    reading: "Archive",
    accent: "#8f8b84",
    summary: "過去動画や分類前の作品",
    profile: "初期に作った動画や、キャラクター単位では置きにくい過去作品をまとめています。",
    image: "assets/character/archive.jpeg",
  },
];

const DEFAULT_HERO = {
  eyebrow: "Songs / Videos / Notes",
  title: "作品の置き場",
  lead: "キャラクターごとの曲、映像、記事を静かに並べています。",
  video: "",
  poster: "",
};

const PLATFORM_LABELS = {
  youtube: "YouTube",
  tiktok: "TikTok",
  note: "note",
  syosetu: "小説家になろう",
  site: "特設サイト",
};

const PLATFORM_MARKS = {
  youtube: "YT",
  tiktok: "TT",
  note: "nt",
  syosetu: "小",
  site: "特",
};

const TYPE_LABELS = {
  song: "Song",
  video: "Video",
  novel: "Novel",
  note: "Note",
};

const NON_CHARACTER_SECTION_IDS = new Set(["production-notes", "uketara"]);
const SECTION_KICKERS = {
  "production-notes": "Notes",
  uketara: "Archive",
};

const topNav = document.querySelector("#topNav");
const heroFaces = document.querySelector("#heroFaces");
const heroVideo = document.querySelector("#heroVideo");
const sectionsRoot = document.querySelector("#sections");
const statusNode = document.querySelector("#status");

init();

async function init() {
  try {
    const response = await fetch("site_works.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const works = Array.isArray(data.works) ? data.works.map(normalizeWork).filter((work) => !work.hidden) : [];
    const characters = resolveCharacters(data.characters, works);
    const hero = { ...DEFAULT_HERO, ...(data.hero || {}) };

    renderTopNav(characters);
    renderHero(works, characters, hero);
    renderSections(works, characters);
    revealOnScroll();
    statusNode.textContent = "";
  } catch (error) {
    statusNode.textContent = "作品データを読み込めませんでした。site_works.jsonを確認してください。";
    console.error(error);
  }
}

function normalizeWork(work) {
  return {
    ...work,
    section: work.section || work.character || "uketara",
  };
}

function resolveCharacters(configCharacters, works) {
  const defaultsById = Object.fromEntries(DEFAULT_CHARACTERS.map((character) => [character.id, character]));
  const configured = Array.isArray(configCharacters) ? configCharacters : DEFAULT_CHARACTERS;
  const merged = configured
    .map((character) => {
      const base = defaultsById[character.id] || {};
      return {
        ...base,
        ...character,
      };
    })
    .filter((character) => character.id);

  for (const defaultCharacter of DEFAULT_CHARACTERS) {
    if (!merged.some((character) => character.id === defaultCharacter.id)) {
      merged.push(defaultCharacter);
    }
  }

  return merged.map((character) => ({
    ...character,
    image: character.image || findRepresentativeImage(works.filter((work) => workBelongsToCharacter(work, character.id))),
  }));
}

function renderTopNav(characters) {
  topNav.innerHTML = characters
    .filter((character) => !NON_CHARACTER_SECTION_IDS.has(character.id))
    .map((character) => {
      const display = getCharacterDisplay(character);
      return `<a href="#${escapeAttribute(character.id)}">${escapeHtml(display.name)}</a>`;
    })
    .join("");
}

function renderHero(works, characters, hero) {
  document.querySelector(".hero .eyebrow").textContent = hero.eyebrow || DEFAULT_HERO.eyebrow;
  document.querySelector("#hero-title").textContent = hero.title || DEFAULT_HERO.title;
  document.querySelector(".lead").textContent = hero.lead || DEFAULT_HERO.lead;

  heroVideo.innerHTML = hero.video
    ? `
      <video autoplay muted loop playsinline ${hero.poster ? `poster="${escapeAttribute(hero.poster)}"` : ""}>
        <source src="${escapeAttribute(hero.video)}">
      </video>
    `
    : "";

  heroFaces.innerHTML = characters
    .filter((character) => !NON_CHARACTER_SECTION_IDS.has(character.id))
    .map((character) => {
      const display = getCharacterDisplay(character);
      const sectionWorks = works.filter((work) => workBelongsToCharacter(work, character.id));
      const style = [
        `--accent: ${character.accent || "#8f8b84"}`,
        character.image ? `--face-image: url(${escapeCssUrl(character.image)})` : "",
        `--face-x: ${getPercent(character.hero_face_x)}%`,
        `--face-y: ${getPercent(character.hero_face_y)}%`,
      ]
        .filter(Boolean)
        .join("; ");

      return `
        <a class="face-card" href="#${escapeAttribute(character.id)}" style="${style}">
          <span class="face-inner">
            <span class="face-name">${escapeHtml(display.name)}</span>
            <span class="face-count">${sectionWorks.length} works</span>
          </span>
        </a>
      `;
    })
    .join("");
}

function renderSections(works, characters) {
  sectionsRoot.innerHTML = characters.map((character) => {
    const display = getCharacterDisplay(character);
    const sectionWorks = works.filter((work) => workBelongsToCharacter(work, character.id));
    const cards = sectionWorks.length
      ? sectionWorks.map(renderWorkCard).join("")
      : `<p class="empty-section">まだ表示する作品がありません。</p>`;

    return `
      <section class="work-section" id="${escapeAttribute(character.id)}" style="--accent: ${character.accent || "#8f8b84"}" aria-labelledby="${escapeAttribute(character.id)}-title">
        <div class="section-head">
          <div class="profile-block">
            ${character.image ? `<img src="${escapeAttribute(character.image)}" alt="${escapeAttribute(display.name)}" loading="lazy">` : ""}
            <div>
              <div class="profile-title">
                <p class="section-kicker">${SECTION_KICKERS[character.id] || "Character"}</p>
                <h2 class="section-title" id="${escapeAttribute(character.id)}-title">${escapeHtml(display.name)}</h2>
                ${display.reading ? `<p class="section-reading">${escapeHtml(display.reading)}</p>` : ""}
              </div>
              <div class="profile-text">
                ${character.summary ? `<p class="character-quote">"${escapeHtml(character.summary)}"</p>` : ""}
                ${character.profile ? `<p class="section-profile">${escapeHtml(character.profile)}</p>` : ""}
              </div>
            </div>
          </div>
        </div>
        <div class="work-grid">${cards}</div>
      </section>
    `;
  }).join("");
}

function workBelongsToCharacter(work, characterId) {
  return getWorkCharacterIds(work).includes(characterId);
}

function getWorkCharacterIds(work) {
  const configured = Array.isArray(work.characters)
    ? work.characters.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  if (configured.length) {
    return [...new Set(configured)];
  }

  return [work.section || work.character || "uketara"];
}

function getCharacterDisplay(character) {
  const rawName = String(character.name || character.id || "").trim();
  const explicitReading = String(character.reading || "").trim();
  const match = rawName.match(/^(.+?)\s*[（(]\s*(.+?)\s*[）)]$/);
  if (!explicitReading && match) {
    return {
      name: match[1].trim(),
      reading: match[2].trim(),
    };
  }

  return {
    name: rawName,
    reading: explicitReading,
  };
}

function renderWorkCard(work) {
  if (work.type === "novel") {
    return renderNovelCard(work);
  }

  if (work.type === "note") {
    return renderNoteCard(work);
  }

  return renderMediaCard(work);
}

function renderMediaCard(work) {
  const thumbnail = work.thumbnail || "";
  const title = work.title || "Untitled";
  const description = work.description || "";
  const thumbnailPosition = getThumbnailPosition(work);

  return `
    <a class="work-card media-card" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">
      <span class="thumb">
        ${
          thumbnail
            ? `<img src="${escapeAttribute(thumbnail)}" alt="${escapeAttribute(title)}" loading="lazy" style="--thumb-y: ${thumbnailPosition}%">`
            : ""
        }
      </span>
      <span class="card-body">
        <span class="platform-row">
          ${renderPlatform(work.platform)}
          <span class="card-meta">${escapeHtml(TYPE_LABELS[work.type] || work.type || "Work")}</span>
        </span>
        <span class="card-title">${escapeHtml(title)}</span>
        ${description ? `<span class="card-description">${escapeHtml(truncate(description, 96))}</span>` : ""}
      </span>
    </a>
  `;
}

function renderNovelCard(work) {
  const meta = [work.genre, work.episodes ? `${work.episodes}話` : ""].filter(Boolean).join(" / ");
  const thumbnail = work.thumbnail || "";
  const thumbnailPosition = getThumbnailPosition(work);

  return `
    <a class="work-card novel-card${thumbnail ? " has-cover" : ""}" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">
      ${
        thumbnail
          ? `<span class="novel-cover"><img src="${escapeAttribute(thumbnail)}" alt="${escapeAttribute(work.title || "Untitled")}" loading="lazy" style="--thumb-y: ${thumbnailPosition}%"></span>`
          : ""
      }
      <span class="platform-row novel-meta">
        ${renderPlatform(work.platform || "syosetu")}
        <span class="card-meta">${escapeHtml(meta || "Novel")}</span>
      </span>
      <span class="novel-copy">
        <span class="card-title">${escapeHtml(work.title || "Untitled")}</span>
        ${work.subtitle ? `<span class="novel-subtitle">${escapeHtml(work.subtitle)}</span>` : ""}
        ${work.synopsis ? `<span class="novel-synopsis">${escapeHtml(truncate(work.synopsis, 118))}</span>` : ""}
      </span>
    </a>
  `;
}

function renderNoteCard(work) {
  const thumbnail = work.thumbnail || "";
  const thumbnailPosition = getThumbnailPosition(work);

  return `
    <a class="work-card note-card${thumbnail ? " has-banner" : ""}" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">
      ${
        thumbnail
          ? `<span class="note-banner"><img src="${escapeAttribute(thumbnail)}" alt="${escapeAttribute(work.title || "Untitled")}" loading="lazy" style="--thumb-y: ${thumbnailPosition}%"></span>`
          : ""
      }
      <span class="note-body">
        <span class="platform-row">
          ${renderPlatform(work.platform)}
          <span class="card-meta">${escapeHtml(TYPE_LABELS[work.type] || "Note")}</span>
        </span>
        <span class="card-title">${escapeHtml(work.title || "Untitled")}</span>
        ${work.description ? `<span class="card-description">${escapeHtml(truncate(work.description, 86))}</span>` : ""}
      </span>
    </a>
  `;
}

function renderPlatform(platform = "note") {
  const label = PLATFORM_LABELS[platform] || platform;
  const mark = PLATFORM_MARKS[platform] || label.slice(0, 2);

  return `
    <span class="platform-pill">
      <span class="platform-icon" aria-hidden="true">${escapeHtml(mark)}</span>
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function findRepresentativeImage(works) {
  const withImage = works.find((work) => work.thumbnail);
  return withImage ? withImage.thumbnail : "";
}

function getThumbnailPosition(work) {
  const value = Number(work.thumbnail_position);
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function revealOnScroll() {
  const sections = document.querySelectorAll(".work-section");

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );

  sections.forEach((section) => observer.observe(section));
}

function truncate(value, maxLength) {
  const text = String(value).trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function escapeCssUrl(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(")", "\\)");
}
