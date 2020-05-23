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
    if(fiqh==="kargil"){
        document.getElementById("change-fiqh").checked = true;
        document.querySelector("#offsetSelect option[data-special=kargil]").selected =true;
    }
    loadData()
})

function loadData() {
    if (data === undefined) return;
    if((fiqh==="ahlesunnat" && moment.now() >= 1590329100*1000)||
        (fiqh==="shia"&&moment.now()>=1590329640*1000)||
        (fiqh==="kargil" && moment.now() > 1590329580*1000) ){
            document.getElementById("mainbody").style.display="none"
            document.getElementById("em").style.display="block";
            console.log("em")
        return
    }
    if(moment.now() > 1590243180000){
        document.querySelector("option[data-special]").classList.add("is-hidden")   
    }
    document.querySelector("option[data-special=kargil]").classList.add("is-hidden")
    // document.getElementById("offsetSelect").selectedIndex = 0
    console.log(fiqh)
    if(fiqh==="shia" || fiqh==="kargil"){
        document.querySelector("option[data-special=kargil]").classList.remove("is-hidden")
    }
    if(fiqh==="kargil"){
        timeOffset = 0;
    }
    document.getElementById("clock").innerHTML = ""
    document.getElementById("a2clink").href = `assets/calendars/${fiqh}/timings${getOffsetString()}.ics`
    clearInterval(itv);
    let hDate = (moment(moment.now()).diff(moment("25/04/2020",'%D/%M/%Y'),'days') +1).toString()
    let hMonth = "Ramadan"
    let hSym = "AH" 
    if(lang !== "en"){
        hMonth = 'رمضان'
        hSym = "ھ"
    }
    else {
        let suffix = "th"
        if(hDate.endsWith("1")) suffix = "st"
        if(hDate.endsWith("2")) suffix = "nd"
        if(hDate.endsWith("3")) suffix = "rd"
        hDate += suffix 
    }
    document.getElementById('dateToday').innerHTML = `${hDate.translate()} ${hMonth} ${(1441).toString().translate()} ${hSym}`
    let todaysdate = getTodaysDate(0);
    let tomorrow = getTodaysDate(1);
    let yesterday = getTodaysDate(-1);
    let timestamp = (new Date()).getTime()
    let division;
    let nexttimestamp
    console.log(tomorrow)
    if (!Object.keys(data[fiqh]).includes(todaysdate)) {
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_sahar"]
        bindAlarms(data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset),data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset))
    } 
    else if (timestamp < (data[fiqh][todaysdate]["sehri_timestamp"]+ (timeOffset * 60)) * 1000) {
        /* 00:00 to Sahar */
        division = 0;
        nexttimestamp = data[fiqh][todaysdate]["sehri_timestamp"]

        document.getElementById("text-sehritime").innerHTML = data[fiqh][todaysdate]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_sahar"]
        bindAlarms(data[fiqh][todaysdate]["sehri"].timeOffset(timeOffset),data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset))

    } else if (timestamp < (data[fiqh][todaysdate]["iftar_timestamp"]+ (timeOffset * 60)) * 1000) {
        /* Sahar to Iftar*/
        division = 1;
        nexttimestamp = data[fiqh][todaysdate]["iftar_timestamp"]
        if(!Object.keys(data[fiqh]).includes(tomorrow)){
            document.getElementById("text-sehritime").style = {'display':'none'}
        }
        else {
            document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset).translate()
        }
        document.getElementById("text-iftartime").innerHTML = data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_iftar"]
        if(Object.keys(data[fiqh]).includes(tomorrow)){
            bindAlarms(data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset),data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset))
           
        }
    } else {
        /* Iftar to Sahar */
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset).translate()
        document.getElementById("text-iftartime").innerHTML = data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset).translate()
        document.getElementById("text-next").innerHTML = langdata["word_sahar"]
        bindAlarms(data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset),data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset))

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
    return moment(moment.now()).add(doffset,'days').format("DD/MM/YYYY")
}

document.getElementById("change-fiqh").addEventListener('change', e => {
    if (e.target.checked) {
        fiqh = "shia"
    } else {
        fiqh = "ahlesunnat"
    }
    document.querySelector(`#offsetSelect option[data-offset='${timeOffset}']`).selected = true;

    loadData()
    localStorage.setItem("fiqh", fiqh)
})
document.getElementById("offsetSelect").addEventListener('change', e => {
    timeOffset = parseInt(e.target.selectedOptions[0].dataset["offset"])
    if(e.target.selectedOptions[0].dataset.special === "kargil"){
        fiqh = "kargil"
        localStorage.setItem("fiqh", fiqh)
    }
    else {
            if (document.getElementById("change-fiqh").checked) {
                fiqh = "shia"
            } else {
                fiqh = "ahlesunnat"
            }
    }
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
function changeLanguage(e){
    if(e===0) t = "en"
    if(e===1) t ="ur"
    if(e===2) t ="kmr"
    localStorage.setItem("language",t)
    toggleLanguage(t)
}
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
String.prototype.tf = function(){
    let t = moment(this, 'h:mma')
    return t.format('H:mm')

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
    if (params["utm_source"] === "androidapp") {
        document.getElementById("alarm-sahar").classList.remove("is-hidden")
        document.getElementById("alarm-iftar").classList.remove("is-hidden")

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

function bindAlarms(sahar,iftar){
    sahar = sahar.tf().split(":")
    iftar = iftar.tf().split(":")
    document.getElementById('alarm-sahar').addEventListener('click',e=>{
        window.location =`intent://iftarkar.com?hour=${sahar[0]}&minute=${sahar[1]}&message=Sahar#Intent;scheme=myscheme;package=org.hackesta.iftarkar;action=alarmaction;end`
    })
    document.getElementById('alarm-iftar').addEventListener('click',e=>{
        window.location =`intent://iftarkar.com?hour=${iftar[0]}&minute=${iftar[1]}&message=Iftar#Intent;scheme=myscheme;package=org.hackesta.iftarkar;action=alarmaction;end`
    })
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
