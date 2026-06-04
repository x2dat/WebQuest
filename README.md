# WebQuest 🚀

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-glass&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-glass&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-glass&logo=vite)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-glass)](LICENSE)

**WebQuest** is a browser-native, visually stunning HTTP API Client and Interception Simulator. Designed with a dark glassmorphic design system, it serves as a lightweight, lightning-fast alternative to desktop applications like Postman or Insomnia. It runs entirely in the browser, stores histories locally, organizes folders, and features an integrated simulated mock server. <br> <hr>
Check it out: <a href="https://x2dat.github.io/WebQuest/" target="_blank" rel="noopener noreferrer">https://x2dat.github.io/WebQuest/</a>

---

## Key Features ⚡

*   🌐 **Native HTTP Client**: Test GET, POST, PUT, DELETE, PATCH, OPTIONS, and HEAD requests with customizable headers, body contents, and parameters.
*   🎭 **Client-Side Mock Interception**: Bypass network layers and CORS locks completely! Simulate API delays, custom status codes, headers, and mock JSON payloads directly within the client.
*   🔄 **URL-Param Synchronizer**: Edit query parameters visually in a table, and watch the URL auto-compile. Modify parameters in the URL bar, and watch the table update instantly.
*   🌳 **Interactive JSON Tree Viewer**: Easily read large JSON structures. Supports recursive collapsing/expanding of objects and arrays, color-coded types (strings, numbers, booleans, null), and **real-time search highlighting**.
*   💻 **Multi-Format Code Exporter**: Instantly export configured API calls into executable code snippets for **cURL**, **JavaScript Fetch**, **Axios**, and **Python Requests**.
*   📂 **Local Storage Workspace**: Save requests in custom collections (folders) and browse your recent request history. Everything persists locally across reloads.
*   🛡️ **CORS Diagnostics**: Displays visual guides and troubleshooting suggestions when requests fail due to origin blocks or network timeouts.

---

## Tech Stack 🛠️

*   **Framework**: React 19 + TypeScript 6
*   **Build Tool**: Vite 8
*   **Styling**: Pure CSS (using custom CSS properties, flexboxes, responsive CSS grids, and backdrop glass blurs)
*   **Icons**: Lucide React

---

## Getting Started ⚙️

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone & Install
```bash
# Clone the repository (replace with your repository url)
git clone https://github.com/your-username/webquest.git
cd webquest

# Install dependencies
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser to view the application.

### 3. Build for Production
To bundle the assets into static HTML/CSS/JS ready for deployment:
```bash
npm run build
```
The compiled files will be located in the `dist/` directory, ready to be hosted on **GitHub Pages**, **Vercel**, or **Netlify**.

---

## How It Works 🧠

### Client Mock Interceptor
WebQuest features a built-in simulation layer. When mock mode is enabled:
1. The client intercepts the request instead of firing a standard window `fetch`.
2. It executes a local timeout handler matching your configured millisecond delay.
3. It builds a virtual response object containing your custom headers, body data, and HTTP status code.
4. It renders it inside the response panels, allowing you to test how your frontend handles latency or error codes without spinning up backend resources.

### Auto Parameter Sync
The sync utilizes a bidirectional state compiler:
- Parsing extracts parameters via `URLSearchParams(url.split('?')[1])` and merges them with existing key-value arrays.
- Serializing rebuilds search queries and updates the parent text state safely without forcing page reloads or layout cycles.

---

## License 📄
This project is licensed under the MIT License - see the LICENSE file for details.
