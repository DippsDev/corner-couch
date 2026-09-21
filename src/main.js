import gsap from "gsap";
import { createChampagneViewer } from "./champagne.js";
import homeDj from "./assets/PHOTO-2026-09-01-11-21-46 2.jpg";
import homeCouch from "./assets/PHOTO-2026-09-01-11-21-45 3.jpg";
import homeSmile from "./assets/PHOTO-2026-09-01-11-21-44.jpg";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const bookPanel = document.querySelector("#bookPanel");
const bookForm = document.querySelector("#bookForm");
const bookDone = document.querySelector("#bookDone");
const bookSummary = document.querySelector("#bookSummary");
const bookSeat = document.querySelector("#bookSeat");
const bookKicker = document.querySelector("#bookKicker");
const bookTitle = document.querySelector("#bookTitle");
const paySeat = document.querySelector("#paySeat");
const seatChoice = document.querySelector("#seatChoice");
const seatButtons = [...document.querySelectorAll(".seat")];
const loader = document.querySelector("#loader");
const nav = document.querySelector("#nav");
const screens = [...document.querySelectorAll(".screen")];
const dockItems = [...document.querySelectorAll(".dock-item")];
const dockPanel = document.querySelector("#dock");
const homeVideo = document.querySelector("#homeVideo");
const homePhotos = document.querySelector("#homePhotos");
const seatLead = document.querySelector("#seatLead");
const ticketCode = document.querySelector("#ticketCode");
const ticketRows = document.querySelector("#ticketRows");
const ticketNote = document.querySelector("#ticketNote");
const bottlePriceLine = document.querySelector("#bottlePrice");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const COUCH_HOLD = 1500;
const bottleNames = {
  couch: "Just the Couch",
  hennessy: "Hennessy",
  "glenfiddich-12": "Glenfiddich 12+",
  "billiato-plus": "Billiato + another bottle",
  "hennessy-vsop": "Hennessy VSOP",
  "remy-vs": "Rémy Martin VS",
  "remy-vsop": "Rémy Martin VSOP",
};
const bottlePrices = {
  couch: 1500,
  hennessy: 1500,
  "glenfiddich-12": 1800,
  "billiato-plus": 1500,
  "hennessy-vsop": 2200,
  "remy-vs": 1600,
  "remy-vsop": 2400,
};
const seatCodes = {
  VIP: "VIP",
  "Section A": "A",
  "Section B": "B",
  "Section C": "C",
  Outside: "OUT",
};
const nightSeats = {
  "2026-09-24": { VIP: "held", "Section C": "taken" },
  "2026-09-25": { "Section A": "taken", Outside: "held" },
  "2026-09-26": { VIP: "taken", "Section B": "taken" },
  "2026-09-27": { Outside: "taken", "Section B": "held" },
  "2026-10-02": { "Section C": "held", Outside: "taken" },
};
const homeShots = [homeDj, homeCouch, homeSmile];

let pendingBooking = null;
let selectedSeat = "";
let currentScreen = "home";
let bookOpen = false;
let bookTween;
let dockTween;
let homePhotoTimer = 0;
let nightOccupancy = {};
const champagne = createChampagneViewer(document.querySelector("#orderChampagne"), {
  reduceMotion,
});

function lock(on) {
  document.body.classList.toggle("is-locked", on);
}

function revealPage() {
  window.scrollTo(0, 0);
  document.body.classList.add("is-ready");
  if (loader) {
    loader.setAttribute("aria-hidden", "true");
    loader.style.display = "none";
  }
  playHomeMedia();
}

function cueDock({ pace = "return" } = {}) {
  if (reduceMotion) {
    gsap.set([".dock-outer", ".dock-panel", ".dock-item"], { opacity: 1, y: 0, scale: 1 });
    return;
  }

  const fast = pace === "return";
  dockTween?.kill();
  gsap.set(".dock-outer", { opacity: 1 });
  gsap.set(".dock-panel", {
    y: fast ? 92 : 132,
    opacity: 0,
    scale: fast ? 0.96 : 0.94,
  });
  gsap.set(".dock-item", { y: fast ? 12 : 16, opacity: 0 });

  dockTween = gsap
    .timeline()
    .to(".dock-panel", {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: fast ? 0.55 : 1.05,
      ease: fast ? "back.out(1.22)" : "back.out(1.4)",
    })
    .to(
      ".dock-item",
      {
        y: 0,
        opacity: 1,
        duration: fast ? 0.26 : 0.42,
        stagger: fast ? 0.04 : 0.07,
        ease: "power2.out",
      },
      fast ? "-=0.36" : "-=0.62",
    );
}

function playIntro() {
  if (reduceMotion) {
    gsap.set([".nav", ".home__content", ".dock-outer", ".dock-panel", ".dock-item"], {
      opacity: 1,
      y: 0,
      scale: 1,
    });
    revealPage();
    return;
  }

  gsap.set(".dock-outer", { opacity: 0 });
  gsap.set(".dock-panel", { y: 132, opacity: 0, scale: 0.94 });

  const intro = gsap.timeline();
  intro
    .fromTo(
      ".loader__mark",
      { scale: 0.985 },
      { scale: 1, duration: 0.8, ease: "power2.out" },
    )
    .to(".loader__mark", { opacity: 0, duration: 0.32, delay: 0.35 })
    .to(".loader__bg", {
      scaleY: 0,
      duration: 0.8,
      ease: "power4.inOut",
      onComplete: revealPage,
    })
    .fromTo(
      ".nav",
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.35",
    )
    .fromTo(
      ".home__content",
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
      "-=0.4",
    )
    .add(() => cueDock({ pace: "intro" }), "+=0.28");
}

const fontsReady = document.fonts?.ready ?? Promise.resolve();
const logoImg = document.querySelector(".loader__logo");
const logoReady =
  !logoImg || logoImg.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
        logoImg.addEventListener("load", resolve, { once: true });
        logoImg.addEventListener("error", resolve, { once: true });
      });

Promise.race([
  Promise.all([fontsReady, logoReady]),
  new Promise((resolve) => setTimeout(resolve, 1800)),
]).then(() => requestAnimationFrame(playIntro));

const homeClips = import.meta.glob("./assets/home.{mp4,webm}", {
  eager: true,
  query: "?url",
  import: "default",
});
const homeClip = Object.values(homeClips)[0];

function initHomePhotos() {
  if (!homePhotos || homePhotos.childElementCount) return;

  homeShots.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.decoding = index === 0 ? "sync" : "async";
    if (index === 0) {
      img.fetchPriority = "high";
      img.classList.add("is-on");
    }
    homePhotos.append(img);
  });
}

function stopHomePhotos() {
  window.clearInterval(homePhotoTimer);
  homePhotoTimer = 0;
}

function playHomePhotos() {
  initHomePhotos();
  if (!homePhotos || reduceMotion) return;

  const frames = [...homePhotos.querySelectorAll("img")];
  if (frames.length < 2) return;

  stopHomePhotos();
  homePhotoTimer = window.setInterval(() => {
    const on = frames.findIndex((img) => img.classList.contains("is-on"));
    frames[on]?.classList.remove("is-on");
    frames[(on + 1) % frames.length]?.classList.add("is-on");
  }, 4000);
}

function playHomeMedia() {
  playHomePhotos();
  if (!homeVideo || !homeClip || reduceMotion) return;
  homeVideo.src = homeClip;
  homeVideo.muted = true;
  homeVideo.playsInline = true;
  homeVideo.loop = true;
  const start = () => {
    homeVideo.classList.add("is-on");
    homeVideo.play().catch(() => homeVideo.classList.remove("is-on"));
  };
  if (homeVideo.readyState >= 2) start();
  else homeVideo.addEventListener("canplay", start, { once: true });
}

function pauseHomeMedia() {
  stopHomePhotos();
  if (!homeVideo?.classList.contains("is-on")) return;
  homeVideo.pause();
}

initHomePhotos();

const themeColor = document.querySelector('meta[name="theme-color"]');
const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

function systemTheme() {
  return colorScheme.matches ? "dark" : "light";
}

function applyTheme() {
  const theme = systemTheme();
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#f6f6f4" : "#0a0a0a");
}

function syncDock(next) {
  dockItems.forEach((item) => {
    const on = item.dataset.screen === next;
    item.classList.toggle("is-active", on);
    item.setAttribute("aria-selected", on ? "true" : "false");
  });
}

function setNavLine(scrollTop = 0) {
  if (!nav) return;
  const range = 96;
  const faded = 0.28;
  const t = Math.min(1, Math.max(0, scrollTop / range));
  nav.style.setProperty("--nav-line", String(1 - t * (1 - faded)));
}

function activateScreen(next) {
  screens.forEach((screen) => {
    const on = screen.dataset.screen === next;
    screen.classList.toggle("is-active", on);
    if (on) screen.scrollTop = 0;
  });
  setNavLine(0);
  syncDock(next);
  champagne.setActive(next === "order");
  if (next === "home") playHomeMedia();
  else pauseHomeMedia();
}

screens.forEach((screen) => {
  screen.addEventListener(
    "scroll",
    () => {
      if (!screen.classList.contains("is-active")) return;
      setNavLine(screen.scrollTop);
    },
    { passive: true },
  );
});

function showScreen(id, { hash = true } = {}) {
  const next = screens.find((screen) => screen.dataset.screen === id) ? id : "home";
  currentScreen = next;
  document.body.dataset.screen = next;
  activateScreen(next);
  if (hash) {
    const url = next === "home" ? location.pathname + location.search : `#${next}`;
    history.replaceState(null, "", url);
  }
}

applyTheme();
colorScheme.addEventListener("change", applyTheme);

dockItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (bookOpen) closeBook({ immediate: true });
    showScreen(item.dataset.screen);
  });
});

document.querySelector(".nav__logo")?.addEventListener("click", (event) => {
  event.preventDefault();
  if (bookOpen) closeBook({ immediate: true });
  showScreen("home");
});

const initialHash = location.hash.replace("#", "");
if (initialHash && screens.some((screen) => screen.dataset.screen === initialHash)) {
  showScreen(initialHash, { hash: false });
} else {
  showScreen("home", { hash: false });
}

function initDockMagnify() {
  if (!dockPanel || reduceMotion) return;

  const base = 50;
  const mag = 70;
  const distance = 200;
  const stiffness = 0.28;
  const damping = 0.62;
  const sizes = dockItems.map(() => base);
  const velocities = dockItems.map(() => 0);
  let targets = dockItems.map(() => base);
  let mouseX = Infinity;
  let hovering = false;
  let raf = 0;

  function setSizes() {
    dockItems.forEach((item, index) => {
      const size = sizes[index];
      item.style.width = `${size}px`;
      item.style.height = `${size}px`;
    });
  }

  function tick() {
    let moving = false;
    dockItems.forEach((item, index) => {
      const force = (targets[index] - sizes[index]) * stiffness;
      velocities[index] = (velocities[index] + force) * damping;
      sizes[index] += velocities[index];
      if (Math.abs(velocities[index]) > 0.05 || Math.abs(targets[index] - sizes[index]) > 0.2) {
        moving = true;
      } else {
        sizes[index] = targets[index];
        velocities[index] = 0;
      }
    });
    setSizes();
    raf = moving || hovering ? requestAnimationFrame(tick) : 0;
  }

  function startTick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function updateTargets() {
    dockItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const delta = Math.abs(mouseX - center);
      targets[index] = delta >= distance ? base : base + (mag - base) * (1 - delta / distance);
    });
    startTick();
  }

  function enable() {
    dockPanel.addEventListener("mousemove", onMove);
    dockPanel.addEventListener("mouseleave", onLeave);
    dockItems.forEach((item) => {
      item.addEventListener("mouseenter", onItemEnter);
      item.addEventListener("mouseleave", onItemLeave);
      item.addEventListener("focus", onItemEnter);
      item.addEventListener("blur", onItemLeave);
    });
  }

  function disable() {
    dockPanel.removeEventListener("mousemove", onMove);
    dockPanel.removeEventListener("mouseleave", onLeave);
    dockItems.forEach((item) => {
      item.classList.remove("is-label-on");
      item.removeEventListener("mouseenter", onItemEnter);
      item.removeEventListener("mouseleave", onItemLeave);
      item.removeEventListener("focus", onItemEnter);
      item.removeEventListener("blur", onItemLeave);
      item.style.width = "";
      item.style.height = "";
    });
    hovering = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onMove(event) {
    hovering = true;
    mouseX = event.clientX;
    updateTargets();
  }

  function onLeave() {
    hovering = false;
    mouseX = Infinity;
    targets = dockItems.map(() => base);
    dockItems.forEach((item) => item.classList.remove("is-label-on"));
    startTick();
  }

  function onItemEnter(event) {
    event.currentTarget.classList.add("is-label-on");
  }

  function onItemLeave(event) {
    event.currentTarget.classList.remove("is-label-on");
  }

  if (finePointer.matches) enable();
  finePointer.addEventListener("change", (event) => {
    if (event.matches) enable();
    else disable();
  });
}

initDockMagnify();

const datepicker = document.querySelector(".datepicker");
const dateInput = bookForm.querySelector("input[name=date]");
const dateTrigger = document.querySelector("#dateTrigger");
const dateLabel = dateTrigger?.querySelector("[data-date-label]");
const eventLabel = dateTrigger?.querySelector("[data-event-label]");
const eventInput = bookForm?.querySelector("input[name=event]");
const eventByDate = Object.fromEntries(
  [...document.querySelectorAll(".events__list [data-open-book][data-date]")].flatMap((btn) => {
    const name = btn.querySelector(".events__name")?.textContent.trim();
    return name ? [[btn.dataset.date, name]] : [];
  }),
);
const datePop = document.querySelector("#datePop");
const dateGrid = datePop?.querySelector("[data-cal-grid]");
const dateMonth = datePop?.querySelector("[data-cal-month]");
const bookDrops = [...bookForm.querySelectorAll(".book-drop")];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let calCursor = new Date();
calCursor.setDate(1);

function pad(n) {
  return String(n).padStart(2, "0");
}

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplay(iso) {
  const [y, m, d] = iso.split("-");
  return `${d} / ${m} / ${y}`;
}

function eventNameFor(iso) {
  return eventByDate[iso] || "";
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function setPickedDate(iso) {
  if (!iso || !dateInput) return;
  dateInput.value = iso;
  if (dateLabel) dateLabel.textContent = formatDisplay(iso);
  const eventName = eventNameFor(iso);
  if (eventInput) eventInput.value = eventName;
  if (eventLabel) eventLabel.textContent = eventName;
  dateTrigger?.classList.add("is-filled");
  renderCalendar();
}

function closeDrop(drop) {
  drop?.classList.remove("is-open");
  drop?.querySelector(".book-drop__trigger")?.setAttribute("aria-expanded", "false");
}

function closeAllDrops(except) {
  bookDrops.forEach((drop) => {
    if (drop !== except) closeDrop(drop);
  });
}

function openDrop(drop) {
  if (!drop) return;
  closeAllDrops(drop);
  drop.classList.add("is-open");
  drop.querySelector(".book-drop__trigger")?.setAttribute("aria-expanded", "true");
}

function setDropValue(name, value) {
  const input = bookForm?.elements[name];
  if (!input || value == null) return;
  const drop = input.closest(".book-drop");
  if (!drop) {
    input.value = value;
    return;
  }
  const option = drop.querySelector(`[data-drop-option][data-value="${value}"]`);
  if (!option) return;
  input.value = value;
  const label = drop.querySelector("[data-drop-label]");
  if (label) label.textContent = optionLabel(option);
  drop.querySelector(".book-drop__trigger")?.classList.add("is-filled");
  drop.querySelectorAll("[data-drop-option]").forEach((btn) => {
    const on = btn === option;
    btn.classList.toggle("is-selected", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  if (name === "bottle" || name === "guests") syncBottlePolicy();
}

function closeDatepicker() {
  closeDrop(datepicker);
}

function animateCalendarIn() {
  if (reduceMotion || !datePop) return;
  const bits = datePop.querySelectorAll(".datepicker__nav, .datepicker__week span, [data-cal-grid] button");
  gsap.fromTo(
    bits,
    { y: 10, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.38, stagger: 0.012, ease: "power2.out", delay: 0.08 },
  );
}

function openDatepicker() {
  openDrop(datepicker);
  renderCalendar();
  animateCalendarIn();
}

function renderCalendar() {
  if (!dateGrid || !dateMonth) return;
  const year = calCursor.getFullYear();
  const month = calCursor.getMonth();
  dateMonth.textContent = `${monthNames[month]} ${year}`;

  const first = new Date(year, month, 1);
  const start = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = startOfDay(new Date());
  const selected = dateInput.value;

  dateGrid.replaceChildren();
  const cells = [];

  for (let i = 0; i < start; i += 1) {
    const spacer = document.createElement("span");
    spacer.className = "is-empty";
    cells.push(spacer);
  }

  for (let dayNum = 1; dayNum <= days; dayNum += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(dayNum);
    const cellDate = new Date(year, month, dayNum);
    const iso = toISO(cellDate);
    if (startOfDay(cellDate).getTime() === today.getTime()) btn.classList.add("is-today");
    if (selected === iso) btn.classList.add("is-selected");
    if (startOfDay(cellDate) < today) btn.disabled = true;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      setPickedDate(iso);
      closeDatepicker();
    });
    cells.push(btn);
  }
  dateGrid.append(...cells);
}

dateTrigger?.addEventListener("click", () => {
  if (datepicker.classList.contains("is-open")) closeDatepicker();
  else openDatepicker();
});

bookDrops.forEach((drop) => {
  if (drop.classList.contains("datepicker")) return;
  const trigger = drop.querySelector(".book-drop__trigger");
  trigger?.addEventListener("click", () => {
    if (drop.classList.contains("is-open")) closeDrop(drop);
    else openDrop(drop);
  });
  drop.querySelectorAll("[data-drop-option]").forEach((option) => {
    option.addEventListener("click", () => {
      const input = drop.querySelector("input[type=hidden]");
      if (input) setDropValue(input.name, option.dataset.value);
      closeDrop(drop);
    });
  });
});

syncBottlePolicy();

datePop?.querySelector("[data-cal-prev]")?.addEventListener("click", () => {
  calCursor.setMonth(calCursor.getMonth() - 1);
  renderCalendar();
  animateCalendarIn();
});

datePop?.querySelector("[data-cal-next]")?.addEventListener("click", () => {
  calCursor.setMonth(calCursor.getMonth() + 1);
  renderCalendar();
  animateCalendarIn();
});

document.addEventListener("pointerdown", (event) => {
  const openDropEl = bookDrops.find((drop) => drop.classList.contains("is-open"));
  if (!openDropEl) return;
  if (openDropEl.contains(event.target)) return;
  closeDrop(openDropEl);
});

function resetSeatStep() {
  selectedSeat = "";
  pendingBooking = null;
  nightOccupancy = {};
  seatButtons.forEach((btn) => {
    btn.classList.remove("is-on", "is-taken", "is-held");
    btn.setAttribute("aria-checked", "false");
    btn.removeAttribute("aria-disabled");
    btn.disabled = false;
  });
  document.querySelectorAll(".floorplan__zones rect").forEach((rect) => {
    rect.classList.remove("is-taken", "is-held");
  });
  if (seatChoice) seatChoice.textContent = "No section selected";
  if (paySeat) {
    paySeat.disabled = true;
    paySeat.textContent = "Hold table";
  }
}

function seatStatus(name) {
  return nightOccupancy[name] || "";
}

function formatPula(n) {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}P`;
}

function optionLabel(option) {
  return option.dataset.dropName || option.textContent.replace(/\s+/g, " ").trim();
}

function formPolicyKey() {
  return bookForm?.elements.bottle?.value || "couch";
}

function policyKey(data) {
  if (!data) return formPolicyKey();
  return data.bottle || "couch";
}

function holdFee(data) {
  return bottlePrices[policyKey(data)] || COUCH_HOLD;
}

function updatePolicyLine() {
  const key = formPolicyKey();
  const name = bottleNames[key] || "Table";
  const price = bottlePrices[key] || COUCH_HOLD;
  if (bottlePriceLine) bottlePriceLine.textContent = `${name} · ${formatPula(price)}`;
}

function syncBottlePolicy() {
  updatePolicyLine();
}

function occupancyFor(date) {
  return { ...(nightSeats[date] || { "Section A": "taken" }) };
}

function occupancyLine() {
  const taken = Object.entries(nightOccupancy)
    .filter(([, status]) => status === "taken")
    .map(([name]) => name);
  const held = Object.entries(nightOccupancy)
    .filter(([, status]) => status === "held")
    .map(([name]) => name);
  const bits = [];
  if (taken.length) bits.push(`${taken.join(" and ")} taken`);
  if (held.length) bits.push(`${held.join(" and ")} held`);
  const policy = "1 500P for the couch, or a bottle of that value";
  if (!bits.length) {
    return `${policy}. Choose your section.`;
  }
  return `${bits.join(". ")}. ${policy}.`;
}

function applyOccupancy(date) {
  nightOccupancy = occupancyFor(date);
  const zones = document.querySelectorAll(".floorplan__zones rect");

  seatButtons.forEach((btn) => {
    const status = seatStatus(btn.dataset.seat);
    btn.classList.remove("is-on", "is-taken", "is-held");
    btn.setAttribute("aria-checked", "false");
    btn.classList.toggle("is-taken", status === "taken");
    btn.classList.toggle("is-held", status === "held");
    btn.disabled = Boolean(status);
    if (status) btn.setAttribute("aria-disabled", "true");
    else btn.removeAttribute("aria-disabled");
    const label = btn.dataset.seat || "Section";
    btn.setAttribute("aria-label", status ? `${label}, ${status}` : label);
  });

  zones.forEach((rect) => {
    const status = seatStatus(rect.getAttribute("data-zone"));
    rect.classList.toggle("is-taken", status === "taken");
    rect.classList.toggle("is-held", status === "held");
  });

  selectedSeat = "";
  if (seatChoice) seatChoice.textContent = "No section selected";
  if (seatLead) seatLead.textContent = occupancyLine();
  if (paySeat) {
    paySeat.disabled = true;
    paySeat.textContent = `Hold table · ${formatPula(holdFee())}`;
  }
}

function ticketPass(data) {
  const [year, month, day] = String(data.date || "").split("-");
  const code = `CC-${day || "00"}${month || "00"}-${seatCodes[data.seat] || "TBL"}`;
  const rows = [
    ["Guest", data.name],
    ["Event", data.event],
    ["Table", bottleNames[policyKey(data)] || data.bottle],
    ["When", `${formatDisplay(data.date)} · ${data.time}`],
    ["Section", data.seat],
    ["Guests", data.guests],
    ["Entry", data.bottle === "couch" ? "Just the Couch" : "2 guests per bottle"],
    ["Hold", formatPula(data.fee)],
  ].filter(([, value]) => value);

  if (ticketCode) ticketCode.textContent = code;
  if (ticketRows) {
    ticketRows.replaceChildren(
      ...rows.map(([label, value]) => {
        const row = document.createElement("div");
        row.className = "ticket__row";
        const dt = document.createElement("span");
        dt.textContent = label;
        const dd = document.createElement("b");
        dd.textContent = value;
        row.append(dt, dd);
        return row;
      }),
    );
  }
  if (ticketNote) {
    ticketNote.textContent = `Show this pass at the door. Same copy lands on ${data.contact}.`;
  }
  return code;
}

function showBookStep(step) {
  const isForm = step === "form";
  const isSeat = step === "seat";
  const isDone = step === "done";
  bookForm.hidden = !isForm;
  if (bookSeat) bookSeat.hidden = !isSeat;
  bookDone.hidden = !isDone;
  if (bookKicker) bookKicker.hidden = isDone;
  if (bookTitle) bookTitle.hidden = isDone;
  if (bookKicker) {
    bookKicker.textContent = isSeat ? "Secure the table" : "Reservations";
  }
  if (bookTitle) {
    bookTitle.textContent = isSeat ? "Choose your seat." : "Book your couch";
  }
  if (isSeat && pendingBooking?.date) applyOccupancy(pendingBooking.date);
  if (isDone && !reduceMotion) {
    gsap.fromTo(
      ".ticket",
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
    );
  }
  const scroll = bookPanel.querySelector(".book__scroll");
  if (scroll) scroll.scrollTop = 0;
}

function openBook({ date } = {}, trigger) {
  resetSeatStep();
  showBookStep("form");
  setDropValue("bottle", "couch");
  if (date) setPickedDate(date);

  if (trigger?.classList.contains("nav__book") && !reduceMotion) {
    gsap.fromTo(
      trigger,
      { scale: 0.94 },
      { scale: 1, duration: 0.4, ease: "power2.out" },
    );
  }

  if (bookOpen) {
    bookForm.querySelector("#dateTrigger")?.focus();
    return;
  }

  bookOpen = true;
  bookPanel.classList.add("is-open");
  bookPanel.setAttribute("aria-hidden", "false");
  lock(true);
  bookTween?.kill();

  const inner = bookPanel.querySelector(".book__inner");
  const closeBtn = bookPanel.querySelector(".book__close");
  const scroll = bookPanel.querySelector(".book__scroll");
  const pieces = inner.querySelectorAll(".kicker, h2, .book-drop, label, form > button");

  if (scroll) scroll.scrollTop = 0;
  gsap.set([inner, closeBtn], { opacity: 1, y: 0, clearProps: "transform" });

  if (reduceMotion) {
    gsap.set(bookPanel, { autoAlpha: 1, clipPath: "none" });
    gsap.set(pieces, { opacity: 1, y: 0 });
    bookForm.querySelector("#dateTrigger")?.focus();
    return;
  }

  bookTween = gsap
    .timeline({
      onComplete: () => {
        gsap.set(bookPanel, { clipPath: "none" });
        bookForm.querySelector("#dateTrigger")?.focus();
      },
    })
    .set(bookPanel, { autoAlpha: 1 })
    .fromTo(
      bookPanel,
      { clipPath: "inset(0 0 0 100%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power4.inOut" },
    )
    .fromTo(
      closeBtn,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" },
      "-=0.4",
    )
    .fromTo(
      pieces,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.045, ease: "power3.out" },
      "-=0.5",
    );
}

function closeBook({ immediate = false } = {}) {
  if (!bookOpen && bookPanel.getAttribute("aria-hidden") === "true") {
    return;
  }

  closeAllDrops();
  bookOpen = false;
  bookPanel.classList.remove("is-open");
  bookTween?.kill();

  const finish = () => {
    const inner = bookPanel.querySelector(".book__inner");
    const closeBtn = bookPanel.querySelector(".book__close");
    bookPanel.setAttribute("aria-hidden", "true");
    gsap.set(bookPanel, { autoAlpha: 0, clipPath: "inset(0 0 0 100%)" });
    gsap.set([inner, closeBtn], { clearProps: "opacity,transform" });
    lock(false);
  };

  if (immediate || reduceMotion) {
    finish();
    return;
  }

  const inner = bookPanel.querySelector(".book__inner");
  const closeBtn = bookPanel.querySelector(".book__close");
  bookTween = gsap
    .timeline({ onComplete: finish })
    .set(bookPanel, { clipPath: "inset(0% 0% 0% 0%)" })
    .to([inner, closeBtn], {
      opacity: 0,
      y: -16,
      duration: 0.25,
      ease: "power2.in",
    })
    .to(
      bookPanel,
      { clipPath: "inset(0 0 0 100%)", duration: 0.55, ease: "power4.inOut" },
      "-=0.05",
    );
}

document.querySelectorAll("[data-open-book]").forEach((el) => {
  el.addEventListener("click", () => {
    openBook({ date: el.dataset.date }, el);
  });
});

document.querySelector("#bookClose").addEventListener("click", closeBook);
document.querySelector("[data-close-done]")?.addEventListener("click", closeBook);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (bookDrops.some((drop) => drop.classList.contains("is-open"))) {
    closeAllDrops();
    return;
  }
  if (bookOpen) closeBook();
});

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(bookForm));
  if (!data.date || !data.name || !data.contact) {
    dateTrigger?.focus();
    bookForm.reportValidity();
    return;
  }

  pendingBooking = data;
  showBookStep("seat");
});

seatButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.disabled || seatStatus(btn.dataset.seat)) return;
    selectedSeat = btn.dataset.seat || "";
    seatButtons.forEach((other) => {
      const on = other === btn;
      other.classList.toggle("is-on", on);
      other.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (seatChoice) seatChoice.textContent = `${selectedSeat} selected`;
    if (paySeat) {
      paySeat.disabled = false;
      paySeat.textContent = `Hold table · ${formatPula(holdFee())}`;
    }
  });
});

paySeat?.addEventListener("click", () => {
  if (!pendingBooking || !selectedSeat || seatStatus(selectedSeat)) return;
  const data = { ...pendingBooking, seat: selectedSeat, fee: holdFee() };
  const code = ticketPass(data);
  try {
    const bookings = JSON.parse(localStorage.getItem("cornercouch-bookings") || "[]");
    bookings.push({ ...data, code, createdAt: new Date().toISOString() });
    localStorage.setItem("cornercouch-bookings", JSON.stringify(bookings));
  } catch {
    /* Prototype hold still shows if storage is blocked. */
  }

  if (bookSummary) {
    const night = data.event ? `${data.event} · ` : "";
    bookSummary.textContent = `${data.name}, ${night}${bottleNames[policyKey(data)] || data.bottle} · ${formatPula(data.fee)} for ${data.guests} on ${data.date} at ${data.time}. ${data.seat} held. Pass ${code} sent to ${data.contact}.`;
  }
  showBookStep("done");
});

document.querySelector("[data-seat-back]")?.addEventListener("click", () => {
  showBookStep("form");
});

const drinkAccordions = [...document.querySelectorAll(".drinks__acc")];
const drinkScreen = document.querySelector(".screen--menu");
const drinkDur = 420;
const drinkEase = (t) => 1 - (1 - t) ** 3;

function drinkNavOffset() {
  return (nav?.getBoundingClientRect().height ?? 80) + 10;
}

function drinkTargetScroll(toggle) {
  if (!drinkScreen) return 0;
  const current = drinkScreen.scrollTop;
  const toggleTop = toggle.getBoundingClientRect().top;
  let collapseAbove = 0;

  drinkAccordions.forEach((other) => {
    if (other.classList.contains("is-open") && other.querySelector(".drinks__toggle") !== toggle) {
      const otherToggle = other.querySelector(".drinks__toggle");
      const panel = other.querySelector(".drinks__panel-inner");
      if (!otherToggle || !panel) return;
      if (otherToggle.getBoundingClientRect().top < toggleTop) {
        collapseAbove += panel.offsetHeight;
      }
    }
  });

  return Math.max(0, current + toggleTop - drinkScreen.getBoundingClientRect().top - drinkNavOffset() - collapseAbove);
}

function closeDrink(acc) {
  const toggle = acc.querySelector(".drinks__toggle");
  if (!acc.classList.contains("is-open")) return;
  acc.classList.remove("is-open");
  toggle?.setAttribute("aria-expanded", "false");
}

function scrollDrinkScreen(top) {
  if (!drinkScreen) return;
  if (reduceMotion) {
    drinkScreen.scrollTo({ top, behavior: "auto" });
    return;
  }

  const start = drinkScreen.scrollTop;
  const delta = top - start;
  if (Math.abs(delta) < 2) return;
  const t0 = performance.now();

  function step(now) {
    const t = Math.min(1, (now - t0) / drinkDur);
    drinkScreen.scrollTop = start + delta * drinkEase(t);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function openDrink(acc) {
  const toggle = acc.querySelector(".drinks__toggle");
  const targetScroll = toggle ? drinkTargetScroll(toggle) : drinkScreen?.scrollTop ?? 0;

  drinkAccordions.forEach((other) => {
    if (other !== acc) closeDrink(other);
  });

  acc.classList.add("is-open");
  toggle?.setAttribute("aria-expanded", "true");
  if (!toggle) return;
  scrollDrinkScreen(targetScroll);
}

drinkAccordions.forEach((acc) => {
  const toggle = acc.querySelector(".drinks__toggle");
  toggle?.addEventListener("click", () => {
    if (acc.classList.contains("is-open")) closeDrink(acc);
    else openDrink(acc);
  });
});
