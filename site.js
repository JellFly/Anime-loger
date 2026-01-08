/* ===== GLOBAL STATE ===== */
let profiles = [];
let currentProfileIndex = 0;
let currentType = "animes"; // animes, films, series

let animes = [];
let films = [];
let series = [];
let watch = [];
let editIndex = null;

/* ===== FIREBASE LOADING ===== */
window.loadProfilesFromFirebase = async function() {
    if(!window.auth || !window.auth.currentUser) {
        console.log("Non connecté, utilisation du stockage local");
        loadProfilesLocal();
        return;
    }
    
    try {
        const data = window.userDataFromFirebase;
        if(data && data.profiles) {
            profiles = data.profiles;
            currentProfileIndex = data.currentProfileIndex || 0;
            console.log("Profils chargés depuis Firebase:", profiles);
        } else {
            loadProfilesLocal();
        }
    } catch(e) {
        console.error("Erreur Firebase:", e);
        loadProfilesLocal();
    }
    
    renderProfileSelect();
    renderProfile();
    render();
};

function loadProfilesLocal() {
    profiles = JSON.parse(localStorage.getItem("profiles")) || [];
    currentProfileIndex = JSON.parse(localStorage.getItem("currentProfileIndex")) || 0;
    
    if(profiles.length === 0) {
        profiles.push({
            name: "Profil 1",
            avatar: "https://via.placeholder.com/100",
            bio: "",
            animes: [],
            films: [],
            series: [],
            watch: []
        });
    }
}

/* ===== AUTH MODAL ===== */
window.openAuthModal = function() {
    const modal = document.getElementById("authModal");
    if(modal) modal.classList.add("active");
};

window.closeAuthModal = function() {
    const modal = document.getElementById("authModal");
    if(modal) modal.classList.remove("active");
};

window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authTitle = document.getElementById("authTitle");
    const buttons = document.querySelectorAll(".modal-content .tab-btn");
    
    buttons.forEach(btn => btn.classList.remove("active"));
    
    if(tab === "login") {
        if(loginForm) loginForm.style.display = "block";
        if(registerForm) registerForm.style.display = "none";
        if(authTitle) authTitle.textContent = "Se connecter";
        if(buttons[0]) buttons[0].classList.add("active");
    } else {
        if(loginForm) loginForm.style.display = "none";
        if(registerForm) registerForm.style.display = "block";
        if(authTitle) authTitle.textContent = "Créer un compte";
        if(buttons[1]) buttons[1].classList.add("active");
    }
};

window.updateAuthIcon = function() {
    const icon = document.getElementById("authIcon");
    if(!icon) return;
    if(window.auth && window.auth.currentUser) {
        icon.textContent = "✅";
        icon.title = window.auth.currentUser.email;
    } else {
        icon.textContent = "👤";
        icon.title = "Cliquez pour vous connecter";
    }
};

/* ===== TYPE SELECTION ===== */
window.switchType = function(type) {
    currentType = type;
    
    // Update buttons
    document.querySelectorAll(".type-tabs .tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if(btn.dataset.type === type) btn.classList.add("active");
    });
    
    // Load data for type
    const p = profiles[currentProfileIndex];
    if(p) {
        animes = p.animes || [];
        films = p.films || [];
        series = p.series || [];
    }
    
    render();
};

/* ===== UTILS ===== */
const stars = n => "⭐".repeat(n);

async function saveProfiles() {
    if(window.auth && window.auth.currentUser && window.db) {
        try {
            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
            await updateDoc(doc(window.db, "users", window.auth.currentUser.uid), {
                profiles: profiles,
                currentProfileIndex: currentProfileIndex
            });
            console.log("Profils sauvegardés sur Firebase");
        } catch(e) {
            console.error("Erreur sauvegarde Firebase:", e);
            localStorage.setItem("profiles", JSON.stringify(profiles));
            localStorage.setItem("currentProfileIndex", JSON.stringify(currentProfileIndex));
        }
    } else {
        localStorage.setItem("profiles", JSON.stringify(profiles));
        localStorage.setItem("currentProfileIndex", JSON.stringify(currentProfileIndex));
    }
}

function renderProfileSelect() {
    if(!profileSelect) return;
    profileSelect.innerHTML = profiles.map((p,i)=>
        `<option value="${i}" ${i===currentProfileIndex?'selected':''}>${p.name}</option>`).join("");
}

function renderProfile() {
    const p = profiles[currentProfileIndex];
    if(!p) return;
    
    if(profileName) profileName.textContent = p.name;
    if(profileAvatar) profileAvatar.src = p.avatar;
    if(profileBio) profileBio.textContent = p.bio;

    if(profileNameInput) profileNameInput.value = p.name;
    if(profileAvatarInput) profileAvatarInput.value = p.avatar;
    if(profileBioInput) profileBioInput.value = p.bio;

    animes = p.animes || [];
    films = p.films || [];
    series = p.series || [];
    watch = p.watch || [];
}

const profileSelect = document.getElementById("profileSelect");
const profileName = document.getElementById("profileName");
const profileAvatar = document.getElementById("profileAvatar");
const profileBio = document.getElementById("profileBio");
const profileNameInput = document.getElementById("profileNameInput");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const profileBioInput = document.getElementById("profileBioInput");

const animeListEl = document.getElementById("animeList");
const watchListEl = document.getElementById("watchList");

/* ===== CRUD OPERATIONS ===== */
function switchProfile(index) {
    currentProfileIndex = +index;
    renderProfile();
    render();
}

async function addProfile() {
    const name = prompt("Nom du nouveau profil ?") || "Profil";
    profiles.push({
        name,
        avatar: "https://via.placeholder.com/100",
        bio: "",
        animes: [],
        films: [],
        series: [],
        watch: []
    });
    currentProfileIndex = profiles.length - 1;
    await saveProfiles();
    renderProfileSelect();
    renderProfile();
    render();
}

async function deleteProfile() {
    if(profiles.length <= 1) {
        alert("Impossible de supprimer le dernier profil");
        return;
    }
    if(confirm(`Supprimer le profil ${profiles[currentProfileIndex].name} ?`)) {
        profiles.splice(currentProfileIndex, 1);
        currentProfileIndex = 0;
        await saveProfiles();
        renderProfileSelect();
        renderProfile();
        render();
    }
}

async function saveProfile() {
    const p = profiles[currentProfileIndex];
    p.name = profileNameInput.value || p.name;
    p.avatar = profileAvatarInput.value || p.avatar;
    p.bio = profileBioInput.value || "";
    await saveProfiles();
    renderProfile();
    renderProfileSelect();
}

/* ===== SAVE DATA ===== */
const saveData = async () => {
    const p = profiles[currentProfileIndex];
    p.animes = animes;
    p.films = films;
    p.series = series;
    p.watch = watch;
    await saveProfiles();
};

/* ===== ADD/EDIT/DELETE ===== */
async function saveItem() {
    const titleEl = document.getElementById("title");
    const imageEl = document.getElementById("image");
    const ratingEl = document.getElementById("rating");
    const dateEl = document.getElementById("date");
    const commentEl = document.getElementById("comment");
    
    if(!titleEl || !titleEl.value) return alert("Nom requis");
    
    const item = {
        title: titleEl.value,
        image: imageEl ? imageEl.value || "https://via.placeholder.com/400x600" : "https://via.placeholder.com/400x600",
        rating: ratingEl ? +ratingEl.value : 1,
        date: dateEl ? dateEl.value : "",
        comment: commentEl ? commentEl.value : ""
    };
    
    const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
    
    if(editIndex === null) {
        currentList.push(item);
    } else {
        currentList[editIndex] = item;
    }
    editIndex = null;

    if(titleEl) titleEl.value = "";
    if(imageEl) imageEl.value = "";
    if(commentEl) commentEl.value = "";
    if(dateEl) dateEl.value = "";
    if(ratingEl) ratingEl.value = 1;

    await saveData();
    render();
}

function editItem(i) {
    const titleEl = document.getElementById("title");
    const imageEl = document.getElementById("image");
    const ratingEl = document.getElementById("rating");
    const dateEl = document.getElementById("date");
    const commentEl = document.getElementById("comment");
    
    const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
    const item = currentList[i];
    
    if(titleEl) titleEl.value = item.title;
    if(imageEl) imageEl.value = item.image;
    if(ratingEl) ratingEl.value = item.rating;
    if(dateEl) dateEl.value = item.date;
    if(commentEl) commentEl.value = item.comment;
    editIndex = i;
}

async function deleteItem(i) {
    if(confirm("Supprimer cet élément ?")) {
        const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
        currentList.splice(i, 1);
        await saveData();
        render();
    }
}

/* ===== WATCHLIST ===== */
async function addWatch() {
    const watchInput = document.getElementById("watchInput");
    if(!watchInput || !watchInput.value) return;
    watch.push(watchInput.value);
    watchInput.value = "";
    await saveData();
    render();
}

async function watchToAnime(i) {
    const titleEl = document.getElementById("title");
    if(titleEl) titleEl.value = watch[i];
    watch.splice(i,1);
    await saveData();
    render();
}

/* ===== SORT ===== */
function sortItems(type) {
    const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
    
    if(type === "name") currentList.sort((a,b) => a.title.localeCompare(b.title));
    if(type === "rating") currentList.sort((a,b) => b.rating - a.rating);
    if(type === "date") currentList.sort((a,b) => new Date(b.date) - new Date(a.date));
    render();
}

/* ===== STATS ===== */
function updateStats() {
    const statTotal = document.getElementById("statTotal");
    const statFilms = document.getElementById("statFilms");
    const statSeries = document.getElementById("statSeries");
    const statWatch = document.getElementById("statWatch");
    
    if(!statTotal) return;
    
    statTotal.textContent = animes.length;
    if(statFilms) statFilms.textContent = films.length;
    if(statSeries) statSeries.textContent = series.length;
    if(statWatch) statWatch.textContent = watch.length;
}

/* ===== RENDER ===== */
function render() {
    if(animeListEl) {
        const searchEl = document.getElementById("search");
        const q = searchEl && searchEl.value ? searchEl.value.toLowerCase() : "";
        const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
        
        const typeLabel = currentType === "animes" ? "🎌" : currentType === "films" ? "🎬" : "📺";
        
        animeListEl.innerHTML = currentList
            .filter(a => a.title.toLowerCase().includes(q))
            .map((a,i)=>`
            <div class="card">
                <img src="${a.image}" alt="${a.title}">
                <div class="card-content">
                    <div class="card-type">${typeLabel} ${currentType.slice(0,-1).toUpperCase()}</div>
                    <div class="card-title">${a.title}</div>
                    <div class="card-rating">${stars(a.rating)}</div>
                    <div class="card-meta">📅 ${a.date || "?"}</div>
                    <div class="card-comment">${a.comment || ""}</div>
                    <div class="card-actions">
                        <button class="btn-small" onclick="editItem(${i})">✏️ Éditer</button>
                        <button class="btn-small btn-danger" onclick="deleteItem(${i})">🗑️ Supprimer</button>
                    </div>
                </div>
            </div>`).join("");
    }

    if(watchListEl) {
        watchListEl.innerHTML = watch.map((w,i) => `
            <div class="card">
                <div class="card-content">
                    <div class="card-title">${w}</div>
                    <div class="card-actions">
                        <button class="btn-small" onclick="watchToAnime(${i})">✔️ Ajouter</button>
                    </div>
                </div>
            </div>`).join("");
    }

    updateStats();
}

/* ===== INITIALISATION ===== */
setTimeout(() => {
    if(window.loadProfilesFromFirebase) {
        window.loadProfilesFromFirebase();
    } else {
        loadProfilesLocal();
        renderProfileSelect();
        renderProfile();
        render();
    }
    window.updateAuthIcon();
}, 500);
