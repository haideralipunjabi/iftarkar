const NUMDICT = {
    "0":"٠",
    "1":"١",
    "2":"٢",
    "3":"٣",
    "4":"۴",
    "5":"٥",
    "6":"٦",
    "7":"٧",
    "8":"٨",
    "9":"٩",
    "am":"صبح",
    "pm":"شام"
}

let data;
let langdata;
let fiqh;
let theme = localStorage.getItem("theme");
let itv;
let timeOffset = 0;
let deferredPrompt;
let lang = document.querySelector("html").dataset["lang"]

if(window.location.pathname.replace(/\//g,"")==="" && localStorage.getItem("language")!==null && lang!==localStorage.getItem("language")){
    toggleLanguage(localStorage.getItem("language"))
}

hideifandroid();
if (theme === null) {
    theme = "light"
}
if (theme === "dark") {
    toggleTheme();
}
let promises = [
    fetch("/assets/data/timings.json").then(r => r.json()),
    fetch("/assets/data/langs.json").then(r=>r.json())
]
Promise.all(promises).then(d => {
    fiqh = localStorage.getItem("fiqh");
    timeOffset = localStorage.getItem("timeOffset")
    data = d[0]
    console.log(d[1]);
    langdata = d[1].find(l=>(l["lang_code"]===lang))["data"]
    if (fiqh === null) {
        fiqh = "ahlesunnat"
        localStorage.setItem("fiqh", fiqh)
    } else if (fiqh === "shia") {
        document.getElementById("change-fiqh").checked = true;
    }
    if (timeOffset === null) {
        timeOffset = 0;
    } else {
        document.querySelector(`#offsetSelect option[data-offset='${timeOffset}']`).selected = true;
    }
    loadData()
})

function loadData() {
    if (data === undefined) return;
    document.getElementById("clock").innerHTML = ""
    document.getElementById("a2clink").href = `assets/calendars/${fiqh}/timings${getOffsetString()}.ics`
    clearInterval(itv);

    let todaysdate = getTodaysDate(0);
    let tomorrow = getTodaysDate(1);
    let yesterday = getTodaysDate(-1);
    let timestamp = (new Date()).getTime()
    // let todaysdate = "25/04/2020"
    // let tomorrow = "26/04/2020"
    // let d = new Date();
    // d.setDate(25);
    // d.setHours(19,12)
    // let timestamp = d.getTime()
    let division;
    let nexttimestamp
    if (!Object.keys(data[fiqh]).includes(todaysdate)) {
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_sahar"]

    } else if (timestamp < (data[fiqh][todaysdate]["sehri_timestamp"]+ (timeOffset * 60)) * 1000) {
        division = 0;
        nexttimestamp = data[fiqh][todaysdate]["sehri_timestamp"]

        document.getElementById("text-sehritime").innerHTML = data[fiqh][todaysdate]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_sahar"]

    } else if (timestamp < (data[fiqh][todaysdate]["iftar_timestamp"]+ (timeOffset * 60)) * 1000) {
        division = 1;
        nexttimestamp = data[fiqh][todaysdate]["iftar_timestamp"]

        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_iftar"]

    } else {
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_sahar"]

    }

    nexttimestamp = nexttimestamp + (timeOffset * 60)
    let clock = document.getElementById("clock")
    let per;
    let prevtimestamp;
    if (moment.now() > Object.values(data[fiqh])[0]["sehri_timestamp"] * 1000) {
        if (division === 0) {
            prevtimestamp = data[fiqh][yesterday]["iftar_timestamp"]
        } else if (division === 1) {
            prevtimestamp = data[fiqh][todaysdate]["sehri_timestamp"]
        } else if (division === 2) {
            prevtimestamp = data[fiqh][todaysdate]["iftar_timestamp"]
        }
        prevtimestamp = prevtimestamp + (timeOffset * 60)
        let delta = moment(moment.now()).diff(moment(prevtimestamp * 1000));
        per = delta * 100 / ((nexttimestamp - prevtimestamp) * 1000)
    } else {
        per = 0;
    }
    document.getElementById("timeprogress").value = Math.round(per)
    document.querySelector(".progress-value").innerHTML = `${per.toFixed(2)}%`
    itv = setInterval(() => {
        if (nexttimestamp * 1000 <= moment.now()) {

            clearInterval(itv)
            loadData();
            return;
        }
        if (moment.now() > Object.values(data[fiqh])[0]["sehri_timestamp"] * 1000) {
            let delta = moment(moment.now()).diff(moment(prevtimestamp * 1000));
            per = delta * 100 / ((nexttimestamp - prevtimestamp) * 1000)
            document.getElementById("timeprogress").value = Math.round(per)
            document.querySelector(".progress-value").innerHTML = `${per.toFixed(2)}%`
        }
        let diff = moment.duration(moment(nexttimestamp * 1000).diff(moment(moment.now())))._data
        clock.innerHTML = `${diff.hours.toString().padStart(2,"0")}:${diff.minutes.toString().padStart(2,"0")}:${diff.seconds.toString().padStart(2,"0")}`.translate()
    }, 1000)
}


function getTodaysDate(doffset) {
    d = new Date();
    return `${(d.getDate()+doffset).toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`
}

document.getElementById("change-fiqh").addEventListener('change', e => {
    if (e.target.checked) {
        fiqh = "shia"
    } else {
        fiqh = "ahlesunnat"
    }
    loadData()
    localStorage.setItem("fiqh", fiqh)
})
document.getElementById("offsetSelect").addEventListener('change', e => {
    timeOffset = parseInt(e.target.selectedOptions[0].dataset["offset"])
    localStorage.setItem("timeOffset", timeOffset)
    loadData();
})

document.querySelectorAll("#dua-tabs li").forEach(item => {
    item.addEventListener('click', e => {
        document.querySelectorAll("#dua-tabs li").forEach(item => {
            item.classList.remove("is-active")
        })
        document.querySelectorAll(".dua").forEach(item => {
            item.classList.add("is-hidden")
        })
        e.target.parentElement.classList.add("is-active")
        document.getElementById(`dua-${e.target.dataset["target"]}`).classList.remove("is-hidden")
    });
})
document.querySelectorAll(".lang-button").forEach(item=>{
    item.addEventListener('click',e=>{
        e.preventDefault();
        localStorage.setItem("language",e.target.dataset.target)
        toggleLanguage(e.target.dataset.target)
    })
})
function launchCalendar() {
    document.querySelector("#modal-calendar tbody").innerHTML = Object.keys(data[fiqh]).map(date => {
        return `<tr><td>${date}</td><td>${data[fiqh][date]["sehri"].timeOffset(timeOffset)}</td><td>${data[fiqh][date]["iftar"].timeOffset(timeOffset)}</td></tr>`
    }).join("")
    toggleModal("modal-calendar")
}

function toggleModal(modalid) {
    let el = document.querySelector("#" + modalid)
    if (el.classList.contains("is-active")) {
        el.classList.remove("is-active")
    } else {
        el.classList.add("is-active")
    }
}

function toggleMenu() {
    let b = document.querySelector(".navbar-burger")
    let m = document.querySelector(".navbar-menu")
    if (b.classList.contains("is-active")) {
        b.classList.remove("is-active")
        m.classList.remove("is-active")
    } else {
        b.classList.add("is-active")
        m.classList.add("is-active")
    }
}

function toggleTheme() {
    if (document.documentElement.getAttribute('data-theme') === "dark") {
        document.documentElement.setAttribute('data-theme', "light");
        document.getElementsByClassName("fab-theme-button")[0].classList.remove("moon")
        document.getElementsByClassName("fab-theme-button")[0].classList.add("sun")
        theme = "light"
    } else {
        document.documentElement.setAttribute('data-theme', "dark");
        document.getElementsByClassName("fab-theme-button")[0].classList.remove("sun")
        document.getElementsByClassName("fab-theme-button")[0].classList.add("moon")
        theme = "dark"
    }
    localStorage.setItem("theme", theme)
    loadData()
}

function toggleLanguage(l){
    if(l!=="en"){
        window.location.href = `/${l}/`+window.location.search
        return
    }
    window.location.href = "/"+window.location.search

}

String.prototype.timeOffset = function (offset) {
    let t = moment(this, 'h:mma')
    t.add(offset, 'minute')
    return t.format('h:mma')

}
String.prototype.translate = function(){
    if(lang==="en") return this;
    let s = this;
    Object.entries(NUMDICT).forEach(i=>{
        s=s.replace(new RegExp(i[0],"g"),i[1])
    })
    return s;
}

function hideifandroid() {
    let params = getQueryParameters()
    if (params["utm_source"] !== "androidapp") {
        document.getElementById("btn-android").classList.remove("is-hidden")
    }
}

function getQueryParameters() {
    let queryString = window.location.search.substring(1)
    let params = queryString.split("&")
    let paramdict = {}
    for (let param of params) {
        paramdict[param.split("=")[0]] = param.split("=")[1]
    }
    return paramdict;
}

function getOffsetString(){
    if(timeOffset < 0 ){
        return "_neg_" + Math.abs(timeOffset).toString()
    }
    else if(timeOffset > 0 ){
        return "_pos_" + timeOffset.toString()
    }
    else {
        return ""
    }

}
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {

            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    document.getElementById("btn-a2hs").classList.remove("is-hidden")
    document.getElementById("btn-a2hs").addEventListener('click', e => {
        document.getElementById("btn-a2hs").classList.add("is-hidden")
        deferredPrompt.prompt();
    })

});