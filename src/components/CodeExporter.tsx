import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { RequestConfig } from '../types';

interface CodeExporterProps {
  config: RequestConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExporter: React.FC<CodeExporterProps> = ({ config, isOpen, onClose }) => {
  const [activeSnippet, setActiveSnippet] = useState<'curl' | 'fetch' | 'axios' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build target URL including enabled query parameters if not already merged in url string
  const getCombinedUrl = (): string => {
    let target = config.url.trim() || 'https://api.example.com';
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    return target;
  };

  // Compile Header object
  const getHeadersObject = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    config.headers.forEach(h => {
      if (h.enabled && h.key.trim()) {
        headers[h.key] = h.value;
      }
    });

    if (config.bodyType === 'json' && config.body.trim() && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  // 1. cURL Builder
  const buildCurlSnippet = (): string => {
    const url = getCombinedUrl();
    const headers = getHeadersObject();
    let snippet = `curl -X ${config.method} "${url}"`;

    Object.entries(headers).forEach(([key, val]) => {
      snippet += ` \\\n  -H "${key}: ${val}"`;
    });

    if (config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim()) {
      // Escape single quotes for shell safety
      const escapedBody = config.body.replace(/'/g, "'\\''");
      snippet += ` \\\n  -d '${escapedBody}'`;
    }

    return snippet;
  };

  // 2. Fetch Builder
  const buildFetchSnippet = (): string => {
    const url = getCombinedUrl();
    const headers = getHeadersObject();
    
    let options: any = { method: config.method };
    
    if (Object.keys(headers).length > 0) {
      options.headers = headers;
    }

    if (config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim()) {
      try {
        // Try parsing JSON to indent nicely, otherwise print raw
        const parsed = JSON.parse(config.body);
        options.body = `JSON.stringify(${JSON.stringify(parsed, null, 2)})`;
      } catch (e) {
        options.body = JSON.stringify(config.body);
      }
    }

    // Format options as string
    let optionsStr = JSON.stringify(options, null, 2);
    // Replace the quotes around JSON.stringify so it compiles as actual JS code
    if (options.body && options.body.startsWith('JSON.stringify')) {
      optionsStr = optionsStr.replace(
        `"body": "${options.body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`,
        `"body": ${options.body}`
      );
    }

    return `fetch("${url}", ${optionsStr})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));`;
  };

  // 3. Axios Builder
  const buildAxiosSnippet = (): string => {
    const url = getCombinedUrl();
    const headers = getHeadersObject();
    const methodLower = config.method.toLowerCase();
    
    let configObj: any = {};
    if (Object.keys(headers).length > 0) {
      configObj.headers = headers;
    }

    const configStr = Object.keys(configObj).length > 0 
      ? `, ${JSON.stringify(configObj, null, 2)}` 
      : '';

    if (config.method === 'GET' || config.method === 'HEAD') {
      return `import axios from 'axios';\n\naxios.${methodLower}("${url}"${configStr})\n  .then(response => {\n    console.log(response.data);\n  });`;
    }

    let bodyStr = 'null';
    if (config.body.trim()) {
      try {
        bodyStr = JSON.stringify(JSON.parse(config.body), null, 2);
      } catch (e) {
        bodyStr = JSON.stringify(config.body);
      }
    }

    return `import axios from 'axios';\n\naxios.${methodLower}("${url}", ${bodyStr}${configStr})\n  .then(response => {\n    console.log(response.data);\n  });`;
  };

  // 4. Python Requests Builder
  const buildPythonSnippet = (): string => {
    const url = getCombinedUrl();
    const headers = getHeadersObject();
    const methodTitle = config.method.toUpperCase();

    let snippet = `import requests\n\nurl = "${url}"\n`;

    if (Object.keys(headers).length > 0) {
      snippet += `headers = ${JSON.stringify(headers, null, 4)}\n`;
    } else {
      snippet += `headers = {}\n`;
    }

    if (config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim()) {
      try {
        const parsed = JSON.parse(config.body);
        snippet += `payload = ${JSON.stringify(parsed, null, 4)}\n\n`;
        snippet += `response = requests.request("${methodTitle}", url, json=payload, headers=headers)\n`;
      } catch (e) {
        snippet += `payload = """${config.body}"""\n\n`;
        snippet += `response = requests.request("${methodTitle}", url, data=payload, headers=headers)\n`;
      }
    } else {
      snippet += `\nresponse = requests.request("${methodTitle}", url, headers=headers)\n`;
    }

    snippet += `print(response.status_code)\nprint(response.json())`;
    return snippet;
  };

  const getActiveCode = (): string => {
    switch (activeSnippet) {
      case 'curl': return buildCurlSnippet();
      case 'fetch': return buildFetchSnippet();
      case 'axios': return buildAxiosSnippet();
      case 'python': return buildPythonSnippet();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Code Snippets</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`modal-tab-btn ${activeSnippet === 'curl' ? 'active' : ''}`}
            onClick={() => setActiveSnippet('curl')}
          >
            cURL
          </button>
          <button 
            className={`modal-tab-btn ${activeSnippet === 'fetch' ? 'active' : ''}`}
            onClick={() => setActiveSnippet('fetch')}
          >
            Fetch API
          </button>
          <button 
            className={`modal-tab-btn ${activeSnippet === 'axios' ? 'active' : ''}`}
            onClick={() => setActiveSnippet('axios')}
          >
            Axios
          </button>
          <button 
            className={`modal-tab-btn ${activeSnippet === 'python' ? 'active' : ''}`}
            onClick={() => setActiveSnippet('python')}
          >
            Python
          </button>
        </div>

        <div className="modal-body">
          <div className="snippet-actions">
            <span className="language-badge">{activeSnippet.toUpperCase()}</span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={14} style={{ color: 'var(--success)' }} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
          <pre className="code-block code-font">
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
