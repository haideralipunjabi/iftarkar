import os
from os import listdir
from os.path import isfile, join, splitext
from ics import Calendar, Event
import json
import arrow
from datetime import datetime as dt
onlyfiles = [f for f in listdir() if splitext(f)[1]==".html"]


def gen_sitemap():
    sitemap_file = open("sitemap.xml","w")
    sitemap_file.write('<?xml version="1.0" encoding="UTF-8"?>')
    sitemap_file.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for f in onlyfiles:
        sitemap_file.write(
            '''
            <url>
                <loc>%s</loc>
            </url>
            '''
        %("https://iftarkar.com/"+f.replace("index","").replace(".html","")))
    sitemap_file.write('</urlset>')
    sitemap_file.close()

def gen_ics():
    data = json.load(open("assets/data/timings.json"))
    os.system("rm -rf assets/calendars")
    os.system("mkdir assets/calendars")
    for fiqh in data.keys():
        os.system("mkdir assets/calendars/"+fiqh)
        c = Calendar()
        for d in data[fiqh].keys():
            es = Event()
            ei = Event()
            stime = arrow.get(dt.fromtimestamp(data[fiqh][d]["sehri_timestamp"]),'Asia/Kolkata').strftime("%Y-%m-%d %H:%M:00")
            itime = arrow.get(dt.fromtimestamp(data[fiqh][d]["iftar_timestamp"]),"Asia/Kolkata").strftime("%Y-%m-%d %H:%M:00")
            time = dt.now()
            es.name = "Sahar Ending"
            es.begin = stime
            es.created = time
            es.end = stime
            ei.name = "Iftar Beginning"
            ei.created = time
            ei.begin = itime
            ei.end = itime
            c.events.add(es)
            c.events.add(ei)
        with open("assets/calendars/%s/timings.ics"%(fiqh),"w") as my_file:
            my_file.writelines(c)



gen_sitemap()
gen_ics()