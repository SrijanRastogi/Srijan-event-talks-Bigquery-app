import time
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache configuration
CACHE_EXPIRY_SECONDS = 300  # 5 minutes
cache = {
    "data": None,
    "last_fetched": 0
}

class ReleaseNotesHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.updates = []
        self.current_type = "General"
        self.current_html = []
        self.recording = False

    def handle_starttag(self, tag, attrs):
        if tag == "h3":
            # Save previous update if any
            if self.current_html:
                self.updates.append({
                    "type": self.current_type,
                    "content": "".join(self.current_html).strip()
                })
                self.current_html = []
            self.recording = True
            self.current_type = ""
        else:
            attr_str = "".join([f' {k}="{v}"' for k, v in attrs])
            self.current_html.append(f"<{tag}{attr_str}>")

    def handle_endtag(self, tag):
        if tag == "h3":
            self.recording = False
            self.current_type = self.current_type.strip()
        else:
            self.current_html.append(f"</{tag}>")

    def handle_data(self, data):
        if self.recording:
            self.current_type += data
        else:
            self.current_html.append(data)

    def close(self):
        super().close()
        if self.current_html:
            self.updates.append({
                "type": self.current_type,
                "content": "".join(self.current_html).strip()
            })

def parse_release_notes_xml(xml_data):
    root = ET.fromstring(xml_data)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    entries = root.findall("atom:entry", ns)
    
    parsed_entries = []
    for entry in entries:
        title_elem = entry.find("atom:title", ns)
        updated_elem = entry.find("atom:updated", ns)
        content_elem = entry.find("atom:content", ns)
        id_elem = entry.find("atom:id", ns)
        
        title = title_elem.text if title_elem is not None else "Unknown Date"
        updated = updated_elem.text if updated_elem is not None else ""
        content_html = content_elem.text if content_elem is not None else ""
        entry_id = id_elem.text if id_elem is not None else str(hash(title + updated))
        
        # Parse the HTML content into structured list of updates
        parser = ReleaseNotesHTMLParser()
        parser.feed(content_html)
        parser.close()
        
        parsed_entries.append({
            "id": entry_id,
            "date": title,
            "updated": updated,
            "updates": parser.updates
        })
        
    return parsed_entries

def fetch_feed_data():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    # Check if cache is valid and not forced to refresh
    if not force_refresh and cache["data"] is not None and (current_time - cache["last_fetched"]) < CACHE_EXPIRY_SECONDS:
        return jsonify({
            "status": "success",
            "source": "cache",
            "last_fetched": cache["last_fetched"],
            "data": cache["data"]
        })
        
    try:
        xml_data = fetch_feed_data()
        parsed_data = parse_release_notes_xml(xml_data)
        
        # Update cache
        cache["data"] = parsed_data
        cache["last_fetched"] = current_time
        
        return jsonify({
            "status": "success",
            "source": "network",
            "last_fetched": current_time,
            "data": parsed_data
        })
    except Exception as e:
        # If network fails, serve cache if available
        if cache["data"] is not None:
            return jsonify({
                "status": "warning",
                "message": f"Network fetch failed ({str(e)}). Serving stale cache.",
                "source": "cache",
                "last_fetched": cache["last_fetched"],
                "data": cache["data"]
            })
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch release notes: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
