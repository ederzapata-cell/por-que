
const FREE_LIMIT = 10;
const QUESTIONS = window.QUESTIONS || [];

const card = document.getElementById("card");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const answerLabel = document.getElementById("answerLabel");
const counter = document.getElementById("counter");
const mineCount = document.getElementById("mineCount");
const emptyState = document.getElementById("emptyState");
const cardStack = document.querySelector(".card-stack");
const paywall = document.getElementById("paywall");
const closePaywall = document.getElementById("closePaywall");
const backToQuestion = document.getElementById("backToQuestion");

let activeTab = "explore";
let currentIndex = Number(localStorage.getItem("pq_current_index") || 0);
let currentMode = null;
let cloudSyncTimer = null;

function markProgressUpdated(){
  localStorage.setItem("pq_progress_updated_at", String(Date.now()));
}

function scheduleCloudSync(){
  markProgressUpdated();
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(()=>{
    if(typeof window.pqSyncProgressToCloud === "function"){
      window.pqSyncProgressToCloud();
    }
  }, 350);
}

const shuffled = loadOrCreateOrder();
let exploreOrder = shuffled;

let discovered = JSON.parse(localStorage.getItem("pq_discovered") || "[]");
let history = JSON.parse(localStorage.getItem("pq_history") || "[]");

function shuffle(arr){
  const copy = [...arr];
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function loadOrCreateOrder(){
  const allIds = QUESTIONS.map(q => q.id);
  const stored = JSON.parse(localStorage.getItem("pq_order") || "null");

  if(Array.isArray(stored)){
    const uniqueValid = [...new Set(stored)].filter(id => allIds.includes(id));
    if(uniqueValid.length === allIds.length){
      return uniqueValid;
    }
  }

  const order = shuffle(allIds);
  localStorage.setItem("pq_order", JSON.stringify(order));
  localStorage.setItem("pq_current_index", "0");
  return order;
}
function getQuestionById(id){ return QUESTIONS.find(q=>q.id===id); }
function saveCurrentIndex(){
  localStorage.setItem("pq_current_index", String(currentIndex));
  scheduleCloudSync();
}

function createNewCycle(previousLastId){
  let nextOrder = shuffle(QUESTIONS.map(q => q.id));

  // Evita que la última pregunta de una ronda sea inmediatamente
  // la primera de la siguiente.
  if(nextOrder.length > 1 && nextOrder[0] === previousLastId){
    [nextOrder[0], nextOrder[1]] = [nextOrder[1], nextOrder[0]];
  }

  exploreOrder = nextOrder;
  localStorage.setItem("pq_order", JSON.stringify(exploreOrder));
  currentIndex = 0;
  saveCurrentIndex();
}

function currentList(){
  if(activeTab === "mine"){
    return discovered;
  }
  return exploreOrder;
}
function currentQuestion(){
  const list = currentList();
  if(!list.length) return null;
  return getQuestionById(list[Math.max(0, Math.min(currentIndex, list.length-1))]);
}
function save(){
  localStorage.setItem("pq_discovered", JSON.stringify(discovered));
  localStorage.setItem("pq_history", JSON.stringify(history));
  scheduleCloudSync();
}
function render(){
  const list = currentList();
  mineCount.textContent = discovered.length;
  counter.textContent = `${Math.min(discovered.length, FREE_LIMIT)} / ${FREE_LIMIT} gratis`;

  if(activeTab==="mine" && !list.length){
    cardStack.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }
  cardStack.classList.remove("hidden");
  emptyState.classList.add("hidden");

  if(currentIndex >= list.length) currentIndex = Math.max(0, list.length-1);
  const q = currentQuestion();
  if(!q) return;

  card.classList.remove("flipped");
  currentMode = null;
  questionText.textContent = q.question;
  answerText.textContent = "";
  document.querySelector(".card-back").classList.remove("simple-mode","deep-mode");
}
function markDiscovered(q){
  if(!discovered.includes(q.id)){
    discovered.push(q.id);
    save();
  }
  if(!history.includes(q.id)){
    history.push(q.id);
    save();
  }
  mineCount.textContent = discovered.length;
  counter.textContent = `${Math.min(discovered.length, FREE_LIMIT)} / ${FREE_LIMIT} gratis`;
}
function reveal(mode){
  const q = currentQuestion();
  if(!q) return;

  if(activeTab==="explore" && !discovered.includes(q.id) && discovered.length >= FREE_LIMIT){
    paywall.classList.remove("hidden");
    return;
  }

  markDiscovered(q);
  currentMode = mode;
  const back = document.querySelector(".card-back");
  back.classList.toggle("simple-mode", mode==="simple");
  back.classList.toggle("deep-mode", mode==="deep");
  answerLabel.textContent = mode==="simple" ? "Sencillo" : "Profundo";
  answerText.textContent = q[mode];

  if(!card.classList.contains("flipped")){
    card.classList.add("flipped");
  }
}
function nextQuestion(){
  const list = currentList();
  if(!list.length) return;

  if(activeTab==="explore"){
    const q = currentQuestion();
    if(q && !discovered.includes(q.id) && discovered.length >= FREE_LIMIT){
      paywall.classList.remove("hidden");
      return;
    }

    // No repetimos ninguna pregunta durante la ronda completa.
    if(currentIndex >= list.length - 1){
      const previousLastId = list[list.length - 1];
      createNewCycle(previousLastId);
      animateSwitch(-1);
      return;
    }
  } else if(currentIndex >= list.length - 1){
    currentIndex = 0;
    animateSwitch(-1);
    return;
  }

  currentIndex += 1;
  saveCurrentIndex();
  animateSwitch(-1);
}
function prevQuestion(){
  const list = currentList();
  if(!list.length) return;

  if(currentIndex > 0){
    currentIndex -= 1;
    if(activeTab === "explore") saveCurrentIndex();
    animateSwitch(1);
  }
}
function animateSwitch(direction){
  card.style.transform = `translateX(${direction * 34}px) rotate(${direction * 2}deg)`;
  card.style.opacity = ".25";
  setTimeout(()=>{
    render();
    card.style.transition = "none";
    card.style.transform = `translateX(${-direction * 22}px)`;
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        card.style.transition = "";
        card.style.transform = "";
        card.style.opacity = "1";
      });
    });
  },170);
}
document.querySelectorAll("[data-mode]").forEach(btn=>{
  btn.addEventListener("click", e=>{
    e.stopPropagation();
    reveal(btn.dataset.mode);
  });
});
backToQuestion.addEventListener("click", ()=>{
  card.classList.remove("flipped");
  currentMode = null;
});
document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    activeTab = tab.dataset.tab;
    if(activeTab === "mine"){
      currentIndex = 0;
    } else {
      currentIndex = Number(localStorage.getItem("pq_current_index") || 0);
      if(currentIndex >= exploreOrder.length) currentIndex = 0;
    }
    render();
  });
});
closePaywall.addEventListener("click", ()=>paywall.classList.add("hidden"));
paywall.addEventListener("click", e=>{
  if(e.target===paywall) paywall.classList.add("hidden");
});

let startX = null, currentX = 0, dragging = false;
function pointerDown(x){
  startX = x; currentX = x; dragging = true; card.classList.add("dragging");
}
function pointerMove(x){
  if(!dragging) return;
  currentX = x;
  const dx = currentX - startX;
  card.style.transform = `translateX(${dx}px) rotate(${dx/40}deg)`;
  card.style.opacity = String(Math.max(.55, 1-Math.abs(dx)/500));
}
function pointerUp(){
  if(!dragging) return;
  const dx = currentX - startX;
  dragging = false; card.classList.remove("dragging");
  card.style.transform = ""; card.style.opacity = "1";
  if(dx < -70) nextQuestion();
  else if(dx > 70) prevQuestion();
}
card.addEventListener("pointerdown", e=>{
  if(e.target.closest("button")) return;
  card.setPointerCapture?.(e.pointerId);
  pointerDown(e.clientX);
});
card.addEventListener("pointermove", e=>pointerMove(e.clientX));
card.addEventListener("pointerup", pointerUp);
card.addEventListener("pointercancel", pointerUp);


// ---------- Firestore progress sync API ----------
window.pqExportProgress = function(){
  return {
    discoveredQuestions: [...new Set(discovered)],
    questionOrder: [...exploreOrder],
    currentIndex: Number(localStorage.getItem("pq_current_index") || currentIndex || 0),
    localUpdatedAt: Number(localStorage.getItem("pq_progress_updated_at") || 0)
  };
};

window.pqApplyCloudProgress = function(cloud){
  if(!cloud) return;

  const allIds = new Set(QUESTIONS.map(q => q.id));

  // Never lose questions already discovered on this device.
  const cloudDiscovered = Array.isArray(cloud.discoveredQuestions)
    ? cloud.discoveredQuestions.filter(id => allIds.has(id))
    : [];

  discovered = [...new Set([...discovered, ...cloudDiscovered])];
  localStorage.setItem("pq_discovered", JSON.stringify(discovered));

  // Preserve history enough for the current app behavior.
  history = [...new Set([...history, ...discovered])];
  localStorage.setItem("pq_history", JSON.stringify(history));

  // A cloud order is only accepted if it contains the full current bank once.
  if(Array.isArray(cloud.questionOrder)){
    const validOrder = [...new Set(cloud.questionOrder)].filter(id => allIds.has(id));
    if(validOrder.length === QUESTIONS.length){
      exploreOrder = validOrder;
      localStorage.setItem("pq_order", JSON.stringify(exploreOrder));
    }
  }

  let cloudIndex = Number(cloud.currentIndex);
  if(Number.isFinite(cloudIndex)){
    cloudIndex = Math.max(0, Math.min(cloudIndex, exploreOrder.length - 1));
    currentIndex = cloudIndex;
    localStorage.setItem("pq_current_index", String(currentIndex));
  }

  if(cloud.progressUpdatedAtMillis){
    localStorage.setItem("pq_progress_updated_at", String(cloud.progressUpdatedAtMillis));
  }

  if(activeTab === "explore"){
    render();
  } else {
    mineCount.textContent = discovered.length;
    counter.textContent = `${Math.min(discovered.length, FREE_LIMIT)} / ${FREE_LIMIT} gratis`;
  }
};

window.pqRenderProgress = render;

render();
