import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { CodeExporter } from './components/CodeExporter';
import type { Collection, HistoryItem, RequestConfig, ResponseData } from './types';
import './App.css';

const DEFAULT_REQUEST: RequestConfig = {
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  headers: [
    { id: '1', key: 'Accept', value: 'application/json', enabled: true }
  ],
  params: [],
  bodyType: 'none',
  body: '',
  mockConfig: {
    enabled: false,
    status: 200,
    delay: 500,
    body: '{\n  "message": "Hello from mock server!"\n}',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ]
  }
};

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeRequest, setActiveRequest] = useState<RequestConfig>(DEFAULT_REQUEST);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Load persistence configurations from LocalStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('webquest_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedCollections = localStorage.getItem('webquest_collections');
      if (savedCollections) setCollections(JSON.parse(savedCollections));
    } catch (e) {
      console.error('Failed to load storage assets', e);
    }
  }, []);

  // Save changes to history
  const saveHistory = (updatedHistory: HistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('webquest_history', JSON.stringify(updatedHistory));
  };

  // Save changes to collections
  const saveCollections = (updatedCols: Collection[]) => {
    setCollections(updatedCols);
    localStorage.setItem('webquest_collections', JSON.stringify(updatedCols));
  };

  // 1. Send Request Handler (Trigger Fetch / Mock Server Engine)
  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponse(null);

    const startTime = performance.now();
    const config = { ...activeRequest };

    // --- Mock Interception Engine Mode ---
    if (config.mockConfig.enabled) {
      setTimeout(() => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        let parsedBody: any = config.mockConfig.body;
        try {
          parsedBody = JSON.parse(config.mockConfig.body);
        } catch (e) {
          // Fallback to text
        }

        const mockResponseHeaders: Record<string, string> = {};
        config.mockConfig.headers.forEach(h => {
          if (h.key.trim()) {
            mockResponseHeaders[h.key] = h.value;
          }
        });

        const mockResp: ResponseData = {
          status: config.mockConfig.status,
          statusText: 'Mock OK',
          headers: mockResponseHeaders,
          body: parsedBody,
          time: duration + config.mockConfig.delay,
          size: new Blob([config.mockConfig.body]).size,
          error: null
        };

        setResponse(mockResp);
        setIsLoading(false);

        // Add call to history
        const newHistoryItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          name: `Mock: ${config.url.split('?')[0].replace(/https?:\/\//, '')}`,
          timestamp: Date.now(),
          config
        };
        saveHistory([newHistoryItem, ...history]);
      }, config.mockConfig.delay);

      return;
    }

    // --- Real Network Fetch Mode ---
    let formattedUrl = config.url.trim();
    if (!formattedUrl) {
      setResponse({
        status: 0,
        statusText: 'Client Error',
        headers: {},
        body: null,
        time: 0,
        size: 0,
        error: 'URL cannot be empty.'
      });
      setIsLoading(false);
      return;
    }

    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const headersObj: Record<string, string> = {};
    config.headers.forEach(h => {
      if (h.enabled && h.key.trim()) {
        headersObj[h.key] = h.value;
      }
    });

    if (config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim() !== '') {
      if (!headersObj['Content-Type']) {
        headersObj['Content-Type'] = 'application/json';
      }
    }

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: headersObj
    };

    if (config.method !== 'GET' && config.method !== 'HEAD' && config.body.trim() !== '') {
      fetchOptions.body = config.body;
    }

    try {
      const fetchPromise = fetch(formattedUrl, fetchOptions);
      
      // Setup network execution timeout (15s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      fetchOptions.signal = controller.signal;

      const res = await fetchPromise;
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Parse headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      // Parse body text or JSON
      const text = await res.text();
      let bodyData: any = text;
      try {
        bodyData = JSON.parse(text);
      } catch (e) {
        // Leave as string
      }

      const byteSize = new Blob([text]).size;

      const parsedResp: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: bodyData,
        time: duration,
        size: byteSize,
        error: null
      };

      setResponse(parsedResp);

      // Add to history
      const urlShort = formattedUrl.split('?')[0].replace(/https?:\/\//, '');
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: urlShort.length > 28 ? urlShort.substring(0, 28) + '...' : urlShort,
        timestamp: Date.now(),
        config
      };
      saveHistory([newHistoryItem, ...history]);

    } catch (err: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      setResponse({
        status: 0,
        statusText: 'Connection Error',
        headers: {},
        body: null,
        time: duration,
        size: 0,
        error: err.message || 'CORS Policy violation or remote host unreachable.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Select / Load request configuration
  const handleSelectRequest = (config: RequestConfig, _name?: string) => {
    setActiveRequest(config);
    setResponse(null);
  };

  // 3. Clear History Logs
  const handleClearHistory = () => {
    saveHistory([]);
  };

  // 4. Delete History Item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
  };

  // 5. Create Collection Folder
  const handleCreateCollection = (name: string) => {
    const newCollection: Collection = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      requests: []
    };
    saveCollections([...collections, newCollection]);
  };

  // 6. Delete Collection Folder
  const handleDeleteCollection = (id: string) => {
    const updated = collections.filter(col => col.id !== id);
    saveCollections(updated);
  };

  // 7. Add Active Request to Collection Folder
  const handleSaveToCollection = (collectionId: string, name: string) => {
    const newReqItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      timestamp: Date.now(),
      config: { ...activeRequest }
    };

    const updated = collections.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          requests: [newReqItem, ...col.requests]
        };
      }
      return col;
    });

    saveCollections(updated);
  };

  // 8. Delete Request from Collection Folder
  const handleDeleteFromCollection = (collectionId: string, requestId: string) => {
    const updated = collections.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          requests: col.requests.filter(req => req.id !== requestId)
        };
      }
      return col;
    });

    saveCollections(updated);
  };

  return (
    <div className="app-container">
      {/* Visual background glows */}
      <div className="glow-bg glow-primary"></div>
      <div className="glow-bg glow-secondary"></div>

      {/* Sidebar navigation */}
      <Sidebar 
        history={history}
        collections={collections}
        onSelectRequest={handleSelectRequest}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onCreateCollection={handleCreateCollection}
        onDeleteCollection={handleDeleteCollection}
        onSaveToCollection={handleSaveToCollection}
        onDeleteFromCollection={handleDeleteFromCollection}
      />

      {/* Content panes split screen */}
      <main className="main-content">
        <div className="main-dashboard">
          
          <RequestPanel 
            activeRequest={activeRequest}
            onChangeRequest={setActiveRequest}
            onSend={handleSendRequest}
            isLoading={isLoading}
            onShowCodeExport={() => setIsCodeModalOpen(true)}
          />

          <ResponsePanel 
            response={response}
          />

        </div>
      </main>

      {/* Code Export overlay modal */}
      <CodeExporter 
        config={activeRequest}
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
