
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
let currentIndex = 0;
let currentMode = null;

const shuffled = loadOrCreateOrder();
let exploreOrder = shuffled;

let discovered = JSON.parse(localStorage.getItem("pq_discovered") || "[]");
let history = JSON.parse(localStorage.getItem("pq_history") || "[]");

function shuffle(arr){
  return [...arr].sort(()=>Math.random()-.5);
}
function loadOrCreateOrder(){
  const stored = JSON.parse(localStorage.getItem("pq_order") || "null");
  if(stored && stored.length === QUESTIONS.length) return stored;
  const hook = shuffle(QUESTIONS.slice(0, 15));
  const rest = shuffle(QUESTIONS.slice(15));
  const order = [...hook, ...rest].map(q=>q.id);
  localStorage.setItem("pq_order", JSON.stringify(order));
  return order;
}
function getQuestionById(id){ return QUESTIONS.find(q=>q.id===id); }
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
  }
  currentIndex = (currentIndex + 1) % list.length;
  animateSwitch(-1);
}
function prevQuestion(){
  const list = currentList();
  if(!list.length) return;
  currentIndex = (currentIndex - 1 + list.length) % list.length;
  animateSwitch(1);
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
    currentIndex = 0;
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

render();
