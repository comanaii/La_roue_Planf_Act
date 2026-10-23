"use strict";

// =====================================================
// COMMANDE MINE
//
// Compteur local de boissons.
// Aucun échange avec Google Sheets.
// =====================================================

(() => {
  // ===================================================
  // 1. CARTE DES BOISSONS
  //
  // Conserver les identifiants pour retrouver
  // les quantités enregistrées.
  // ===================================================

  const DRINKS = [
    { id: "blonde", name: "Bière Blonde" },
    { id: "rouge", name: "Bière Rouge" },
    { id: "dsp", name: "DSP" },
    { id: "bouteille", name: "Bière Bouteille" },
    { id: "moment", name: "Bière du Moment" },
    { id: "coca", name: "Coca" },
    { id: "perrier", name: "Perrier" },
    { id: "perrier-sirop", name: "Perrier Sirop" },
    { id: "orangina", name: "Orangina" },
    { id: "fuze-tea", name: "Fuze Tea" }
  ];

  const STORAGE_KEY = "planif.commandeMine.v1";

  const elements = {
    drinks: document.querySelector("#mine-boissons"),
    total: document.querySelector("#mine-total"),
    text: document.querySelector("#mine-texte"),
    copy: document.querySelector("#mine-copier"),
    whatsapp: document.querySelector("#mine-whatsapp"),
    undo: document.querySelector("#mine-annuler"),
    reset: document.querySelector("#mine-effacer"),
    message: document.querySelector("#mine-message")
  };

  let quantities = emptyOrder();
  let previousOrder = null;
  let storageAvailable = true;

  // ===================================================
  // 2. DONNÉES ET STOCKAGE
  // ===================================================

  function emptyOrder() {
    return Object.fromEntries(
      DRINKS.map((drink) => [drink.id, 0])
    );
  }

  function normalizeOrder(value) {
    const result = emptyOrder();

    if (!value || typeof value !== "object") {
      return result;
    }

    DRINKS.forEach((drink) => {
      const quantity = value[drink.id];

      if (
        Number.isSafeInteger(quantity) &&
        quantity >= 0
      ) {
        result[drink.id] = quantity;
      }
    });

    return result;
  }

  function loadOrder() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      quantities = raw === null
        ? emptyOrder()
        : normalizeOrder(JSON.parse(raw));

      storageAvailable = true;

    } catch {
      storageAvailable = false;

      showMessage(
        "Le stockage local est indisponible ou illisible. " +
        "La commande reste utilisable sur cette page, " +
        "mais sa conservation n’est pas garantie."
      );
    }
  }

  function saveOrder() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(quantities)
      );

      storageAvailable = true;
      return true;

    } catch {
      storageAvailable = false;

      showMessage(
        "La commande est affichée, mais le navigateur " +
        "ne permet pas de l’enregistrer. " +
        "Copie-la avant de fermer la page."
      );

      return false;
    }
  }

  // ===================================================
  // 3. CALCUL ET RÉCAPITULATIF
  // ===================================================

  function total() {
    return DRINKS.reduce(
      (sum, drink) => sum + quantities[drink.id],
      0
    );
  }

  function orderText() {
    const count = total();

    if (!count) {
      return "La commande est vide.";
    }

    const lines = DRINKS
      .filter((drink) => quantities[drink.id] > 0)
      .map((drink) =>
        `${quantities[drink.id]} × ${drink.name}`
      );

    return [
      "COMMANDE MINE",
      "",
      ...lines,
      "",
      `Total : ${count} boisson${count > 1 ? "s" : ""}`
    ].join("\n");
  }

  function showMessage(message) {
    elements.message.textContent = message;
  }

  // ===================================================
  // 4. CRÉATION DES COMPTEURS
  // ===================================================

  function createCounters() {
    DRINKS.forEach((drink) => {
      const card = document.createElement("div");
      card.className = "card mine-boisson";
      card.id = `mine-carte-${drink.id}`;

      const title = document.createElement("h3");
      title.textContent = drink.name;

      const controls = document.createElement("div");
      controls.className = "mine-compteur";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "outline";
      minus.id = `mine-moins-${drink.id}`;
      minus.textContent = "−";

      minus.setAttribute(
        "aria-label",
        `Retirer une ${drink.name}`
      );

      minus.addEventListener("click", () => {
        changeQuantity(drink.id, -1);
      });

      const quantity = document.createElement("span");
      quantity.className = "mine-quantite";
      quantity.id = `mine-quantite-${drink.id}`;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "primary";
      plus.textContent = "+";

      plus.setAttribute(
        "aria-label",
        `Ajouter une ${drink.name}`
      );

      plus.addEventListener("click", () => {
        changeQuantity(drink.id, 1);
      });

      controls.append(minus, quantity, plus);
      card.append(title, controls);

      elements.drinks.append(card);
    });
  }

  // ===================================================
  // 5. AFFICHAGE
  // ===================================================

  function renderOrder() {
    const count = total();

    elements.total.textContent =
      `${count} boisson${count > 1 ? "s" : ""}`;

    elements.text.value = orderText();

    elements.copy.disabled = count === 0;
    elements.whatsapp.disabled = count === 0;
    elements.reset.disabled = count === 0;
    elements.undo.disabled = previousOrder === null;

    DRINKS.forEach((drink) => {
      const quantity = quantities[drink.id];

      document.querySelector(
        `#mine-quantite-${drink.id}`
      ).textContent = quantity;

      document.querySelector(
        `#mine-moins-${drink.id}`
      ).disabled = quantity === 0;

      document.querySelector(
        `#mine-carte-${drink.id}`
      ).classList.toggle(
        "mine-selectionnee",
        quantity > 0
      );
    });
  }

  // ===================================================
  // 6. AJOUT ET RETRAIT
  // ===================================================

  function changeQuantity(id, change) {
    const nextQuantity = quantities[id] + change;

    if (
      !Number.isSafeInteger(nextQuantity) ||
      nextQuantity < 0
    ) {
      return;
    }

    previousOrder = { ...quantities };
    quantities[id] = nextQuantity;

    if (saveOrder()) {
      showMessage("");
    }

    renderOrder();
  }

  // ===================================================
  // 7. ANNULER LE DERNIER CHANGEMENT
  // ===================================================

  function undoChange() {
    if (previousOrder === null) {
      return;
    }

    quantities = { ...previousOrder };
    previousOrder = null;

    if (saveOrder()) {
      showMessage("Dernier changement annulé.");
    }

    renderOrder();
  }

  // ===================================================
  // 8. NOUVELLE COMMANDE
  // ===================================================

  function resetOrder() {
    if (!total()) {
      return;
    }

    const confirmed = window.confirm(
      "Remettre toutes les boissons à zéro " +
      "pour commencer une nouvelle commande ?"
    );

    if (!confirmed) {
      return;
    }

    previousOrder = { ...quantities };
    quantities = emptyOrder();

    if (saveOrder()) {
      showMessage(
        "Nouvelle commande prête. " +
        "Tu peux encore annuler cette remise à zéro."
      );
    }

    renderOrder();
  }

  // ===================================================
  // 9. COPIE DU BON DE COMMANDE
  // ===================================================

  async function copyOrder() {
    if (!total()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(orderText());

      showMessage(
        "Commande copiée. Tu peux la coller dans un message."
      );

    } catch {
      elements.text.focus();
      elements.text.select();

      showMessage(
        "Le récapitulatif est sélectionné. " +
        "Appuie sur Ctrl + C pour le copier."
      );
    }
  }

  // ===================================================
  // 10. SYNCHRONISATION ENTRE ONGLETS DU NAVIGATEUR
  //
  // Ne partage pas la commande entre ordinateurs.
  // ===================================================

  window.addEventListener("storage", (event) => {
    if (
      event.key !== STORAGE_KEY &&
      event.key !== null
    ) {
      return;
    }

    previousOrder = null;
    loadOrder();
    renderOrder();

    if (storageAvailable) {
      showMessage(
        "Commande actualisée depuis un autre onglet."
      );
    }
  });

// ===================================================
// PARTAGE SUR WHATSAPP
// ===================================================

  function shareWhatsApp() {
    if (!total()) {
      return;
    }

    const url =
      "https://wa.me/?text=" +
      encodeURIComponent(orderText());

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ===================================================
  // 11. DÉMARRAGE
  // ===================================================

  elements.copy.addEventListener("click", copyOrder);
    elements.whatsapp.addEventListener(
    "click",
    shareWhatsApp
  );
  elements.undo.addEventListener("click", undoChange);
  elements.reset.addEventListener("click", resetOrder);

  loadOrder();
  createCounters();
  renderOrder();
})();