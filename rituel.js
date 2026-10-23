"use strict";

// =====================================================
// RITUEL COLLECTIF DU BUREAU
//
// Utilise la configuration et le profil de app.js.
// Les résultats sont choisis par Google Apps Script.
//
// Ce fichier ne modifie pas les défis quotidiens.
// =====================================================

(() => {
  // ===================================================
  // 1. ÉLÉMENTS ET ÉTAT
  // ===================================================

  const elements = {
    date: document.querySelector("#rituel-date"),
    draw: document.querySelector("#rituel-tirer"),
    refresh: document.querySelector("#rituel-actualiser"),
    info: document.querySelector("#rituel-info"),
    result: document.querySelector("#rituel-resultat"),
    options: document.querySelector("#rituel-propositions"),
    history: document.querySelector("#rituel-historique")
  };

  let options = [];
  let history = [];

  let loading = false;
  let ready = false;
  let loadedEndpoint = "";
  let message = "";
  let lastDay = day();

  // ===================================================
  // 2. DATES
  // ===================================================

  function nextWednesday() {
    const date = new Date(day() + "T12:00:00Z");
    const offset = (3 - date.getUTCDay() + 7) % 7;

    date.setUTCDate(date.getUTCDate() + offset);

    return date.toISOString().slice(0, 10);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeZone: "UTC"
    }).format(new Date(value + "T12:00:00Z"));
  }

  function selectedResult() {
    return history.find((record) =>
      record.date === elements.date.value
    );
  }

  // ===================================================
  // 3. COMMUNICATION GOOGLE APPS SCRIPT
  //
  // Fonction indépendante de api() dans app.js :
  // les réponses du rituel n’ont pas de champ records.
  // ===================================================

  async function request(action, parameters = {}) {
    const url = new URL(endpoint);

    url.searchParams.set("action", action);

    Object.entries(parameters).forEach(([key, value]) => {
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
        throw new Error("Le service Google ne répond pas.");
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(
          result.error || "Opération refusée."
        );
      }

      if (!Array.isArray(result.historique)) {
        throw new Error("Réponse du rituel inattendue.");
      }

      return result;

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Délai dépassé. Clique sur Actualiser pour vérifier " +
          "si le résultat a été enregistré."
        );
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  // ===================================================
  // 4. CHARGEMENT
  // ===================================================

  async function loadRitual() {
    if (loading) {
      return;
    }

    if (!endpoint) {
      ready = false;
      options = [];
      history = [];
      loadedEndpoint = "";

      message =
        "Connecte Google Sheets dans Réglages pour utiliser " +
        "le rituel partagé.";

      renderRitual();
      return;
    }

    if (loadedEndpoint !== endpoint) {
      options = [];
      history = [];
    }

    loading = true;
    ready = false;
    message = "Chargement des rendez-vous…";

    renderRitual();

    const requestedEndpoint = endpoint;

    try {
      const result = await request("rituel_lister");

      if (endpoint !== requestedEndpoint) {
        message = "La connexion a changé. Clique sur Actualiser.";
        return;
      }

      if (!Array.isArray(result.propositions)) {
        throw new Error("Liste des propositions inattendue.");
      }

      options = result.propositions;
      history = result.historique;

      loadedEndpoint = requestedEndpoint;
      ready = true;
      message = "";

    } catch (error) {
      message = "Chargement impossible : " + error.message;

    } finally {
      loading = false;
      renderRitual();
    }
  }

  // ===================================================
  // 5. TIRAGE
  // ===================================================

  async function drawRitual() {
    if (
      loading ||
      !ready ||
      !endpoint ||
      loadedEndpoint !== endpoint ||
      !user ||
      !elements.date.value ||
      elements.date.value < day() ||
      selectedResult() ||
      options.length < 2
    ) {
      return;
    }

    const requestedDate = elements.date.value;
    const requestedUser = user;
    const requestedEndpoint = endpoint;

    loading = true;
    message = "Le bureau consulte son destin gastronomique…";

    renderRitual();

    try {
      const result = await request("rituel_tirer", {
        date: requestedDate,
        name: requestedUser
      });

      if (endpoint !== requestedEndpoint) {
        ready = false;

        message =
          "La connexion a changé. Clique sur Actualiser " +
          "pour retrouver le résultat.";

        return;
      }

      history = result.historique;

      message = result.dejaTire
        ? "Un collègue avait déjà tiré cette date : " +
          "voici le résultat partagé."
        : "Le menu est choisi ! Le résultat est enregistré " +
          "pour tout le bureau.";

    } catch (error) {
      // Une requête interrompue peut avoir été enregistrée.
      // Exiger un rechargement avant une nouvelle tentative.
      ready = false;

      message =
        "Tirage non confirmé : " + error.message +
        " Actualise avant de réessayer.";

    } finally {
      loading = false;
      renderRitual();
    }
  }

  // ===================================================
  // 6. AFFICHAGE DES COMMANDES
  // ===================================================

  function renderRitual() {
    const result = selectedResult();

    const available =
      ready &&
      Boolean(endpoint) &&
      loadedEndpoint === endpoint;

    elements.date.disabled = loading;
    elements.refresh.disabled = loading;

    elements.draw.disabled =
      loading ||
      !available ||
      !user ||
      !elements.date.value ||
      elements.date.value < day() ||
      Boolean(result) ||
      options.length < 2;

    elements.draw.textContent = loading
      ? "Un petit instant…"
      : result
        ? "Rituel déjà tiré ✓"
        : "Tirer le rituel ✦";

    let help = message;

    if (!help) {
      if (!available) {
        help = "Clique sur Actualiser pour charger les rituels.";

      } else if (!elements.date.value) {
        help = "Choisis une date pour le rendez-vous.";

      } else if (result) {
        help = "Ce résultat est commun à tout le bureau.";

      } else if (elements.date.value < day()) {
        help = "Choisis aujourd’hui ou une date à venir.";

      } else if (!user) {
        help = "Choisis ton prénom en haut de la page.";

      } else if (options.length < 2) {
        help =
          "Active au moins deux propositions différentes " +
          "dans Google Sheets.";

      } else {
        help =
          "Un seul tirage sera conservé pour cette date, " +
          "quel que soit le collègue qui clique.";
      }
    }

    elements.info.textContent = help;

    renderResult(result);
    renderOptions();
    renderHistory();
  }

  // ===================================================
  // 7. RÉSULTAT POUR LA DATE CHOISIE
  // ===================================================

  function renderResult(result) {
    if (!result) {
      elements.result.innerHTML = `
        <div class="icon" aria-hidden="true">🍽️</div>

        <h3>Le menu garde le suspense.</h3>

        <p>
          Choisis la date du rendez-vous,
          puis lance le tirage collectif.
        </p>
      `;

      return;
    }

    elements.result.innerHTML = `
      <span class="eyebrow">
        ${esc(formatDate(result.date))}
      </span>

      <h3>${esc(result.titre)}</h3>

      <p>${esc(result.description)}</p>

      <p class="sub">
        Tirage lancé par ${esc(result.prenom)}.
        ${ready ? "" : "Résultat à actualiser."}
      </p>
    `;
  }

  // ===================================================
  // 8. PROPOSITIONS ACTIVES
  // ===================================================

  function renderOptions() {
    elements.options.innerHTML = options.length
      ? options.map((option) => `
          <div class="card">
            <span class="pill">Au menu</span>

            <h3>${esc(option.titre)}</h3>

            <p>${esc(option.description)}</p>
          </div>
        `).join("")
      : `
          <p>
            Les propositions apparaîtront après le chargement
            de Google Sheets.
          </p>
        `;
  }

  // ===================================================
  // 9. HISTORIQUE COLLECTIF
  // ===================================================

  function renderHistory() {
    if (!history.length) {
      elements.history.innerHTML = `
        <p>Aucun rendez-vous tiré pour le moment.</p>
      `;

      return;
    }

    elements.history.innerHTML = history
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((record) => `
        <div class="row">
          <div>
            <strong>${esc(record.titre)}</strong>

            <p class="sub">
              ${esc(formatDate(record.date))}
            </p>
          </div>

          <span>${esc(record.prenom)}</span>
        </div>
      `)
      .join("");
  }

  // ===================================================
  // 10. ÉVÉNEMENTS ET DÉMARRAGE
  // ===================================================

  elements.date.value = nextWednesday();

  elements.date.addEventListener("change", () => {
    message = "";
    renderRitual();
  });

  elements.draw.addEventListener("click", drawRitual);
  elements.refresh.addEventListener("click", loadRitual);

  document
    .querySelector("#profile")
    .addEventListener("change", renderRitual);

  document
    .querySelector('nav button[data-page="rituel"]')
    .addEventListener("click", loadRitual);

  // Recharger les données partagées quand on revient
  // sur l’onglet du navigateur avec le rituel ouvert.
  window.addEventListener("focus", () => {
    if (!document.querySelector("#rituel").classList.contains("hidden")) {
      loadRitual();
    }
  });

  // Mettre à jour la proposition du mercredi si la page
  // reste ouverte lors du changement de journée.
  setInterval(() => {
    const today = day();

    if (today === lastDay || loading) {
      return;
    }

    lastDay = today;

    if (!elements.date.value || elements.date.value < today) {
      elements.date.value = nextWednesday();
    }

    renderRitual();
  }, 30000);

  renderRitual();
})();