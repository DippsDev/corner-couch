const STORAGE_KEY = "cornercouch-bookings";
const nights = [
  { date: "2026-09-24", when: "Thu 24.09", name: "Strictly Corner" },
  { date: "2026-09-25", when: "Fri 25.09", name: "Shamiso" },
  { date: "2026-09-26", when: "Sat 26.09", name: "Ladies Night Out" },
  { date: "2026-09-27", when: "Sun 27.09", name: "Throw Back Sundays" },
  { date: "2026-10-02", when: "Fri 02.10", name: "Drihana" },
];
const bottleNames = {
  couch: "Just the Couch",
  hennessy: "Hennessy",
  "glenfiddich-12": "Glenfiddich 12+",
  "billiato-plus": "Billiato + another bottle",
  "hennessy-vsop": "Hennessy VSOP",
  "remy-vs": "Rémy Martin VS",
  "remy-vsop": "Rémy Martin VSOP",
};
const seatCodes = {
  VIP: "VIP",
  "Section A": "A",
  "Section B": "B",
  "Section C": "C",
  Outside: "OUT",
};
const SEED = [
  {
    id: "seed-strictly-a",
    name: "Kago Dube",
    contact: "+267 72 441 190",
    date: "2026-09-24",
    event: "Strictly Corner",
    time: "22:00",
    guests: "6",
    bottle: "hennessy",
    seat: "Section A",
    fee: 1500,
    code: "CC-2409-A",
    status: "held",
    createdAt: "2026-09-21T12:10:00.000Z",
  },
  {
    id: "seed-strictly-out",
    name: "Amantle Pule",
    contact: "+267 71 883 204",
    date: "2026-09-24",
    event: "Strictly Corner",
    time: "22:00",
    guests: "4",
    bottle: "couch",
    seat: "Outside",
    fee: 1500,
    code: "CC-2409-OUT",
    status: "arrived",
    createdAt: "2026-09-21T12:18:00.000Z",
  },
  {
    id: "seed-shamiso-vip",
    name: "Thabo Molefe",
    contact: "+267 71 000 0000",
    date: "2026-09-25",
    event: "Shamiso",
    time: "22:00",
    guests: "8",
    bottle: "remy-vsop",
    seat: "VIP",
    fee: 2400,
    code: "CC-2509-VIP",
    status: "held",
    createdAt: "2026-09-21T13:02:00.000Z",
  },
  {
    id: "seed-shamiso-b",
    name: "Naledi Kgosi",
    contact: "+267 73 119 445",
    date: "2026-09-25",
    event: "Shamiso",
    time: "23:00",
    guests: "4",
    bottle: "couch",
    seat: "Section B",
    fee: 1500,
    code: "CC-2509-B",
    status: "arrived",
    createdAt: "2026-09-21T13:40:00.000Z",
  },
  {
    id: "seed-ladies-a",
    name: "Lesego Mothibi",
    contact: "+267 72 667 301",
    date: "2026-09-26",
    event: "Ladies Night Out",
    time: "22:00",
    guests: "6",
    bottle: "glenfiddich-12",
    seat: "Section A",
    fee: 1800,
    code: "CC-2609-A",
    status: "held",
    createdAt: "2026-09-21T14:11:00.000Z",
  },
  {
    id: "seed-sunday-vip",
    name: "Kagiso Tau",
    contact: "+267 74 220 918",
    date: "2026-09-27",
    event: "Throw Back Sundays",
    time: "22:00",
    guests: "10",
    bottle: "hennessy-vsop",
    seat: "VIP",
    fee: 2200,
    code: "CC-2709-VIP",
    status: "held",
    createdAt: "2026-09-21T15:04:00.000Z",
  },
];

const nightsEl = document.querySelector("#deskNights");
const listEl = document.querySelector("#deskList");
const statsEl = document.querySelector("#deskStats");
const searchEl = document.querySelector("#deskSearch");
const walkForm = document.querySelector("#deskWalk");
const walkDone = document.querySelector("#deskWalkDone");
const pageBook = document.querySelector("#pageBook");
const pageWalk = document.querySelector("#pageWalk");

let selectedDate = nights[0].date;
let statusFilter = "";
let query = "";
let deskPage = location.hash === "#walk-in" ? "walk" : "book";

function load() {
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(rows) ? rows.map(normalize) : [];
  } catch {
    return [];
  }
}

function save(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function normalize(row) {
  const night = nights.find((item) => item.date === row.date);
  return {
    ...row,
    id: row.id || `${row.code || "CC"}-${row.createdAt || row.contact || Math.random()}`,
    status: row.status || "held",
    event: row.event || night?.name || "",
  };
}

function seed() {
  const rows = load();
  const have = new Set(rows.map((row) => row.id));
  const extra = SEED.filter((row) => !have.has(row.id));
  if (extra.length) save([...rows, ...extra]);
}

function nightFor(date) {
  return nights.find((item) => item.date === date) || nights[0];
}

function formatPula(n) {
  return `${String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}P`;
}

function bookingKey(row) {
  return row.id;
}

function passCode(date, seat) {
  const [, month, day] = String(date).split("-");
  const tag = seatCodes[seat] || "TBL";
  const stamp = String(Date.now()).slice(-3);
  return `CC-${day}${month}-${tag}-${stamp}`;
}

function rowsForNight() {
  const q = query.trim().toLowerCase();
  return load().filter((row) => {
    if (row.date !== selectedDate) return false;
    if (statusFilter && row.status !== statusFilter) return false;
    if (!q) return true;
    return [row.name, row.contact, row.code, row.seat, row.event]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

function occupancy() {
  const map = {};
  load()
    .filter((row) => row.date === selectedDate && (row.status === "held" || row.status === "arrived"))
    .forEach((row) => {
      map[row.seat] = row.status === "arrived" ? "in" : map[row.seat] === "in" ? "in" : "held";
    });
  return map;
}

function setStatus(id, status) {
  save(load().map((row) => (row.id === id ? { ...row, status } : row)));
  render();
}

function renderNights() {
  const all = load();
  nightsEl.replaceChildren(
    ...nights.map((night) => {
      const count = all.filter((row) => row.date === night.date && row.status !== "noshow").length;
      const btn = document.createElement("button");
      btn.type = "button";
      if (night.date === selectedDate) btn.classList.add("is-on");
      const when = document.createElement("small");
      when.textContent = night.when;
      const name = document.createElement("span");
      name.textContent = night.name;
      btn.append(when, name);
      if (count) btn.title = `${count} on the book`;
      btn.addEventListener("click", () => {
        selectedDate = night.date;
        render();
      });
      return btn;
    }),
  );
}

function renderHead() {
  const night = nightFor(selectedDate);
  const when = document.querySelector("#deskNightWhen");
  const name = document.querySelector("#deskNightName");
  const walkKicker = document.querySelector("#walkKicker");
  if (when) when.textContent = night.when;
  if (name) name.textContent = night.name;
  if (walkKicker) walkKicker.textContent = `${night.when} · ${night.name}`;
  document.title = deskPage === "walk" ? "CornerCouch - Walk-in" : "CornerCouch - Staff";
}

function renderStats() {
  const rows = load().filter((row) => row.date === selectedDate);
  const held = rows.filter((row) => row.status === "held").length;
  const arrived = rows.filter((row) => row.status === "arrived").length;
  const noshow = rows.filter((row) => row.status === "noshow").length;
  const taken = Object.keys(occupancy()).length;
  const bits = [
    [held, "Held"],
    [arrived, "In"],
    [noshow, "No-show"],
    [`${taken}/5`, "Sections"],
  ];
  statsEl.replaceChildren(
    ...bits.map(([value, label]) => {
      const p = document.createElement("p");
      const b = document.createElement("b");
      b.textContent = String(value);
      const span = document.createElement("span");
      span.textContent = label;
      p.append(b, span);
      return p;
    }),
  );
}

function renderPages() {
  const onWalk = deskPage === "walk";
  document.body.classList.toggle("is-walk", onWalk);
  document.body.classList.toggle("is-book", !onWalk);
  if (pageBook) {
    pageBook.hidden = onWalk;
    pageBook.setAttribute("aria-hidden", onWalk ? "true" : "false");
  }
  if (pageWalk) {
    pageWalk.hidden = !onWalk;
    pageWalk.setAttribute("aria-hidden", onWalk ? "false" : "true");
  }
  document.querySelectorAll(".desk-pages [data-page]").forEach((link) => {
    const on = link.dataset.page === deskPage;
    link.classList.toggle("is-on", on);
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function renderList() {
  const rows = rowsForNight();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "desk-empty";
    empty.textContent = "No holds for this night yet.";
    listEl.replaceChildren(empty);
    return;
  }

  listEl.replaceChildren(
    ...rows.map((row) => {
      const card = document.createElement("article");
      card.className = `desk-card is-${row.status || "held"}`;

      const who = document.createElement("div");
      who.className = "desk-card__who";
      const title = document.createElement("strong");
      title.textContent = row.name;
      const meta = document.createElement("span");
      meta.textContent = [
        row.seat,
        row.code,
        `${row.guests} guests`,
        bottleNames[row.bottle] || row.bottle,
        formatPula(row.fee),
        row.contact,
      ]
        .filter(Boolean)
        .join("  ·  ");
      who.append(title, meta);

      const actions = document.createElement("div");
      actions.className = "desk-card__actions";
      [
        ["held", "Held"],
        ["arrived", "In"],
        ["noshow", "No-show"],
      ].forEach(([status, label]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        if (row.status === status) btn.classList.add("is-on");
        btn.addEventListener("click", () => setStatus(bookingKey(row), status));
        actions.append(btn);
      });

      card.append(who, actions);
      return card;
    }),
  );
}

function renderFilters() {
  document.querySelectorAll("#deskFilters [data-status]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.status === statusFilter);
  });
}

function render() {
  renderPages();
  renderHead();
  renderNights();
  renderFilters();
  renderStats();
  renderList();
}

document.querySelector("#deskFilters")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-status]");
  if (!btn) return;
  statusFilter = btn.dataset.status || "";
  render();
});

searchEl?.addEventListener("input", () => {
  query = searchEl.value;
  render();
});

walkForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(walkForm));
  const night = nightFor(selectedDate);
  const code = passCode(selectedDate, data.seat);
  const rows = load();
  rows.push({
    id: `walk-${Date.now()}`,
    name: data.name,
    contact: data.contact,
    date: selectedDate,
    event: night.name,
    time: "22:00",
    guests: data.guests || "2",
    bottle: "couch",
    seat: data.seat,
    fee: 1500,
    code,
    status: "held",
    createdAt: new Date().toISOString(),
  });
  save(rows);
  if (walkDone) {
    walkDone.hidden = false;
    walkDone.textContent = `Held · ${data.name} · ${data.seat} · ${code}`;
  }
  walkForm.reset();
  if (walkForm.elements.seat) walkForm.elements.seat.value = data.seat;
  walkForm.elements.name?.focus();
  render();
});

window.addEventListener("hashchange", () => {
  deskPage = location.hash === "#walk-in" ? "walk" : "book";
  render();
  if (deskPage === "walk") walkForm?.elements.name?.focus();
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && readSession()) render();
});

const SESSION_KEY = "cornercouch-staff-session";
const STAFF = [
  { name: "Door", pin: "2409" },
  { name: "Host", pin: "2409" },
  { name: "Manager", pin: "1500" },
];
const gate = document.querySelector("#staffGate");
const deskApp = document.querySelector("#deskApp");
const loginForm = document.querySelector("#staffLogin");
const loginError = document.querySelector("#staffLoginError");
const deskWho = document.querySelector("#deskWho");

function readSession() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (!raw?.name) return null;
    return STAFF.some((row) => row.name === raw.name) ? raw : null;
  } catch {
    return null;
  }
}

function writeSession(staff) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: staff.name, at: new Date().toISOString() }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function matchStaff(name, pin) {
  const who = String(name || "").trim().toLowerCase();
  const code = String(pin || "").trim();
  return STAFF.find((row) => row.name.toLowerCase() === who && row.pin === code) || null;
}

function showGate() {
  document.body.classList.add("is-gated");
  document.body.classList.remove("is-in");
  if (deskApp) {
    deskApp.hidden = true;
    deskApp.setAttribute("aria-hidden", "true");
    deskApp.inert = true;
  }
  if (gate) {
    gate.hidden = false;
    gate.removeAttribute("aria-hidden");
  }
  loginForm?.querySelector("input[name=staff]")?.focus();
}

function enterDesk(session = readSession()) {
  if (!session) {
    showGate();
    return;
  }
  document.body.classList.remove("is-gated");
  document.body.classList.add("is-in");
  if (gate) {
    gate.hidden = true;
    gate.setAttribute("aria-hidden", "true");
  }
  if (deskApp) {
    deskApp.hidden = false;
    deskApp.removeAttribute("aria-hidden");
    deskApp.inert = false;
  }
  if (deskWho) deskWho.textContent = session.name;
  seed();
  render();
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm));
  const staff = matchStaff(data.staff, data.pin);
  if (!staff) {
    if (loginError) loginError.hidden = false;
    loginForm.elements.pin.value = "";
    loginForm.elements.pin.focus();
    return;
  }
  if (loginError) loginError.hidden = true;
  writeSession(staff);
  loginForm.reset();
  enterDesk({ name: staff.name });
});

document.querySelector("#deskOut")?.addEventListener("click", () => {
  clearSession();
  showGate();
});

if (readSession()) enterDesk();
else showGate();
