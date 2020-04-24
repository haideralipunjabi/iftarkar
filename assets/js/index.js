let data;
let fiqh;
let theme = localStorage.getItem("theme");
if(theme===null){
    theme="light"
}
if(theme==="dark"){
    toggleTheme();
}
fetch("/assets/data/timings.json").then(r=>r.json()).then(d=>{
    fiqh = localStorage.getItem("fiqh");

    data = d;
    if(fiqh===null){
        fiqh="ahlesunnat"
        localStorage.setItem("fiqh",fiqh)
    }
    else if(fiqh==="shia"){
        document.querySelectorAll(".tabs li").forEach(tab=>{
            tab.classList.remove("is-active")
        })
        document.querySelectorAll(".tabs li")[1].classList.add("is-active")
    }
    loadData()
})

function loadData(){
    if(data===undefined) return;
    document.getElementById("flipdown").innerHTML="";
    document.getElementById("flipdown").classList.remove("flipdown__theme-dark")
    document.getElementById("flipdown").classList.remove("flipdown__theme-light")

    let todaysdate = getTodaysDate(0);
    let tomorrow = getTodaysDate(1);
    let timestamp = (new Date()).getTime()
    // let todaysdate = "25/04/2020"
    // let tomorrow = "26/04/2020"
    // let d = new Date();
    // d.setDate(25);
    // d.setHours(19,12)
    // let timestamp = d.getTime()
    let division;
    let nexttimestamp
    if(!Object.keys(data[fiqh]).includes(todaysdate)){
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"]
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][tomorrow]["iftar"]
        document.getElementById("text-next").innerHTML =  "Sehri"

    }
    else if(timestamp < data[fiqh][todaysdate]["sehri_timestamp"]*1000){
        division = 0;
        nexttimestamp = data[fiqh][todaysdate]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][todaysdate]["sehri"]
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][todaysdate]["iftar"]
        document.getElementById("text-next").innerHTML =  "Sehri"

    }
    else if(timestamp < data[fiqh][todaysdate]["iftar_timestamp"]*1000){
        division = 1;
        nexttimestamp = data[fiqh][todaysdate]["iftar_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"]
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][todaysdate]["iftar"]
        document.getElementById("text-next").innerHTML =  "Iftar"

    }
    else {
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"]
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][tomorrow]["iftar"]
        document.getElementById("text-next").innerHTML =  "Sehri"

    }
    let fliptheme = ((theme==="light")?"dark":"light") + ",large"
    console.log(fliptheme)
    new FlipDown(nexttimestamp,{
        theme: fliptheme,
        showEmptyRotors: false,
    }).start();
}


function getTodaysDate(doffset){
    d = new Date();
    return `${(d.getDate()+doffset).toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`
}

document.querySelectorAll(".tabs li").forEach(item=>{
    item.addEventListener('click',e=>{
        fiqh = e.target.dataset["fiqh"];
        loadData()
        localStorage.setItem("fiqh",fiqh)
        document.querySelectorAll(".tabs li").forEach(tab=>{
            tab.classList.remove("is-active")
        })
        e.target.parentNode.classList.add("is-active")
    });
})
function launchCalendar(){
    document.querySelector("#modal-calendar tbody").innerHTML = Object.keys(data[fiqh]).map(date=>{
       return `<tr><td>${date}</td><td>${data[fiqh][date]["sehri"]}</td><td>${data[fiqh][date]["iftar"]}</td></tr>`
    }).join("")
    toggleModal("modal-calendar")
}
function toggleModal(modalid){
    let el = document.querySelector("#"+modalid)
    if(el.classList.contains("is-active")){
        el.classList.remove("is-active")
    }
    else {
        el.classList.add("is-active")
    }
}

function toggleMenu(){
    let b =document.querySelector(".navbar-burger")
    let m =document.querySelector(".navbar-menu")
    if(b.classList.contains("is-active")){
        b.classList.remove("is-active")
        m.classList.remove("is-active")
    }
    else{
        b.classList.add("is-active")
        m.classList.add("is-active")
    }
}
function toggleTheme(){
    if(document.documentElement.getAttribute('data-theme')==="dark"){
        document.documentElement.setAttribute('data-theme',"light");
        document.getElementsByClassName("fab-theme-button")[0].classList.remove("moon")
        document.getElementsByClassName("fab-theme-button")[0].classList.add("sun")
        theme = "light"
    }
    else{
        document.documentElement.setAttribute('data-theme',"dark");
        document.getElementsByClassName("fab-theme-button")[0].classList.remove("sun")
        document.getElementsByClassName("fab-theme-button")[0].classList.add("moon")
        theme = "dark"
    }
    localStorage.setItem("theme",theme)
    loadData()
}
if('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
