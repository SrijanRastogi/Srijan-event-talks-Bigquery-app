# BigQuery Changelog Explorer 🚀

A high-performance, developer-focused web application built with **Python Flask** and **Vanilla ES6+ JS/CSS3**. It fetches, compiles, and groups the latest Google BigQuery release notes, allowing programmers to search, filter by tag, and format individual or multiple updates to post directly to WhatsApp with automated markdown.

---

## ✨ Features

- **Split Timeline Interface**: A sleek, asymmetric design inspired by Linear and Vercel. Dates are anchored in a sticky left-column on scroll, while update logs stack cleanly in the right-column.
- **Instant Search & Tag Filtering**: Real-time searching through update contents with outline-bordered category badges (`FEATURES`, `FIXES`, `ISSUES`, `CHANGES`, `DEPRECATED`, `GENERAL`).
- **Unified Light & Dark Themes**: High-contrast, developer-centric styles (pure black `#09090b` dark canvas and clean white `#fafafa` light canvas) toggled instantly and persisted across sessions using `localStorage`.
- **Automated WhatsApp Markdown Builder**: Compiles selected updates into formatted markdown syntax (emojis, bullet-points, bold text headers, clean links) with a popup preview window before redirecting to the official WhatsApp Click-to-Chat API.
- **Smart Backend Caching**: Built-in 5-minute TTL caching in the Flask server to prevent redundant feed calls to Google Cloud servers and provide instantaneous client reloads.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.14+ (Flask, standard `urllib.request`, `xml.etree.ElementTree`, and `html.parser` parsing engines). No heavy external scraping libraries required.
- **Frontend**: 
  - Semantic HTML5.
  - Responsive CSS3 Grid & Flexbox (with custom styling for checkboxes, modal windows, and smooth animations).
  - Vanilla JavaScript (using async/await, native DOM operations, and `DOMParser`).
- **Icons & Fonts**: Google Material Icons Round, Geist Sans, and Geist Mono.

---

## 📂 Project Structure

```text
bq-releases-notes/
├── app.py                 # Main Flask server with API parsing & caching
├── requirements.txt       # Project python dependencies
├── .gitignore             # Standard git exclusions
├── README.md              # Documentation
├── static/
│   ├── app.js             # Client controller, search, selection & sharing
│   └── style.css          # Design variables, light/dark themes, timeline
└── templates/
    └── index.html         # HTML layout & modal container templates
```

---

## 🚀 Installation & Setup

### 1. Clone the repository (or navigate to directory)
```bash
cd "/d/Srijan Projects/agy-cli-projects/bq-releases-notes"
```

### 2. Create and activate a Virtual Environment (Recommended)
**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```
**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Dev Server
```bash
python app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser to explore.

---

## 🔗 Git Integration

To initialize this folder as a Git repository and push it to GitHub:

```bash
# Initialize repository
git init

# Add all files (respects .gitignore automatically)
git add .

# Create initial commit
git commit -m "feat: initial commit of bigquery changelog explorer web app"

# Link to GitHub and push (replace URL with your GitHub repository URL)
git branch -M main
git remote add origin https://github.com/yourusername/bq-releases-notes.git
git push -u origin main
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
