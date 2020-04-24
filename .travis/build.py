import os
from os import listdir
from os.path import isfile, join, splitext

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
        %("https://iftarkar.hackesta..org/"+f.replace("index","").replace(".html","")))
    sitemap_file.write('</urlset>')
    sitemap_file.close()

gen_sitemap()
