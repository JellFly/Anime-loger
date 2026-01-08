/* ===== PROFILS ===== */
let profiles = JSON.parse(localStorage.getItem("profiles")) || [];
let currentProfileIndex = JSON.parse(localStorage.getItem("currentProfileIndex")) || 0;

if(profiles.length === 0){
    profiles.push({
        name: "Invité",
        avatar: "https://via.placeholder.com/100",
        bio: "",
        animes: [],
        watch: []
    });
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

let animes = [];
let watch = [];
let editIndex = null;

/* ===== UTILS ===== */
const stars = n => "⭐".repeat(n);

function saveProfiles(){
    localStorage.setItem("profiles", JSON.stringify(profiles));
    localStorage.setItem("currentProfileIndex", JSON.stringify(currentProfileIndex));
}

function renderProfileSelect(){
    if(!profileSelect) return;
    profileSelect.innerHTML = profiles.map((p,i)=>
        `<option value="${i}" ${i===currentProfileIndex?'selected':''}>${p.name}</option>`).join("");
}

function renderProfile(){
    const p = profiles[currentProfileIndex];
    if(profileName) profileName.textContent = p.name;
    if(profileAvatar) profileAvatar.src = p.avatar;
    if(profileBio) profileBio.textContent = p.bio;

    if(profileNameInput) profileNameInput.value = p.name;
    if(profileAvatarInput) profileAvatarInput.value = p.avatar;
    if(profileBioInput) profileBioInput.value = p.bio;

    // Charger les animés et watchlist
    animes = p.animes;
    watch = p.watch;
}

/* ===== CRUD PROFIL ===== */
function switchProfile(index){
    currentProfileIndex = +index;
    renderProfile();
    render();
}

function addProfile(){
    const name = prompt("Nom du nouveau profil ?") || "Invité";
    profiles.push({
        name,
        avatar: "https://via.placeholder.com/100",
        bio: "",
        animes: [],
        watch: []
    });
    currentProfileIndex = profiles.length - 1;
    saveProfiles();
    renderProfileSelect();
    renderProfile();
    render();
}

function deleteProfile(){
    if(profiles.length <= 1){
        alert("Impossible de supprimer le dernier profil");
        return;
    }
    if(confirm(`Supprimer le profil ${profiles[currentProfileIndex].name} ?`)){
        profiles.splice(currentProfileIndex,1);
        currentProfileIndex = 0;
        saveProfiles();
        renderProfileSelect();
        renderProfile();
        render();
    }
}

function saveProfile(){
    const p = profiles[currentProfileIndex];
    p.name = profileNameInput.value || p.name;
    p.avatar = profileAvatarInput.value || p.avatar;
    p.bio = profileBioInput.value || "";
    saveProfiles();
    renderProfile();
    renderProfileSelect();
}

/* ===== ANIMES ===== */
const saveData = () => {
    const p = profiles[currentProfileIndex];
    p.animes = animes;
    p.watch = watch;
    saveProfiles();
};

function saveAnime(){
    if(!title.value) return alert("Nom requis");
    const anime = {
        title: title.value,
        image: image.value || "https://via.placeholder.com/400x600",
        rating: +rating.value,
        date: date.value,
        comment: comment.value
    };
    editIndex === null ? animes.push(anime) : animes[editIndex] = anime;
    editIndex = null;

    title.value = image.value = comment.value = date.value = "";
    rating.value = 1;

    saveData();
    render();
}

function editAnime(i){
    const a = animes[i];
    title.value = a.title;
    image.value = a.image;
    rating.value = a.rating;
    date.value = a.date;
    comment.value = a.comment;
    editIndex = i;
}

function deleteAnime(i){
    if(confirm("Supprimer cet animé ?")){
        animes.splice(i,1);
        saveData();
        render();
    }
}

/* ===== WATCHLIST ===== */
function addWatch(){
    if(!watchInput.value) return;
    watch.push(watchInput.value);
    watchInput.value = "";
    saveData();
    render();
}

function watchToAnime(i){
    title.value = watch[i];
    watch.splice(i,1);
    saveData();
    render();
}

/* ===== SORT ===== */
function sortAnime(type){
    if(type==="name") animes.sort((a,b)=>a.title.localeCompare(b.title));
    if(type==="rating") animes.sort((a,b)=>b.rating-a.rating);
    if(type==="date") animes.sort((a,b)=>new Date(b.date)-new Date(a.date));
    render();
}

/* ===== STATS ===== */
function updateStats(){
    if(!document.getElementById("statTotal")) return;
    statTotal.textContent = animes.length;
    statWatch.textContent = watch.length;

    if(!animes.length){
        statAverage.textContent = "0";
        statBest.textContent = "-";
        return;
    }

    const avg = animes.reduce((a,b)=>a+b.rating,0)/animes.length;
    statAverage.textContent = avg.toFixed(1);
    statBest.textContent = animes.reduce((a,b)=>b.rating>a.rating?b:a).title;
}

/* ===== RENDER ===== */
function render(){
    if(animeListEl) {
        const q = search.value ? search.value.toLowerCase() : "";
        animeListEl.innerHTML = animes
            .filter(a => a.title.toLowerCase().includes(q))
            .map((a,i)=>`
            <div class="card-anime">
                <img src="${a.image}">
                <div class="card-content">
                    <strong>${a.title}</strong><br>
                    <span class="stars">${stars(a.rating)}</span><br>
                    <span class="small">📅 ${a.date || "?"}</span>
                    <p class="small">${a.comment || ""}</p>
                    <div class="actions">
                        <button onclick="editAnime(${i})">✏️</button>
                        <button onclick="deleteAnime(${i})">🗑️</button>
                    </div>
                </div>
            </div>`).join("");
    }

    if(watchListEl){
        watchListEl.innerHTML = watch.map((w,i)=>`
            <div class="card-anime">
                <div class="card-content">
                    <strong>${w}</strong>
                    <div class="actions">
                        <button onclick="watchToAnime(${i})">✔ Vu</button>
                    </div>
                </div>
            </div>`).join("");
    }

    updateStats();
}

/* ===== INITIALISATION ===== */
renderProfileSelect();
renderProfile();
render();
