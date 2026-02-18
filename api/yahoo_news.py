from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import re

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # URL de Yahoo Finance RSS feed
            url = "https://finance.yahoo.com/news/rssindex"
            
            # Usamos urllib para no depender de requests si no está instalado, 
            # aunque en Vercel podemos usar requirements.txt.
            # Para mayor robustez en este ejemplo simple, intento parsear el XML manualmente o usar una librería si estuviera.
            # Vamos a usar xml.etree.ElementTree que es nativo de Python.
            
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                xml_data = response.read()

            import xml.etree.ElementTree as ET
            root = ET.fromstring(xml_data)
            
            items = []
            # RSS 2.0 standard: channel -> item
            for item in root.findall('./channel/item'):
                title = item.find('title').text if item.find('title') is not None else "No Title"
                link = item.find('link').text if item.find('link') is not None else "#"
                pubDate = item.find('pubDate').text if item.find('pubDate') is not None else ""
                
                items.append({
                    "title": title,
                    "link": link,
                    "pubDate": pubDate
                })

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"data": items}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
