let data;
let fiqh;
let theme = localStorage.getItem("theme");
let itv;
let timeOffset = 0;
if(theme===null){
    theme="light"
}
if(theme==="dark"){
    toggleTheme();
}
fetch("/assets/data/timings.json").then(r=>r.json()).then(d=>{
    fiqh = localStorage.getItem("fiqh");
    timeOffset = localStorage.getItem("timeOffset")
    data = d;
    if(fiqh===null){
        fiqh="ahlesunnat"
        localStorage.setItem("fiqh",fiqh)
    }
    else if(fiqh==="shia"){
        document.getElementById("change-fiqh").checked = true;
    }
    if(timeOffset===null){
        timeOffset = 0;
    }
    else {
        document.querySelector(`#offsetSelect option[data-offset='${timeOffset}']`).selected = true;
    }
    loadData()
})

function loadData(){
    if(data===undefined) return;
    document.getElementById("clock").innerHTML=""
    document.getElementById("a2clink").href = `assets/calendars/${fiqh}/timings.ics`
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
    if(!Object.keys(data[fiqh]).includes(todaysdate)){
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset)
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset)
        document.getElementById("text-next").innerHTML =  "Sahar"

    }
    else if(timestamp < data[fiqh][todaysdate]["sehri_timestamp"]*1000){
        division = 0;
        nexttimestamp = data[fiqh][todaysdate]["sehri_timestamp"]
        
        document.getElementById("text-sehritime").innerHTML = data[fiqh][todaysdate]["sehri"].timeOffset(timeOffset)
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset)
        document.getElementById("text-next").innerHTML =  "Sahar"

    }
    else if(timestamp < data[fiqh][todaysdate]["iftar_timestamp"]*1000){
        division = 1;
        nexttimestamp = data[fiqh][todaysdate]["iftar_timestamp"]

        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset)
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][todaysdate]["iftar"].timeOffset(timeOffset)
        document.getElementById("text-next").innerHTML =  "Iftar"

    }
    else {
        division = 2;
        nexttimestamp = data[fiqh][tomorrow]["sehri_timestamp"]
        document.getElementById("text-sehritime").innerHTML = data[fiqh][tomorrow]["sehri"].timeOffset(timeOffset)
        document.getElementById("text-iftartime").innerHTML =  data[fiqh][tomorrow]["iftar"].timeOffset(timeOffset)
        document.getElementById("text-next").innerHTML =  "Sahar"

    }
    
    nexttimestamp = nexttimestamp + (timeOffset*60)
    let clock = document.getElementById("clock")
    let per;
    let prevtimestamp;
    if(moment.now()>Object.values(data[fiqh])[0]["sehri_timestamp"]*1000){
        if(division===0){
            prevtimestamp = data[fiqh][yesterday]["iftar_timestamp"]
        }
        else if(division===1){
            prevtimestamp = data[fiqh][todaysdate]["sehri_timestamp"]
        }
        else if(division===2){
            prevtimestamp = data[fiqh][todaysdate]["iftar_timestamp"]
        }
        prevtimestamp = prevtimestamp + (timeOffset*60)
        let delta = moment(moment.now()).diff(moment(prevtimestamp*1000));
        per = delta*100/((nexttimestamp - prevtimestamp)*1000)
    }
    else{
        per = 0;
    }
    document.getElementById("timeprogress").value= Math.round(per)
    document.querySelector(".progress-value").innerHTML=`${per.toFixed(2)}%`
    itv = setInterval(()=>{
        if(nexttimestamp*1000 <= moment.now()){
            
            clearInterval(itv)
            loadData();
            return;
        } 
        if(moment.now()>Object.values(data[fiqh])[0]["sehri_timestamp"]*1000){
            let delta = moment(moment.now()).diff(moment(prevtimestamp*1000));
            per = delta*100/((nexttimestamp - prevtimestamp)*1000)
            document.getElementById("timeprogress").value= Math.round(per)
            document.querySelector(".progress-value").innerHTML=`${per.toFixed(2)}%`
        }
        let diff = moment.duration(moment(nexttimestamp*1000).diff(moment(moment.now())))._data
        clock.innerHTML=`${diff.hours.toString().padStart(2,"0")}:${diff.minutes.toString().padStart(2,"0")}:${diff.seconds.toString().padStart(2,"0")}`
    },1000)
}


function getTodaysDate(doffset){
    d = new Date();
    return `${(d.getDate()+doffset).toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`
}

document.getElementById("change-fiqh").addEventListener('change',e=>{
    if(e.target.checked){
        fiqh = "shia"
    }
    else {
        fiqh = "ahlesunnat"
    }
    loadData()
    localStorage.setItem("fiqh",fiqh)
})
document.getElementById("offsetSelect").addEventListener('change',e=>{
    timeOffset = parseInt(e.target.selectedOptions[0].dataset["offset"])
    localStorage.setItem("timeOffset", timeOffset)
    loadData();
})

function launchCalendar(){
    document.querySelector("#modal-calendar tbody").innerHTML = Object.keys(data[fiqh]).map(date=>{
       return `<tr><td>${date}</td><td>${data[fiqh][date]["sehri"].timeOffset(timeOffset)}</td><td>${data[fiqh][date]["iftar"].timeOffset(timeOffset)}</td></tr>`
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

String.prototype.timeOffset = function(offset){
    let t = moment(this, 'h:mma')
    t.add(offset,'minute')
    return t.format('h:mma')

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
