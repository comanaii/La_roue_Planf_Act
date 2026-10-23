"use strict";

// =====================================================
// QUI RAMÈNE QUOI ?
//
// Utilise le prénom et l’adresse Google de app.js.
// Une contribution par personne et par date.
// =====================================================

(() => {
  // ===================================================
  // 1. ÉLÉMENTS ET ÉTAT
  // ===================================================

  const elements = {
    date: document.querySelector("#apports-date"),
    refresh: document.querySelector("#apports-actualiser"),
    text: document.querySelector("#apports-texte"),
    save: document.querySelector("#apports-enregistrer"),
    remove: document.querySelector("#apports-supprimer"),
    identity: document.querySelector("#apports-identite"),
    message: document.querySelector("#apports-message"),
    list: document.querySelector("#apports-liste")
  };

  let contributions = [];
  let loading = false;
  let ready = false;

  let loadedDate = "";
  let loadedEndpoint = "";

  // ===================================================
  // 2. OUTILS
  // ===================================================

  function defaultDate() {
    const ritualDate = document.querySelector("#rituel-date");

    if (ritualDate?.value) {
      return ritualDate.value;
    }

    const date = new Date(day() + "T12:00:00Z");

    date.setUTCDate(
      date.getUTCDate() +
      (3 - date.getUTCDay() + 7) % 7
    );

    return date.toISOString().slice(0, 10);
  }

  function personalContribution() {
    return contributions.find((item) =>
      item.prenom === user
    );
  }

  function isCurrent() {
    return (
      ready &&
      loadedDate === elements.date.value &&
      loadedEndpoint === endpoint
    );
  }

  function message(text) {
    elements.message.textContent = text;
  }

  // ===================================================
  // 3. COMMUNICATION GOOGLE
  // ===================================================

  async function request(action, parameters) {
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
        throw new Error("Service Google indisponible.");
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(
          result.error || "Opération refusée."
        );
      }

      if (
        result.date !== parameters.date ||
        !Array.isArray(result.contributions)
      ) {
        throw new Error("Réponse Google inattendue.");
      }

      return result;

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Délai dépassé. Actualise pour vérifier " +
          "si la modification a été enregistrée."
        );
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  // ===================================================
  // 4. AFFICHAGE
  // ===================================================

  function render(updateText = false) {
    const available = isCurrent();
    const personal = available
      ? personalContribution()
      : null;

    const editable =
      available &&
      !loading &&
      Boolean(user) &&
      elements.date.value >= day();

    elements.date.disabled = loading;
    elements.refresh.disabled = loading;

    elements.text.disabled = !editable;

    elements.save.disabled =
      !editable ||
      !elements.text.value.trim();

    elements.remove.disabled =
      !editable ||
      !personal;

    elements.save.textContent = personal
      ? "Modifier ma contribution"
      : "Enregistrer ma contribution";

    elements.identity.textContent = user
      ? `Contribution de ${user}.`
      : "Choisis ton prénom en haut de la page.";

    if (updateText) {
      elements.text.value = personal?.texte || "";

      elements.save.disabled =
        !editable ||
        !elements.text.value.trim();
    }

    if (!available) {
      elements.list.innerHTML = `
        <p>
          Actualise pour afficher les contributions
          de cette date.
        </p>
      `;

      return;
    }

    if (!contributions.length) {
      elements.list.innerHTML = `
        <p>
          Personne ne s’est encore proposé.
          Les croissants attendent leur héros.
        </p>
      `;

      return;
    }

    elements.list.innerHTML = contributions
      .slice()
      .sort((a, b) =>
        a.prenom.localeCompare(b.prenom, "fr")
      )
      .map((item) => `
        <div class="row">
          <div>
            <strong>${esc(item.prenom)}</strong>

            <p class="apports-contribution">${esc(item.texte)}</p>
          </div>

          ${
            item.prenom === user
              ? '<span class="tag">Moi</span>'
              : ""
          }
        </div>
      `)
      .join("");
  }

  // ===================================================
  // 5. CHARGEMENT
  // ===================================================

  async function load() {
    if (loading) {
      return;
    }

    ready = false;
    render();

    if (!endpoint) {
      message(
        "Google Sheets doit être configuré pour partager " +
        "les contributions."
      );

      return;
    }

    if (!elements.date.value) {
      message("Choisis la date du rendez-vous.");
      return;
    }

    loading = true;
    message("Chargement des contributions…");
    render();

    const requestedDate = elements.date.value;
    const requestedEndpoint = endpoint;

    try {
      const result = await request(
        "contributions_lister",
        { date: requestedDate }
      );

      if (endpoint !== requestedEndpoint) {
        throw new Error(
          "La connexion a changé. Actualise."
        );
      }

      contributions = result.contributions;
      loadedDate = requestedDate;
      loadedEndpoint = requestedEndpoint;
      ready = true;

      message(
        "Consulte ce qui est prévu avant d’ajouter ta contribution."
      );

    } catch (error) {
      message("Chargement impossible : " + error.message);

    } finally {
      loading = false;
      render(true);
    }
  }

  // ===================================================
  // 6. ENREGISTREMENT ET SUPPRESSION
  // ===================================================

  async function update(remove = false) {
    if (
      loading ||
      !isCurrent() ||
      !user ||
      elements.date.value < day()
    ) {
      return;
    }

    const text = elements.text.value.trim();

    if (!remove && !text) {
      message("Indique ce que tu apportes.");
      return;
    }

    if (
      remove &&
      !window.confirm("Retirer ta contribution pour cette date ?")
    ) {
      return;
    }

    loading = true;
    message("Enregistrement…");
    render();

    const requestedEndpoint = endpoint;

    try {
      const result = await request(
        remove
          ? "contributions_supprimer"
          : "contributions_enregistrer",
        {
          date: elements.date.value,
          name: user,
          texte: text
        }
      );

      if (endpoint !== requestedEndpoint) {
        throw new Error(
          "La connexion a changé. Actualise."
        );
      }

      contributions = result.contributions;

      message(
        remove
          ? "Ta contribution a été retirée."
          : "Ta contribution est enregistrée pour le bureau."
      );

    } catch (error) {
      ready = false;

      message(
        "Modification non confirmée : " +
        error.message +
        " Clique sur Actualiser avant de réessayer."
      );

    } finally {
      loading = false;
      render(ready);
    }
  }

  // ===================================================
  // 7. ÉVÉNEMENTS
  // ===================================================

  elements.date.value = defaultDate();

  elements.date.addEventListener("change", () => {
    elements.text.value = "";
    load();
  });

  elements.refresh.addEventListener("click", () => {
    if (
      elements.text.value.trim() &&
      elements.text.value.trim() !==
        (personalContribution()?.texte || "") &&
      !window.confirm(
        "Actualiser et remplacer le texte non enregistré ?"
      )
    ) {
      return;
    }

    load();
  });

  elements.text.addEventListener("input", () => {
    render();
  });

  elements.save.addEventListener("click", () => {
    update(false);
  });

  elements.remove.addEventListener("click", () => {
    update(true);
  });

  document
    .querySelector("#profile")
    .addEventListener("change", () => {
      render(true);
    });

  document
    .querySelector('nav button[data-page="contributions"]')
    .addEventListener("click", () => {
      // Reprendre la date choisie dans le rituel.
      if (!loading) {
        elements.date.value = defaultDate();
        load();
      }
    });

  render(true);
})();