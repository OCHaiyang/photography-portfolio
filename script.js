const landingImages = [
  "DSCF2202.jpg",
  "DSCF3308.jpg",
  "DSCF3345.jpg",
  "DSCF2484.jpg",
  "DSCF2026.jpg",
  "DSCF0546.jpg",
  "DSCF0431.jpg",
  "DSCF2021.jpg",
];

const selectedImage = landingImages[Math.floor(Math.random() * landingImages.length)];
document.querySelector("#landing-image").src = `assets/landing/${selectedImage}`;

const clock = document.querySelector("#corner-clock");
if (clock) {
  const updateClock = () => {
    const now = new Date();
    const value = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(unit => String(unit).padStart(2, "0"))
      .join(":");
    clock.textContent = value;
    clock.dateTime = value;
    clock.setAttribute("aria-label", `Current local time: ${value}`);
  };
  updateClock();
  setInterval(updateClock, 1000);
}

const storiesTrigger = document.querySelector(".stories-trigger");
const storiesPanel = document.querySelector("#stories");
const storiesBack = document.querySelector(".stories-back");
const siteShell = document.querySelector(".site-shell");
const archiveScroller = document.querySelector(".stories-content");
const archiveSlides = [...document.querySelectorAll(".archive-slide")];
const archiveCounter = document.querySelector(".archive-counter");
const archivePrev = document.querySelector(".archive-prev");
const archiveNext = document.querySelector(".archive-next");
let archiveIndex = 0;
const reader = document.querySelector(".story-reader");
const readerScroll = reader.querySelector(".reader-scroll");
const readerClose = reader.querySelector(".reader-close");
const readerArticle = reader.querySelector(".reader-article");
const emptyStoryMarkup = readerArticle.innerHTML;
const archiveNav = document.querySelector(".archive-navigation");
let readerSource = null;
let readerAnimation = null;
let readerClosing = false;

function archiveTransform() {
  const card = readerSource.closest(".archive-file").getBoundingClientRect();
  const panel = storiesPanel.getBoundingClientRect();
  return `translate(${card.left - panel.left}px, ${card.top - panel.top}px) scale(${card.width / panel.width}, ${card.height / panel.height})`;
}
function resetReader(restoreFocus = false) {
  readerAnimation?.cancel();
  readerAnimation = null;
  reader.hidden = true;
  reader.inert = true;
  reader.classList.remove("is-entering");
  archiveScroller.inert = archiveNav.inert = storiesBack.inert = false;
  if (restoreFocus) readerSource?.focus({ preventScroll: true });
  readerSource = null;
  readerClosing = false;
}
function openReader(button, index) {
  if (!reader.hidden) return;
  readerSource = button;
  const storyTemplate = document.querySelector(`#story-${String(index + 1).padStart(3, "0")}-content`);
  if (storyTemplate) {
    readerArticle.replaceChildren(storyTemplate.content.cloneNode(true));
  } else {
    readerArticle.innerHTML = emptyStoryMarkup;
  }
  reader.querySelector(".reader-number").textContent = `S${String(index + 1).padStart(3, "0")}`;
  reader.hidden = false;
  reader.inert = false;
  readerScroll.scrollTo({ top: 0, behavior: "instant" });
  readerClose.focus({ preventScroll: true });
  archiveScroller.inert = archiveNav.inert = storiesBack.inert = true;
  reader.classList.add("is-entering");
  readerAnimation = reader.animate([{ transform: archiveTransform(), opacity: .5 }, { transform: "none", opacity: 1 }], { duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 550, easing: "cubic-bezier(.2,.7,.15,1)" });
}
async function closeReader() {
  if (reader.hidden || readerClosing) return;
  readerClosing = true;
  readerAnimation?.cancel();
  reader.classList.remove("is-entering");
  const animation = reader.animate([{ transform: "none", opacity: 1 }, { transform: archiveTransform(), opacity: 0 }], { duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450, easing: "cubic-bezier(.65,0,.35,1)" });
  readerAnimation = animation;
  try { await animation.finished; } catch { return; }
  resetReader(true);
}
archiveSlides.forEach((slide, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "archive-open";
  button.setAttribute("aria-label", `Open archive ${String(index + 1).padStart(3, "0")}`);
  button.innerHTML = '<span>OPEN ↗</span>';
  button.addEventListener("click", () => openReader(button, index));
  slide.querySelector(".archive-file").append(button);
});
readerClose.addEventListener("click", closeReader);

function updateArchivePosition() {
  const height = archiveScroller.clientHeight;
  if (!height) return;
  archiveIndex = Math.max(0, Math.min(archiveSlides.length - 1, Math.round(archiveScroller.scrollTop / height)));
  archiveCounter.textContent = `${String(archiveIndex + 1).padStart(3, "0")} / ${String(archiveSlides.length).padStart(3, "0")}`;
  archivePrev.disabled = archiveIndex === 0;
  archiveNext.disabled = archiveIndex === archiveSlides.length - 1;
}
function goToArchive(index) {
  const target = Math.max(0, Math.min(archiveSlides.length - 1, index));
  archiveScroller.scrollTo({ top: target * archiveScroller.clientHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}
archiveScroller.addEventListener("scroll", updateArchivePosition, { passive: true });
document.querySelector(".archive-controls").hidden = archiveSlides.length < 2;
updateArchivePosition();
archivePrev.addEventListener("click", () => goToArchive(archiveIndex - 1));
archiveNext.addEventListener("click", () => goToArchive(archiveIndex + 1));
window.addEventListener("resize", () => {
  archiveScroller.scrollTo({ top: archiveIndex * archiveScroller.clientHeight, behavior: "instant" });
});
document.addEventListener("keydown", event => {
  if (!reader.hidden || !document.body.classList.contains("stories-open") || event.altKey || event.ctrlKey || event.metaKey) return;
  let target;
  if (event.key === "ArrowDown" || event.key === "PageDown") target = archiveIndex + 1;
  if (event.key === "ArrowUp" || event.key === "PageUp") target = archiveIndex - 1;
  if (event.key === "Home") target = 0;
  if (event.key === "End") target = archiveSlides.length - 1;
  if (target !== undefined) { event.preventDefault(); goToArchive(target); }
});

function setStoriesOpen(open) {
  if (!open) resetReader();
  document.body.classList.toggle("stories-open", open);
  storiesTrigger.setAttribute("aria-expanded", String(open));
  if (open) {
    storiesPanel.inert = false;
    storiesPanel.setAttribute("aria-hidden", "false");
    storiesBack.focus({ preventScroll: true });
    siteShell.inert = true;
  } else {
    siteShell.inert = false;
    storiesTrigger.focus({ preventScroll: true });
    storiesPanel.inert = true;
    storiesPanel.setAttribute("aria-hidden", "true");
  }
}
storiesTrigger.addEventListener("click", () => setStoriesOpen(true));
storiesBack.addEventListener("click", () => setStoriesOpen(false));
document.querySelector(".corner-logo").addEventListener("click", event => {
  event.preventDefault();
  if (document.body.classList.contains("stories-open")) setStoriesOpen(false);
  event.currentTarget.focus({ preventScroll: true });
  window.scrollTo({ top: 0, left: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  history.replaceState(null, "", "#home");
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains("stories-open")) {
    event.stopImmediatePropagation();
    if (!reader.hidden) closeReader();
    else setStoriesOpen(false);
  }
});

function updateProjectDock() {
  let dockedHeight = 0;
  document.querySelectorAll(".project-trigger").forEach(trigger => {
    const active = trigger.closest("li").classList.contains("is-active");
    const rect = trigger.getBoundingClientRect();
    const offset = parseFloat(getComputedStyle(trigger).top);
    const docked = active && Number.isFinite(offset) && Math.abs(rect.top - offset) < 2;
    trigger.classList.toggle("is-docked", docked);
    if (docked) dockedHeight = rect.height;
  });
  document.body.classList.toggle("project-docked", dockedHeight > 0);
  if (dockedHeight) document.body.style.setProperty("--docked-row-height", `${dockedHeight}px`);
}
let dockFrame = 0;
function scheduleProjectDock() {
  if (dockFrame) return;
  dockFrame = requestAnimationFrame(() => { dockFrame = 0; updateProjectDock(); });
}
window.addEventListener("scroll", scheduleProjectDock, { passive: true });
window.addEventListener("resize", scheduleProjectDock);
window.addEventListener("load", scheduleProjectDock);

document.querySelectorAll(".project-trigger").forEach(trigger => {
const panel = document.getElementById(trigger.dataset.project);
const projectItem = trigger.closest("li");
// Keep the expanding section inside the list item and its original row sticky.
projectItem.append(panel);
let expanded = false;
let frame;

function setExpanded(open, immediate = false) {
  cancelAnimationFrame(frame);
  const startHeight = panel.getBoundingClientRect().height;
  const startScroll = window.scrollY;
  const rowTop = projectItem.getBoundingClientRect().top + startScroll;
  const stickyOffset = parseFloat(getComputedStyle(trigger).top) || 0;
  const endScroll = open ? startScroll : Math.min(startScroll, Math.max(0, rowTop - stickyOffset));
  expanded = open;
  panel.classList.add("is-open");
  projectItem.classList.add("is-active");
  panel.setAttribute("aria-hidden", String(!open));
  trigger.setAttribute("aria-expanded", String(open));
  const endHeight = open ? panel.scrollHeight : 0;
  const duration = immediate || matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 480;
  const start = performance.now();
  function animate(now) {
    const progress = duration ? Math.min((now - start) / duration, 1) : 1;
    const eased = .5 - Math.cos(Math.PI * progress) / 2;
    panel.style.height = `${startHeight + (endHeight - startHeight) * eased}px`;
    if (!open) window.scrollTo({top: startScroll + (endScroll - startScroll) * eased, behavior: "instant"});
    if (progress < 1) {
      frame = requestAnimationFrame(animate);
    } else {
      panel.style.height = open ? "auto" : "0px";
      panel.classList.toggle("is-open", open);
      projectItem.classList.toggle("is-active", open);
    }
    scheduleProjectDock();
  }
  frame = requestAnimationFrame(animate);
  history.replaceState(null, "", open ? `#${panel.id}` : "#index");
}

trigger.addEventListener("click", event => {
  event.preventDefault();
  setExpanded(!expanded);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && expanded) setExpanded(false);
});
if (location.hash === `#${panel.id}`) setExpanded(true, true);
});
