import React, { useState } from 'react';
import { Copy, Download, AlertCircle, FileText, Check, Search } from 'lucide-react';
import type { ResponseData } from '../types';

interface ResponsePanelProps {
  response: ResponseData | null;
}

// Custom Recursive JSON Node Component
const JsonTreeNode: React.FC<{
  name: string | number;
  val: any;
  isLast: boolean;
  depth: number;
  filter: string;
}> = ({ name, val, isLast, depth, filter }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 3); // auto-expand first few levels

  const isObject = val !== null && typeof val === 'object';
  const isArray = Array.isArray(val);
  const type = val === null ? 'null' : typeof val;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const matchesFilter = (k: string | number, v: any): boolean => {
    if (!filter) return false;
    const search = filter.toLowerCase();
    if (String(k).toLowerCase().includes(search)) return true;
    if (!isObject && String(v).toLowerCase().includes(search)) return true;
    return false;
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <mark key={i} className="json-highlight">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const renderValue = () => {
    const isMatched = matchesFilter(name, val);
    const wrapClass = isMatched ? 'json-match' : '';

    if (val === null) {
      return <span className={`json-null ${wrapClass}`}>null</span>;
    }
    if (type === 'string') {
      return <span className={`json-string ${wrapClass}`}>"{highlightText(val, filter)}"</span>;
    }
    if (type === 'number') {
      return <span className={`json-number ${wrapClass}`}>{highlightText(String(val), filter)}</span>;
    }
    if (type === 'boolean') {
      return <span className={`json-boolean ${wrapClass}`}>{String(val)}</span>;
    }
    return <span className={wrapClass}>{String(val)}</span>;
  };

  const renderKey = () => {
    const keyStr = typeof name === 'number' ? `${name}` : `"${name}"`;
    return (
      <span className={`json-key ${matchesFilter(name, '') ? 'json-key-match' : ''}`}>
        {highlightText(keyStr, filter)}
      </span>
    );
  };

  const indent = { paddingLeft: `${depth * 18}px` };

  if (!isObject) {
    return (
      <div className="json-node-row" style={indent}>
        {renderKey()}: {renderValue()}{!isLast && ','}
      </div>
    );
  }

  const keys = Object.keys(val);
  const isEmpty = keys.length === 0;
  const opener = isArray ? '[' : '{';
  const closer = isArray ? ']' : '}';

  return (
    <div className="json-node-expandable">
      <div className="json-node-row clickable" style={indent} onClick={toggleExpand}>
        <span className={`json-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
        {renderKey()}: <span className="json-bracket">{opener}</span>
        {!isExpanded && (
          <span className="json-collapsed-preview" onClick={toggleExpand}>
            {isArray ? ` ... ${keys.length} items ` : ` ... ${keys.length} keys `}
          </span>
        )}
        {!isExpanded && <span className="json-bracket">{closer}{!isLast && ','}</span>}
      </div>

      {isExpanded && !isEmpty && (
        <div className="json-children-block">
          {keys.map((k, i) => (
            <JsonTreeNode
              key={k}
              name={isArray ? i : k}
              val={val[k]}
              isLast={i === keys.length - 1}
              depth={depth + 1}
              filter={filter}
            />
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="json-node-row" style={indent}>
          <span className="json-bracket" style={{ paddingLeft: '12px' }}>{closer}{!isLast && ','}</span>
        </div>
      )}
    </div>
  );
};

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!response) {
    return (
      <div className="response-panel empty glass-panel">
        <div className="empty-response-watermark">
          <FileText size={48} className="watermark-icon" />
          <h3>Awaiting Request</h3>
          <p>Configure an endpoint and trigger a call or activate mock mode to preview returns.</p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    let textToCopy = '';
    if (typeof response.body === 'object') {
      textToCopy = JSON.stringify(response.body, null, 2);
    } else {
      textToCopy = String(response.body);
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const filename = `response-${Date.now()}.${typeof response.body === 'object' ? 'json' : 'txt'}`;
    const content = typeof response.body === 'object' 
      ? JSON.stringify(response.body, null, 2) 
      : String(response.body);
      
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColorClass = (status: number) => {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    return 'status-server-error';
  };

  const isJson = response.body !== null && typeof response.body === 'object';
  const rawBodyText = isJson ? JSON.stringify(response.body, null, 2) : String(response.body || '');

  return (
    <div className="response-panel glass-panel">
      {/* Response Panel Header with Timings */}
      <div className="response-header">
        <div className="stats-row">
          <span className={`status-badge ${getStatusColorClass(response.status)}`}>
            {response.status} {response.statusText}
          </span>
          
          <div className="stat-pill">
            <span className="label">Time</span>
            <span className="value info-color">{response.time} ms</span>
          </div>

          <div className="stat-pill">
            <span className="label">Size</span>
            <span className="value warning-color">
              {response.size > 1024 
                ? `${(response.size / 1024).toFixed(2)} KB` 
                : `${response.size} B`}
            </span>
          </div>
        </div>

        <div className="actions-row">
          <button className="action-icon-btn" onClick={handleCopy} title="Copy response body">
            {copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
          </button>
          <button className="action-icon-btn" onClick={handleDownload} title="Download response file">
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Tabs / Actions */}
      <div className="response-tabs-bar">
        <div className="tabs-selectors">
          <button 
            className={`panel-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Response Body
          </button>
          <button 
            className={`panel-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers ({Object.keys(response.headers).length})
          </button>
        </div>

        {activeTab === 'body' && isJson && (
          <div className="json-search-box">
            <Search size={12} />
            <input 
              type="text" 
              placeholder="Search keys/values..." 
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Response Panel Content Body */}
      <div className="response-content-scroll">
        
        {/* Error States (specifically dealing with CORS / Offline) */}
        {response.error && (
          <div className="cors-warning-box">
            <div className="error-title">
              <AlertCircle size={18} />
              <h4>Request Failed: Client Network Error</h4>
            </div>
            <p>
              The request could not be completed. This is commonly caused by one of the following:
            </p>
            <ul>
              <li>
                <strong>CORS Policy Block:</strong> The target server does not send the correct <code>Access-Control-Allow-Origin</code> headers to permit requests from browser clients.
              </li>
              <li>
                <strong>Local Port Conflict:</strong> If targeting a local endpoint, verify that the host process is running and accepting calls.
              </li>
              <li>
                <strong>Invalid Protocol/URL:</strong> Ensure that the endpoint address is spelt correctly and uses <code>https://</code> for public sites.
              </li>
            </ul>
            <p className="tip-text">
              💡 <em>Pro-tip: Enable the <strong>Mock Engine</strong> tab in the request panel to simulate client responses instantly without CORS restrictions!</em>
            </p>
            <div className="raw-err-log code-font">
              Error details: {response.error}
            </div>
          </div>
        )}

        {/* Normal Response Bodies */}
        {!response.error && activeTab === 'body' && (
          <div className="body-output-area">
            {isJson ? (
              <div className="json-tree-container code-font">
                <span className="json-bracket">{Array.isArray(response.body) ? '[' : '{'}</span>
                <div className="json-tree-body">
                  {Object.keys(response.body).map((key, i) => (
                    <JsonTreeNode
                      key={key}
                      name={Array.isArray(response.body) ? i : key}
                      val={response.body[key]}
                      isLast={i === Object.keys(response.body).length - 1}
                      depth={1}
                      filter={searchFilter}
                    />
                  ))}
                </div>
                <span className="json-bracket">{Array.isArray(response.body) ? ']' : '}'}</span>
              </div>
            ) : (
              <pre className="raw-text-viewer code-font">
                <code>{rawBodyText}</code>
              </pre>
            )}
          </div>
        )}

        {/* Response Headers */}
        {!response.error && activeTab === 'headers' && (
          <div className="headers-table">
            <div className="table-header-row">
              <div>Header Key</div>
              <div>Header Value</div>
            </div>
            {Object.entries(response.headers).map(([key, val]) => (
              <div key={key} className="table-row code-font">
                <div className="header-key-label">{key}</div>
                <div className="header-value-label">{val}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
