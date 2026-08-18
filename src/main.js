import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const menu = document.querySelector("#menu");
const menuBtn = document.querySelector("#menuBtn");
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
let pendingBooking = null;
let selectedSeat = "";
const loader = document.querySelector("#loader");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const packNames = {
  "open-bar": "Package one",
  "vip-couch": "Package two",
  birthday: "Package three",
};

const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.08,
});

lenis.on("scroll", ScrollTrigger.update);
lenis.stop();

function revealPage() {
  window.scrollTo(0, 0);
  lenis.scrollTo(0, { immediate: true });
  document.body.classList.add("is-ready");
  if (loader) {
    loader.setAttribute("aria-hidden", "true");
    loader.style.display = "none";
  }
  lenis.start();
}

function playIntro() {
  if (reduceMotion) {
    gsap.set([".nav", ".hero__content", ".scroll-hint"], { opacity: 1, y: 0 });
    revealPage();
    return;
  }

  const intro = gsap.timeline();
  intro
    .from(".loader__word", {
      y: 28,
      opacity: 0,
      duration: 0.55,
      stagger: 0.1,
      ease: "power3.out",
    })
    .to(".loader__mark", { opacity: 0, duration: 0.28, delay: 0.12 })
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
      ".hero__content",
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
      "-=0.4",
    )
    .fromTo(
      ".scroll-hint",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.35",
    );
}

const fontsReady = document.fonts?.ready ?? Promise.resolve();
Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1200))]).then(
  () => requestAnimationFrame(playIntro),
);

document.querySelector(".scroll-hint")?.addEventListener("click", (event) => {
  event.preventDefault();
  const target = document.querySelector("#night");
  if (!target) return;
  lenis.scrollTo(target, { duration: 1.35, offset: 0 });
});

document.querySelector(".nav__logo")?.addEventListener("click", (event) => {
  event.preventDefault();
  if (menuOpen) closeMenu({ immediate: true });
  if (bookOpen) closeBook({ immediate: true });

  const distance = lenis.scroll;
  if (distance < 8) return;

  if (reduceMotion) {
    lenis.scrollTo(0, { immediate: true });
    return;
  }

  const duration = Math.min(2.4, Math.max(1.35, (distance / window.innerHeight) * 0.72));
  lenis.scrollTo(0, { duration, offset: 0 });
});

const stackPanels = gsap.utils.toArray(".stack > .hero, .stack > .scene");

stackPanels.forEach((panel, index) => {
  const next = stackPanels[index + 1];
  if (!next) return;

  const media = panel.querySelector(".hero__media, .scene__media");
  const copy = panel.querySelectorAll(".hero__content, .scene__copy, .scroll-hint");

  gsap.fromTo(
    media,
    { scale: 1, filter: "blur(0px)" },
    {
      scale: 1.12,
      filter: "blur(10px)",
      ease: "none",
      scrollTrigger: {
        trigger: next,
        start: "top bottom",
        end: "top top",
        scrub: true,
        immediateRender: false,
      },
    },
  );

  if (copy.length) {
    gsap.fromTo(
      copy,
      { opacity: 1 },
      {
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: next,
          start: "top bottom",
          end: "top top",
          scrub: true,
          immediateRender: false,
        },
      },
    );
  }
});

function lock(on) {
  document.body.classList.toggle("is-locked", on);
  if (on) lenis.stop();
  else if (document.body.classList.contains("is-ready")) lenis.start();
}

const nav = document.querySelector("#nav");
let menuOpen = false;
let menuTween;

lenis.on("scroll", ({ scroll }) => {
  if (!nav) return;
  nav.style.setProperty("--nav-line", String(1 - Math.min(1, scroll / 160)));
});

function openMenu() {
  if (menuOpen) return;
  menuOpen = true;
  menuBtn.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
  nav.classList.add("is-open");
  menu.classList.add("is-open");
  lock(true);

  const links = menu.querySelectorAll("a");
  const kicker = menu.querySelector(".kicker");
  menuTween?.kill();

  if (reduceMotion) {
    gsap.set(menu, { autoAlpha: 1, clipPath: "inset(0)" });
    gsap.set([kicker, links], { opacity: 1, y: 0 });
    return;
  }

  menuTween = gsap
    .timeline()
    .set(menu, { autoAlpha: 1 })
    .fromTo(
      menu,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0% 0 0% 0)", duration: 0.75, ease: "power4.inOut" },
    )
    .fromTo(
      kicker,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      "-=0.28",
    )
    .fromTo(
      links,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
        onComplete: () => gsap.set(links, { clearProps: "opacity,transform" }),
      },
      "-=0.28",
    );
}

function closeMenu({ immediate = false } = {}) {
  if (!menuOpen && menu.getAttribute("aria-hidden") === "true") {
    lock(false);
    return;
  }

  menuOpen = false;
  menuBtn.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
  menu.classList.remove("is-open");
  menuTween?.kill();

  const finish = () => {
    menu.setAttribute("aria-hidden", "true");
    gsap.set(menu, { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" });
    lock(false);
  };

  if (immediate || reduceMotion) {
    finish();
    return;
  }

  const links = menu.querySelectorAll("a");
  const kicker = menu.querySelector(".kicker");
  menuTween = gsap
    .timeline({ onComplete: finish })
    .to([kicker, links], {
      opacity: 0,
      y: -16,
      duration: 0.22,
      stagger: 0.025,
      ease: "power2.in",
    })
    .to(
      menu,
      { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: "power4.inOut" },
      "-=0.05",
    );
}

const datepicker = document.querySelector(".datepicker");
const dateInput = bookForm.querySelector("input[name=date]");
const dateTrigger = document.querySelector("#dateTrigger");
const dateLabel = dateTrigger?.querySelector("[data-date-label]");
const datePop = document.querySelector("#datePop");
const dateGrid = datePop?.querySelector("[data-cal-grid]");
const dateMonth = datePop?.querySelector("[data-cal-month]");
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

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function setPickedDate(iso) {
  if (!iso || !dateInput) return;
  dateInput.value = iso;
  if (dateLabel) dateLabel.textContent = formatDisplay(iso);
  dateTrigger?.classList.add("is-filled");
  renderCalendar();
}

function closeDatepicker() {
  datepicker?.classList.remove("is-open");
  dateTrigger?.setAttribute("aria-expanded", "false");
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
  datepicker?.classList.add("is-open");
  dateTrigger?.setAttribute("aria-expanded", "true");
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
  if (!datepicker?.classList.contains("is-open")) return;
  if (datepicker.contains(event.target)) return;
  closeDatepicker();
});

function resetSeatStep() {
  selectedSeat = "";
  pendingBooking = null;
  seatButtons.forEach((btn) => {
    btn.classList.remove("is-on");
    btn.setAttribute("aria-checked", "false");
  });
  if (seatChoice) seatChoice.textContent = "No section selected";
  if (paySeat) paySeat.disabled = true;
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
  const scroll = bookPanel.querySelector(".book__scroll");
  if (scroll) scroll.scrollTop = 0;
}

let bookOpen = false;
let bookTween;

function openBook({ date, pack } = {}, trigger) {
  closeMenu({ immediate: true });
  resetSeatStep();
  showBookStep("form");
  if (date) setPickedDate(date);
  if (pack) bookForm.pack.value = pack;

  if (trigger?.classList.contains("nav__book") && !reduceMotion) {
    gsap.fromTo(
      trigger,
      { scale: 0.94 },
      { scale: 1, duration: 0.4, ease: "power2.out" },
    );
  }

  if (bookOpen) {
    bookForm.querySelector("input, select")?.focus();
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
  const pieces = inner.querySelectorAll(".kicker, h2, .datepicker, label, form > button");

  if (scroll) scroll.scrollTop = 0;
  gsap.set([inner, closeBtn], { opacity: 1, y: 0, clearProps: "transform" });

  if (reduceMotion) {
    gsap.set(bookPanel, { autoAlpha: 1, clipPath: "none" });
    gsap.set(pieces, { opacity: 1, y: 0 });
    bookForm.querySelector("input, select")?.focus();
    return;
  }

  bookTween = gsap
    .timeline({
      onComplete: () => {
        gsap.set(bookPanel, { clipPath: "none" });
        bookForm.querySelector("input, select")?.focus();
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

  closeDatepicker();
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

menuBtn.addEventListener("click", () => {
  if (menuOpen) closeMenu();
  else openMenu();
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href?.startsWith("#")) {
      closeMenu();
      return;
    }

    event.preventDefault();
    closeMenu({ immediate: true });
    const target = document.querySelector(href);
    if (!target) return;
    lenis.scrollTo(target, {
      duration: reduceMotion ? 0 : 1.35,
      offset: 0,
      immediate: reduceMotion,
    });
  });
});

document.querySelectorAll("[data-open-book]").forEach((el) => {
  el.addEventListener("click", () => {
    openBook(
      {
        date: el.dataset.date,
        pack: el.dataset.pack,
      },
      el,
    );
  });
});

document.querySelector("#bookClose").addEventListener("click", closeBook);
document.querySelector("[data-close-done]")?.addEventListener("click", closeBook);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (menuOpen) closeMenu();
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
    selectedSeat = btn.dataset.seat || "";
    seatButtons.forEach((other) => {
      const on = other === btn;
      other.classList.toggle("is-on", on);
      other.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (seatChoice) seatChoice.textContent = `${selectedSeat} selected`;
    if (paySeat) paySeat.disabled = false;
  });
});

paySeat?.addEventListener("click", () => {
  if (!pendingBooking || !selectedSeat) return;
  const data = { ...pendingBooking, seat: selectedSeat, fee: 1500 };
  const bookings = JSON.parse(localStorage.getItem("cornercouch-bookings") || "[]");
  bookings.push({ ...data, createdAt: new Date().toISOString() });
  localStorage.setItem("cornercouch-bookings", JSON.stringify(bookings));

  bookSummary.textContent = `${data.name}, ${packNames[data.pack] || data.pack} for ${data.guests} on ${data.date} at ${data.time}. ${data.seat} held for 1500P. We’ll message ${data.contact}.`;
  showBookStep("done");
});

document.querySelector("[data-seat-back]")?.addEventListener("click", () => {
  showBookStep("form");
});

const drinkAccordions = [...document.querySelectorAll(".drinks__acc")];
const drinkEase = "power2.out";
const drinkDur = 0.85;
let drinkFollow;

function stopDrinkFollow() {
  if (!drinkFollow) return;
  gsap.ticker.remove(drinkFollow);
  drinkFollow = null;
}

function glideToggleIntoView(toggle) {
  stopDrinkFollow();
  const navH = document.querySelector(".nav")?.offsetHeight ?? 80;
  const offset = navH + 28;
  let frames = 0;

  drinkFollow = () => {
    const desired = lenis.scroll + toggle.getBoundingClientRect().top - offset;
    const distance = desired - lenis.scroll;
    if (Math.abs(distance) < 0.6 || frames++ > 96) {
      stopDrinkFollow();
      return;
    }
    lenis.scrollTo(lenis.scroll + distance * 0.055, { immediate: true });
  };

  gsap.ticker.add(drinkFollow);
}

function closeDrink(acc) {
  const toggle = acc.querySelector(".drinks__toggle");
  const panel = acc.querySelector(".drinks__panel");
  if (!acc.classList.contains("is-open")) return;
  stopDrinkFollow();
  acc.classList.remove("is-open");
  toggle?.setAttribute("aria-expanded", "false");
  if (reduceMotion) {
    gsap.set(panel, { height: 0 });
    return;
  }
  gsap.to(panel, { height: 0, duration: drinkDur, ease: drinkEase, overwrite: true });
}

function openDrink(acc) {
  const toggle = acc.querySelector(".drinks__toggle");
  const panel = acc.querySelector(".drinks__panel");
  drinkAccordions.forEach((other) => {
    if (other !== acc) closeDrink(other);
  });
  acc.classList.add("is-open");
  toggle?.setAttribute("aria-expanded", "true");
  if (reduceMotion) {
    gsap.set(panel, { height: "auto" });
    const navH = document.querySelector(".nav")?.offsetHeight ?? 80;
    lenis.scrollTo(toggle, { offset: -(navH + 28), immediate: true });
    return;
  }
  gsap.fromTo(
    panel,
    { height: 0 },
    {
      height: "auto",
      duration: drinkDur,
      ease: drinkEase,
      overwrite: true,
    },
  );
  glideToggleIntoView(toggle);
}

drinkAccordions.forEach((acc) => {
  const toggle = acc.querySelector(".drinks__toggle");
  gsap.set(acc.querySelector(".drinks__panel"), { height: 0 });
  toggle?.addEventListener("click", () => {
    if (acc.classList.contains("is-open")) closeDrink(acc);
    else openDrink(acc);
  });
});

