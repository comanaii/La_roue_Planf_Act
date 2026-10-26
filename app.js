"use strict";

// =====================================================
// 1. PRÉNOMS AUTORISÉS
// =====================================================

const names = [
  "Lionel",
  "Yann",
  "Yoann",
  "Guillaume",
  "Elodie",
  "Elise",
  "Sylvie",
  "Audrey",
  "Bertrand",
  "Max",
  "Benjamin",
  "Tristan",
  "Nicolas",
  "Cranico",
  "Jordan",
  "Séverine",
  "Sylvain",
  "Sandy"
];

// =====================================================
// 2. DÉFIS
//
// Chaque défi contient :
// [catégorie, titre, description]
// =====================================================

const challenges = [
  [
    "Mission du jour",
    "Le compliment incognito",
    "Glisse un compliment sincère à un collègue. " +
      "Discrétion niveau agent secret."
  ],
  [
    "Mission du jour",
    "Le bulletin météo",
    "Annonce la météo du bureau en une phrase : " +
      "« Éclaircies sur la planif, risque de café à 10 h. »"
  ],
  [
    "Mission du jour",
    "La pause qui rassemble",
    "Propose une pause de deux minutes à un collègue disponible. " +
      "Le café reste facultatif."
  ],
  [
    "Mission du jour",
    "Service après-sourire",
    "Donne un petit coup de main à un collègue qui en a envie. " +
      "Super-héros, mais sans la cape."
  ],
  [
    "Mission du jour",
    "Le slogan du jour",
    "Invente une devise pour la Planif et partage-la " +
      "à la prochaine pause."
  ],
  [
    "Mission du jour",
    "Détecteur de bonnes nouvelles",
    "Trouve une petite bonne nouvelle et partage-la à un collègue. " +
      "Même le retour du soleil compte."
  ],
  [
    "Petit gage",
    "Le grand discours",
    "Pendant une pause, remercie solennellement ton stylo " +
      "pour ses bons et loyaux services. Dix secondes maximum."
  ],
  [
    "Petit gage",
    "Expert en caféologie",
    "Décris ta boisson comme un grand critique gastronomique. " +
      "Une phrase suffit."
  ],
  [
    "Petit gage",
    "Le titre honorifique",
    "Présente-toi une fois comme « Ministre des créneaux " +
      "disponibles ». Seulement entre collègues joueurs."
  ],
  [
    "Petit gage",
    "Conférence de presse",
    "Raconte en vingt secondes comment tu as héroïquement " +
      "retrouvé un objet banal."
  ],
  [
    "Petit gage",
    "Le documentaire",
    "Commente le rangement de ton bureau comme un documentaire " +
      "animalier. À la pause, naturellement."
  ],
  [
    "Petit gage",
    "Poète de la Planif",
    "Compose deux vers sur les joies du planning. " +
      "Les rimes approximatives sont un patrimoine."
  ],
  [
    "Mot interdit",
    "On oublie « normalement »",
    "Pendant une heure, remplace « normalement » par " +
      "« selon les astres ». Hors échanges professionnels formels !"
  ],
  [
    "Mot interdit",
    "Le mot « urgent » prend sa pause",
    "Pendant la prochaine pause, remplace « urgent » " +
      "par « priorité cosmique »."
  ],
  [
    "Mot interdit",
    "Adieu « du coup »",
    "Pendant une heure entre collègues, remplace « du coup » " +
      "par « et là, coup de théâtre »."
  ],
  [
    "Mot interdit",
    "Le « planning » mystère",
    "Pendant la prochaine pause, parle du planning sans prononcer " +
      "ce mot. « La grande fresque temporelle » est accepté."
  ],
  [
    "Mot interdit",
    "On débranche « réunion »",
    "Pendant la prochaine pause, appelle les réunions " +
      "« rassemblements de cerveaux »."
  ],
  [
    "Mot interdit",
    "Pause du « café »",
    "Pendant la prochaine pause, appelle le café " +
      "« carburant officiel ». Le thé peut porter réclamation."
  ]
];

// =====================================================
// 3. CONFIGURATION
// =====================================================

const STORAGE_KEYS = {
  user: "planifUser",
  endpoint: "planifEndpoint",
  records: "planifRecords"
};

const CATEGORIES = [
  "Mission du jour",
  "Petit gage",
  "Mot interdit"
];

const WHEEL_COLORS = [
  "#ed9269",
  "#b7acd6",
  "#e3c980",
  "#efab87",
  "#c8bde0",
  "#efdb9e"
];

const WHEEL_LABELS = [
  "MISSION",
  "PETIT GAGE",
  "MOT INTERDIT",
  "MISSION",
  "PETIT GAGE",
  "MOT INTERDIT"
];

const WHEEL_SYMBOLS = ["✦", "☺", "!"];

// =====================================================
// 4. ÉTAT DE L’APPLICATION
// =====================================================

const $ = (selector) => document.querySelector(selector);

let user = readStorage(STORAGE_KEYS.user, "");

let endpoint = String(
  window.PLANIF_CONFIG?.GOOGLE_SCRIPT_URL ||
  readStorage(STORAGE_KEYS.endpoint, "")
).trim();

let records = [];
let busy = false;
let connected = false;
let angle = 0;
let toastTimer;
let activeDay = day();

if (!names.includes(user)) {
  user = "";
}

// =====================================================
// 5. OUTILS : STOCKAGE, DATE ET TEXTE
// =====================================================

function readStorage(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, value);
}

function readLocal() {
  try {
    const result = JSON.parse(
      readStorage(STORAGE_KEYS.records, "[]")
    );

    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

function day() {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const getPart = (type) =>
    parts.find((part) => part.type === type).value;

  return [
    getPart("year"),
    getPart("month"),
    getPart("day")
  ].join("-");
}

function updateDate() {
  $("#date").textContent = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeZone: "Europe/Paris"
  }).format(new Date());
}

function esc(value) {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => characters[character]
  );
}

function toast(message) {
  clearTimeout(toastTimer);

  $("#toast").textContent = message;
  $("#toast").classList.remove("hidden");

  toastTimer = setTimeout(() => {
    $("#toast").classList.add("hidden");
  }, 4500);
}

function current() {
  return records.find((record) =>
    record.day === day() &&
    record.name === user
  );
}

function randomIndex(count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Aucun défi disponible.");
  }

  const values = new Uint32Array(1);
  const limit = Math.floor(4294967296 / count) * count;

  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % count;
}

// =====================================================
// 6. COMMUNICATION AVEC GOOGLE SHEETS
// =====================================================

async function api(action, data = {}) {
  const url = new URL(endpoint);

  url.searchParams.set("action", action);

  Object.entries(data).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 20000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("Service indisponible.");
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.error || "Synchronisation refusée."
      );
    }

    if (!Array.isArray(result.records)) {
      throw new Error("Réponse Google Sheets inattendue.");
    }

    return result;

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Délai dépassé. Recharge la page pour vérifier " +
        "si l’opération a été enregistrée."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}

// =====================================================
// 7. CHARGEMENT ET ENREGISTREMENT
// =====================================================

async function load() {
  if (busy) {
    return;
  }

  busy = true;
  render();

  try {
    if (endpoint) {
      const result = await api("list");
      records = result.records;
    } else {
      records = readLocal();
    }

    connected = true;

  } catch (error) {
    connected = false;
    toast("Google Sheets inaccessible : " + error.message);

  } finally {
    busy = false;
    render();
  }
}

async function save(record) {
  if (endpoint) {
    try {
      const result = await api("save", record);

      records = result.records;
      connected = true;

      return result.record;

    } catch (error) {
      // Une requête interrompue peut avoir été enregistrée.
      // Un rechargement est nécessaire avant un autre tirage.
      connected = false;
      throw error;
    }
  }

  // Relire le stockage pour récupérer les changements
  // éventuellement effectués dans un autre onglet.
  const nextRecords = readLocal();

  const index = nextRecords.findIndex((item) =>
    item.day === record.day &&
    item.name === record.name
  );

  let savedRecord = record;

  if (index < 0) {
    if (record.status !== "À faire") {
      throw new Error("Tirage manquant.");
    }

    nextRecords.push(record);

  } else {
    const existing = nextRecords[index];

    // Conserver le défi déjà enregistré.
    savedRecord = existing;

    if (
      existing.status === "À faire" &&
      record.status !== "À faire"
    ) {
      savedRecord = {
        ...existing,
        status: record.status
      };

      nextRecords[index] = savedRecord;
    }
  }

  // Mettre l’état à jour uniquement après stockage réussi.
  writeStorage(
    STORAGE_KEYS.records,
    JSON.stringify(nextRecords)
  );

  records = nextRecords;

  return savedRecord;
}

// =====================================================
// 8. DESSIN DE LA ROUE
// =====================================================

function drawWheel() {
  const canvas = $("#wheel");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 6; index++) {
    const start = index * Math.PI / 3 - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(360, 360);

    ctx.arc(
      360,
      360,
      350,
      start,
      start + Math.PI / 3
    );

    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[index];
    ctx.fill();

    ctx.save();
    ctx.translate(360, 360);
    ctx.rotate(start + Math.PI / 6);

    ctx.textAlign = "center";
    ctx.fillStyle = "#403849";

    ctx.font = "bold 21px sans-serif";
    ctx.fillText(WHEEL_LABELS[index], 220, 6);

    ctx.font = "32px sans-serif";
    ctx.fillText(WHEEL_SYMBOLS[index % 3], 135, 10);

    ctx.restore();
  }
}

async function animateWheel(category) {
  const sector = CATEGORIES.indexOf(category);

  if (sector < 0) {
    throw new Error("Catégorie de défi inconnue.");
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const duration = reducedMotion ? 0 : 3800;
  const target = (360 - (sector * 60 + 30)) % 360;

  const correction = (
    target - (angle % 360) + 360
  ) % 360;

  angle += 1800 + correction;

  $("#wheel").style.transition =
    `transform ${duration}ms cubic-bezier(.15,.7,.16,1)`;

  $("#wheel").style.transform = `rotate(${angle}deg)`;

  if (duration > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, duration + 100);
    });
  }
}

// =====================================================
// 9. AFFICHAGE GÉNÉRAL
// =====================================================

function render() {
  const record = current();

  $("#profile").disabled = busy;
  $("#connect").disabled = busy;
  $("#local").disabled = busy;
  $("#endpoint").disabled = busy;

  $("#spin").disabled =
    busy ||
    !connected ||
    !user ||
    Boolean(record);

  if (busy) {
    $("#spinhelp").textContent = "Un petit instant…";

  } else if (!connected) {
    $("#spinhelp").textContent =
      "Connexion indisponible. Ouvre Le bureau " +
      "ou recharge la page pour réessayer.";

  } else if (!user) {
    $("#spinhelp").textContent =
      "Choisis ton prénom en haut pour tenter ta chance.";

  } else if (record) {
    $("#spinhelp").textContent =
      "Ton défi est tiré. La roue te retrouve demain !";

  } else {
    $("#spinhelp").textContent =
      `Prêt, ${user} ? Le hasard a un petit quelque chose pour toi.`;
  }

  renderConnection();
  renderMission(record);
  renderHistory();
}

function renderConnection() {
  if (endpoint) {
    $("#mode").textContent = busy
      ? "● Synchronisation…"
      : connected
        ? "● Google Sheets connecté"
        : "● Google Sheets indisponible";

    $("#syncstate").textContent = connected
      ? "Les tirages sont partagés via Google Sheets."
      : "Le service Google Sheets est configuré. " +
        "La connexion doit être vérifiée.";

    $("#historylabel").textContent = connected
      ? "Historique partagé via Google Sheets."
      : "Connexion indisponible : les données affichées " +
        "peuvent ne plus être à jour.";

  } else {
    $("#mode").textContent =
      "● Mode local · ce navigateur";

    $("#syncstate").textContent =
      "Aucun Google Sheet connecté. Les tirages sont " +
      "enregistrés uniquement sur ce navigateur.";

    $("#historylabel").textContent =
      "Historique local : seuls les tirages " +
      "de ce navigateur sont affichés.";
  }
}

// =====================================================
// 10. AFFICHAGE DU DÉFI PERSONNEL
// =====================================================

function renderMission(record) {
  if (!record) {
    const title = user
      ? `${esc(user)}, à toi de jouer.`
      : "Le destin prend son café.";

    $("#mission").innerHTML = `
      <div class="icon">☕</div>
      <h3>${title}</h3>
      <p>
        Un tour de roue, une petite aventure.
        Le destin est prêt.
      </p>
    `;

    return;
  }

  const actions = record.status === "À faire"
    ? `
      <button class="outline" id="done" type="button">
        ✓ Mission accomplie
      </button>
      <button class="outline" id="joker" type="button">
        Passer · joker
      </button>
    `
    : `
      <span class="tag">${esc(record.status)}</span>
    `;

  $("#mission").innerHTML = `
    <div class="icon">✦</div>
    <span class="pill">${esc(record.category)}</span>
    <h3>${esc(record.title)}</h3>
    <p>${esc(record.text)}</p>
    <div class="actionrow">${actions}</div>
  `;

  if ($("#done")) {
    $("#done").disabled = busy || !connected;
    $("#done").onclick = () => status("Accompli");
  }

  if ($("#joker")) {
    $("#joker").disabled = busy || !connected;
    $("#joker").onclick = () => status("Joker");
  }
}

// =====================================================
// 11. AFFICHAGE DE L’HISTORIQUE ET DES DÉFIS
// =====================================================

function renderHistory() {
  if (!records.length) {
    $("#history").innerHTML = `
      <p>
        Aucun tirage pour le moment.
        Le premier aventurier, c’est peut-être toi.
      </p>
    `;

    return;
  }

  $("#history").innerHTML = records
    .slice()
    .reverse()
    .map((record) => `
      <div class="row">
        <div>
          <strong>${esc(record.name)}</strong>
          · ${esc(record.title)}

          <p class="sub">
            ${esc(record.day)} · ${esc(record.category)}
          </p>
        </div>

        <span>${esc(record.status)}</span>
      </div>
    `)
    .join("");
}

function renderChallenges() {
  $("#challenges").innerHTML = challenges
    .map(([category, title, text]) => `
      <div class="card">
        <span class="pill">${esc(category)}</span>
        <h3>${esc(title)}</h3>
        <p>${esc(text)}</p>
      </div>
    `)
    .join("");
}

// =====================================================
// 12. TIRAGE DU DÉFI QUOTIDIEN
// =====================================================

async function spin() {
  if (busy || !connected || !user || current()) {
    return;
  }

  const drawDay = day();
  const drawUser = user;

  busy = true;
  render();

  try {
    const index = randomIndex(challenges.length);
    const [category, title, text] = challenges[index];

    await animateWheel(category);

    if (day() !== drawDay) {
      throw new Error(
        "La date a changé pendant le tirage. Réessaie."
      );
    }

    const savedRecord = await save({
      day: drawDay,
      name: drawUser,
      category,
      title,
      text,
      status: "À faire"
    });

    // Un autre appareil peut avoir tiré entre-temps.
    // Aligner la roue sur le résultat réellement conservé.
    if (
      savedRecord &&
      savedRecord.category !== category
    ) {
      await animateWheel(savedRecord.category);
    }

    toast(`Le destin a parlé, ${drawUser} !`);

  } catch (error) {
    toast("Tirage non confirmé : " + error.message);

  } finally {
    busy = false;
    render();
  }
}

// =====================================================
// 13. VALIDATION OU JOKER
// =====================================================

async function status(value) {
  if (busy || !connected) {
    return;
  }

  const record = current();

  if (!record || record.status !== "À faire") {
    return;
  }

  busy = true;
  render();

  try {
    await save({
      ...record,
      status: value
    });

    toast(
      value === "Joker"
        ? "Joker joué. Le droit à la tranquillité est respecté."
        : "Bien joué ! Le bureau te remercie."
    );

  } catch (error) {
    toast("Enregistrement non confirmé : " + error.message);

  } finally {
    busy = false;
    render();
  }
}

// =====================================================
// 14. RÉGLAGES DE CONNEXION
// =====================================================

async function connectGoogle() {
  if (busy) {
    return;
  }

  const value = $("#endpoint").value.trim();

  const validUrl =
    /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;

  if (!validUrl.test(value)) {
    toast(
      "Colle une URL Google Apps Script se terminant par /exec."
    );

    return;
  }

  const previousEndpoint = endpoint;
  const previousConnected = connected;

  busy = true;
  endpoint = value;

  $("#connectionmsg").textContent =
    "Vérification en cours…";

  render();

  try {
    const result = await api("list");

    writeStorage(STORAGE_KEYS.endpoint, endpoint);

    records = result.records;
    connected = true;

    $("#connectionmsg").textContent =
      "Connexion réussie. Les prochains tirages seront partagés.";

  } catch (error) {
    endpoint = previousEndpoint;
    connected = previousConnected;

    $("#connectionmsg").textContent =
      "Connexion impossible : " + error.message;

  } finally {
    busy = false;
    render();
  }
}

async function useLocalMode() {
  if (busy) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.endpoint);

  } catch (error) {
    toast(
      "Impossible de modifier le réglage local : " +
      error.message
    );

    return;
  }

  endpoint = "";
  connected = false;

  $("#endpoint").value = "";
  $("#connectionmsg").textContent = "";

  await load();
}

// =====================================================
// 15. NAVIGATION
// =====================================================

function setupNavigation() {
  document.querySelectorAll("nav button").forEach((button) => {
    button.onclick = () => {
      const targetPage = button.dataset.page;

      document.querySelectorAll(".page").forEach((page) => {
        page.classList.toggle(
          "hidden",
          page.id !== targetPage
        );
      });

      document.querySelectorAll("nav button").forEach((item) => {
        item.classList.toggle(
          "active",
          item === button
        );
      });

      if (targetPage === "equipe") {
        load();
      }
    };
  });
}

// =====================================================
// 16. AFFICHAGE ET COPIE DU SCRIPT GOOGLE
// =====================================================

async function loadScriptPreview() {
  try {
    const response = await fetch("apps-script/Code.gs");

    if (!response.ok) {
      throw new Error("Fichier introuvable.");
    }

    $("#script").textContent = await response.text();

  } catch {
    $("#script").textContent =
      "Le fichier apps-script/Code.gs n’est pas disponible ici.";
  }
}

async function copyScript() {
  try {
    const text = $("#script").textContent;

    if (!text.trim().includes("function doGet")) {
      toast("Le script Google n’est pas encore disponible.");
      return;
    }

    await navigator.clipboard.writeText(text);
    toast("Script copié.");

  } catch {
    toast(
      "Sélectionne le texte du script pour le copier."
    );
  }
}

// =====================================================
// 17. CHANGEMENT DE JOUR ET AUTRES ONGLETS
// =====================================================

function checkDayChange() {
  const today = day();

  if (today === activeDay || busy) {
    return;
  }

  activeDay = today;
  updateDate();
  load();
}

function setupSynchronization() {
  window.addEventListener("storage", (event) => {
    if (
      !endpoint &&
      !busy &&
      (event.key === STORAGE_KEYS.records || event.key === null)
    ) {
      records = readLocal();
      render();
    }
  });

  window.addEventListener("focus", checkDayChange);

  setInterval(checkDayChange, 30000);
}

// =====================================================
// 18. DÉMARRAGE
// =====================================================

function init() {
  names.forEach((name) => {
    $("#profile").add(new Option(name, name));
  });

  $("#profile").value = user;
  $("#endpoint").value = endpoint;

  $("#profile").onchange = (event) => {
    user = event.target.value;

    try {
      writeStorage(STORAGE_KEYS.user, user);
    } catch {
      toast(
        "Ton prénom ne pourra pas être mémorisé " +
        "sur ce navigateur."
      );
    }

    render();
  };

  $("#spin").onclick = spin;
  $("#connect").onclick = connectGoogle;
  $("#local").onclick = useLocalMode;
  $("#copy").onclick = copyScript;

  updateDate();
  drawWheel();
  renderChallenges();

  setupNavigation();
  setupSynchronization();

  loadScriptPreview();
  load();
}

init();
