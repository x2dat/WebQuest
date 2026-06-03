import React, { useState, useEffect } from 'react';
import { Play, Code, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { RequestConfig, KeyValueParam, Method } from '../types';

interface RequestPanelProps {
  activeRequest: RequestConfig;
  onChangeRequest: (config: RequestConfig) => void;
  onSend: () => void;
  isLoading: boolean;
  onShowCodeExport: () => void;
}

export const RequestPanel: React.FC<RequestPanelProps> = ({
  activeRequest,
  onChangeRequest,
  onSend,
  isLoading,
  onShowCodeExport
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'mock'>('params');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync URL parameters when URL input changes
  const handleUrlChange = (newUrl: string) => {
    let parsedParams: KeyValueParam[] = [];

    try {
      if (newUrl.includes('?')) {
        const parts = newUrl.split('?');
        const searchParams = new URLSearchParams(parts[1]);
        
        // Preserve existing params ids if keys match
        searchParams.forEach((value, key) => {
          const existing = activeRequest.params.find(p => p.key === key);
          parsedParams.push({
            id: existing ? existing.id : Math.random().toString(36).substring(2, 9),
            key,
            value,
            enabled: existing ? existing.enabled : true
          });
        });
      }
    } catch (e) {
      // Ignored for invalid url typing
    }

    // Retain params that were added manually if they aren't in search query
    const mergedParams = [...parsedParams];
    activeRequest.params.forEach(p => {
      if (!parsedParams.some(pp => pp.key === p.key) && p.key !== '') {
        // Keeps user-created params but marks them disabled as they're not in url
        mergedParams.push({ ...p, enabled: false });
      }
    });

    onChangeRequest({
      ...activeRequest,
      url: newUrl,
      params: mergedParams.length > 0 ? mergedParams : activeRequest.params
    });
  };

  // Sync URL string when parameters table changes
  const updateUrlFromParams = (params: KeyValueParam[]) => {
    try {
      const urlObj = new URL(activeRequest.url.startsWith('http') ? activeRequest.url : `https://${activeRequest.url}`);
      const searchParams = new URLSearchParams();
      
      params.forEach(p => {
        if (p.enabled && p.key.trim()) {
          searchParams.append(p.key, p.value);
        }
      });

      const queryString = searchParams.toString();
      const newUrl = urlObj.origin + urlObj.pathname + (queryString ? `?${queryString}` : '');
      
      onChangeRequest({
        ...activeRequest,
        url: activeRequest.url.startsWith('http') ? newUrl : newUrl.replace('https://', ''),
        params
      });
    } catch (e) {
      // Fallback manual URL assembly
      const parts = activeRequest.url.split('?');
      const baseUrl = parts[0];
      const searchParams = new URLSearchParams();
      
      params.forEach(p => {
        if (p.enabled && p.key.trim()) {
          searchParams.append(p.key, p.value);
        }
      });
      
      const queryString = searchParams.toString();
      onChangeRequest({
        ...activeRequest,
        url: baseUrl + (queryString ? `?${queryString}` : ''),
        params
      });
    }
  };

  const handleParamChange = (index: number, key: keyof KeyValueParam, val: any) => {
    const updated = [...activeRequest.params];
    updated[index] = { ...updated[index], [key]: val };
    
    // Add empty row if typing on the last row
    if (index === updated.length - 1 && updated[index].key.trim() !== '') {
      updated.push({ id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true });
    }

    updateUrlFromParams(updated);
  };

  const deleteParam = (index: number) => {
    const updated = activeRequest.params.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated.push({ id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true });
    }
    updateUrlFromParams(updated);
  };

  // Headers editing
  const handleHeaderChange = (index: number, key: keyof KeyValueParam, val: any) => {
    const updated = [...activeRequest.headers];
    updated[index] = { ...updated[index], [key]: val };

    if (index === updated.length - 1 && updated[index].key.trim() !== '') {
      updated.push({ id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true });
    }

    onChangeRequest({ ...activeRequest, headers: updated });
  };

  const deleteHeader = (index: number) => {
    const updated = activeRequest.headers.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated.push({ id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true });
    }
    onChangeRequest({ ...activeRequest, headers: updated });
  };

  // Body editing & check JSON validation
  const handleBodyChange = (val: string) => {
    if (activeRequest.bodyType === 'json' && val.trim() !== '') {
      try {
        JSON.parse(val);
        setJsonError(null);
      } catch (e: any) {
        setJsonError(e.message);
      }
    } else {
      setJsonError(null);
    }
    onChangeRequest({ ...activeRequest, body: val });
  };

  // Mock settings editing
  const handleMockChange = (key: string, val: any) => {
    onChangeRequest({
      ...activeRequest,
      mockConfig: {
        ...activeRequest.mockConfig,
        [key]: val
      }
    });
  };

  // Ensure there's always at least one empty row for params and headers on mount
  useEffect(() => {
    let changed = false;
    const updatedParams = [...activeRequest.params];
    const updatedHeaders = [...activeRequest.headers];

    if (updatedParams.length === 0 || updatedParams[updatedParams.length - 1].key !== '') {
      updatedParams.push({ id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true });
      changed = true;
    }

    if (updatedHeaders.length === 0 || updatedHeaders[updatedHeaders.length - 1].key !== '') {
      updatedHeaders.push({ id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true });
      changed = true;
    }

    if (changed) {
      onChangeRequest({
        ...activeRequest,
        params: updatedParams,
        headers: updatedHeaders
      });
    }
  }, [activeRequest.url]); // Re-evaluate when url changes

  const methods: Method[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

  return (
    <div className="request-panel glass-panel">
      {/* URL Address Bar */}
      <div className="address-bar">
        <select 
          value={activeRequest.method}
          onChange={(e) => onChangeRequest({ ...activeRequest, method: e.target.value as Method })}
          className={`method-select method-${activeRequest.method.toLowerCase()}`}
        >
          {methods.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        
        <input 
          type="text" 
          placeholder="Enter request URL or custom mock endpoint..." 
          value={activeRequest.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="url-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSend();
            }
          }}
        />

        <button 
          onClick={onSend} 
          disabled={isLoading}
          className={`send-button glow-btn ${activeRequest.mockConfig.enabled ? 'mock-active' : ''}`}
        >
          {isLoading ? (
            <div className="loader"></div>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>{activeRequest.mockConfig.enabled ? 'Mock' : 'Send'}</span>
            </>
          )}
        </button>

        <button 
          className="action-icon-btn" 
          onClick={onShowCodeExport} 
          title="Export request code snippets"
        >
          <Code size={16} />
        </button>
      </div>

      {/* Tabs list */}
      <div className="panel-tabs">
        <button 
          className={`panel-tab-btn ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
        >
          Query Params
          {activeRequest.params.filter(p => p.key.trim() !== '').length > 0 && (
            <span className="tab-indicator"></span>
          )}
        </button>
        <button 
          className={`panel-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
          {activeRequest.headers.filter(h => h.key.trim() !== '').length > 0 && (
            <span className="tab-indicator"></span>
          )}
        </button>
        <button 
          className={`panel-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
          disabled={activeRequest.method === 'GET' || activeRequest.method === 'HEAD'}
        >
          Body (JSON)
          {activeRequest.body.trim() !== '' && (
            <span className="tab-indicator"></span>
          )}
        </button>
        <button 
          className={`panel-tab-btn ${activeTab === 'mock' ? 'active' : ''} ${activeRequest.mockConfig.enabled ? 'mock-indicator' : ''}`}
          onClick={() => setActiveTab('mock')}
        >
          Mock Engine
          {activeRequest.mockConfig.enabled && (
            <span className="tab-indicator mock"></span>
          )}
        </button>
      </div>

      {/* Panel Contents */}
      <div className="panel-content-body">
        
        {/* Params Panel */}
        {activeTab === 'params' && (
          <div className="table-container">
            <div className="table-header-row">
              <div style={{ width: '40px' }}>Use</div>
              <div>Key</div>
              <div>Value</div>
              <div style={{ width: '40px' }}></div>
            </div>
            {activeRequest.params.map((param, index) => (
              <div key={param.id} className="table-row">
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={param.enabled} 
                    onChange={(e) => handleParamChange(index, 'enabled', e.target.checked)}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Parameter key..." 
                    value={param.key} 
                    onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Value..." 
                    value={param.value} 
                    onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                  />
                </div>
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  {index < activeRequest.params.length - 1 && (
                    <button className="row-delete-btn" onClick={() => deleteParam(index)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Headers Panel */}
        {activeTab === 'headers' && (
          <div className="table-container">
            <div className="table-header-row">
              <div style={{ width: '40px' }}>Use</div>
              <div>Key</div>
              <div>Value</div>
              <div style={{ width: '40px' }}></div>
            </div>
            {activeRequest.headers.map((header, index) => (
              <div key={header.id} className="table-row">
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={header.enabled} 
                    onChange={(e) => handleHeaderChange(index, 'enabled', e.target.checked)}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Header name..." 
                    value={header.key} 
                    list="common-headers"
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Value..." 
                    value={header.value} 
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  />
                </div>
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  {index < activeRequest.headers.length - 1 && (
                    <button className="row-delete-btn" onClick={() => deleteHeader(index)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <datalist id="common-headers">
              <option value="Content-Type" />
              <option value="Authorization" />
              <option value="Accept" />
              <option value="User-Agent" />
              <option value="Cache-Control" />
              <option value="Origin" />
            </datalist>
          </div>
        )}

        {/* Body Panel */}
        {activeTab === 'body' && (
          <div className="editor-container">
            <div className="editor-header">
              <span>JSON Content Payload</span>
              {jsonError ? (
                <span className="json-status error">Invalid JSON: {jsonError}</span>
              ) : (
                activeRequest.body.trim() !== '' && <span className="json-status success">JSON Valid</span>
              )}
            </div>
            <textarea 
              className="code-font"
              placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
              value={activeRequest.body}
              onChange={(e) => handleBodyChange(e.target.value)}
            />
          </div>
        )}

        {/* Mock Server Panel */}
        {activeTab === 'mock' && (
          <div className="mock-panel-container">
            <div className="mock-toggle-bar">
              <div className="mock-toggle-info">
                <h4>Client Mock Interception Engine</h4>
                <p>When enabled, requests to this URL bypass the network and return this custom response simulation.</p>
              </div>
              <button 
                className={`mock-status-toggle ${activeRequest.mockConfig.enabled ? 'active' : ''}`}
                onClick={() => handleMockChange('enabled', !activeRequest.mockConfig.enabled)}
              >
                {activeRequest.mockConfig.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{activeRequest.mockConfig.enabled ? 'Mock Active' : 'Network Active'}</span>
              </button>
            </div>

            {activeRequest.mockConfig.enabled && (
              <div className="mock-grid">
                <div className="mock-fields-column">
                  <div className="form-group">
                    <label>Simulated Status Code</label>
                    <input 
                      type="number" 
                      placeholder="200" 
                      value={activeRequest.mockConfig.status}
                      onChange={(e) => handleMockChange('status', parseInt(e.target.value) || 200)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Simulated Network Delay (ms)</label>
                    <input 
                      type="number" 
                      placeholder="500" 
                      value={activeRequest.mockConfig.delay}
                      onChange={(e) => handleMockChange('delay', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="mock-headers-section">
                    <label>Mock Response Headers</label>
                    <div className="mock-headers-list">
                      {activeRequest.mockConfig.headers.map((h, i) => (
                        <div key={i} className="mock-header-row">
                          <input 
                            type="text" 
                            placeholder="Header..." 
                            value={h.key}
                            onChange={(e) => {
                              const updated = [...activeRequest.mockConfig.headers];
                              updated[i].key = e.target.value;
                              handleMockChange('headers', updated);
                            }}
                          />
                          <input 
                            type="text" 
                            placeholder="Value..." 
                            value={h.value}
                            onChange={(e) => {
                              const updated = [...activeRequest.mockConfig.headers];
                              updated[i].value = e.target.value;
                              handleMockChange('headers', updated);
                            }}
                          />
                          <button 
                            className="mock-del-header"
                            onClick={() => {
                              const updated = activeRequest.mockConfig.headers.filter((_, idx) => idx !== i);
                              handleMockChange('headers', updated);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button 
                        className="mock-add-header-btn"
                        onClick={() => {
                          const updated = [...activeRequest.mockConfig.headers, { key: '', value: '' }];
                          handleMockChange('headers', updated);
                        }}
                      >
                        <Plus size={12} /> Add Header
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mock-body-column">
                  <div className="editor-container">
                    <div className="editor-header">
                      <span>Mock Response Body (JSON/Text)</span>
                    </div>
                    <textarea 
                      className="code-font"
                      placeholder="{\n  &quot;message&quot;: &quot;Hello from WebQuest!&quot;\n}"
                      value={activeRequest.mockConfig.body}
                      onChange={(e) => handleMockChange('body', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
