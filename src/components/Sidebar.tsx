import React, { useState } from 'react';
import { 
  History, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FolderPlus
} from 'lucide-react';
import type { Collection, HistoryItem, RequestConfig, Method } from '../types';

interface SidebarProps {
  history: HistoryItem[];
  collections: Collection[];
  onSelectRequest: (config: RequestConfig, name?: string) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onSaveToCollection: (collectionId: string, name: string) => void;
  onDeleteFromCollection: (collectionId: string, requestId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  history,
  collections,
  onSelectRequest,
  onClearHistory,
  onDeleteHistoryItem,
  onCreateCollection,
  onDeleteCollection,
  onSaveToCollection,
  onDeleteFromCollection
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'collections'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [saveTargetCollection, setSaveTargetCollection] = useState<string | null>(null);
  const [saveRequestName, setSaveRequestName] = useState('');

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    onCreateCollection(newCollectionName.trim());
    setNewCollectionName('');
    setShowNewCollection(false);
  };

  const handleSaveToCollectionSubmit = (e: React.FormEvent, colId: string) => {
    e.preventDefault();
    if (!saveRequestName.trim()) return;
    onSaveToCollection(colId, saveRequestName.trim());
    setSaveRequestName('');
    setSaveTargetCollection(null);
  };

  const getMethodColorClass = (method: Method) => {
    switch (method) {
      case 'GET': return 'method-badge-get';
      case 'POST': return 'method-badge-post';
      case 'PUT': return 'method-badge-put';
      case 'DELETE': return 'method-badge-delete';
      case 'PATCH': return 'method-badge-patch';
      default: return 'method-badge-default';
    }
  };

  const filteredHistory = history.filter(item => 
    item.config.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCollections = collections.map(col => ({
    ...col,
    requests: col.requests.filter(req => 
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.config.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()) || col.requests.length > 0);

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">Q</div>
          <h1>WebQuest</h1>
        </div>
        <button 
          className="new-request-btn"
          onClick={() => onSelectRequest({
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            headers: [{ id: '1', key: 'Accept', value: 'application/json', enabled: true }],
            params: [],
            bodyType: 'none',
            body: '',
            mockConfig: {
              enabled: false,
              status: 200,
              delay: 500,
              body: '{\n  "message": "Hello from mock server!"\n}',
              headers: [{ key: 'Content-Type', value: 'application/json' }]
            }
          })}
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={15} />
          History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <FolderOpen size={15} />
          Collections
        </button>
      </div>

      <div className="sidebar-search">
        <Search size={14} className="search-icon" />
        <input 
          type="text" 
          placeholder="Filter logs or items..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-content">
        {activeTab === 'history' && (
          <div className="list-wrapper">
            <div className="list-header">
              <span>Recent Activity ({filteredHistory.length})</span>
              {history.length > 0 && (
                <button className="clear-btn" onClick={onClearHistory}>Clear</button>
              )}
            </div>
            {filteredHistory.length === 0 ? (
              <div className="empty-state">No recent requests</div>
            ) : (
              <div className="list-items">
                {filteredHistory.map(item => (
                  <div key={item.id} className="history-item">
                    <div 
                      className="history-info"
                      onClick={() => onSelectRequest(item.config, item.name)}
                    >
                      <span className={`method-badge ${getMethodColorClass(item.config.method)}`}>
                        {item.config.method}
                      </span>
                      <div className="url-container">
                        <span className="request-name">{item.name || 'Untitled'}</span>
                        <span className="url-text">{item.config.url}</span>
                      </div>
                    </div>
                    <button 
                      className="item-delete-btn" 
                      onClick={() => onDeleteHistoryItem(item.id)}
                      title="Delete from history"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="list-wrapper">
            <div className="list-header">
              <span>My Folders</span>
              <button 
                className="add-folder-btn"
                onClick={() => setShowNewCollection(!showNewCollection)}
                title="Create Collection"
              >
                <FolderPlus size={15} />
              </button>
            </div>

            {showNewCollection && (
              <form onSubmit={handleCreateCollection} className="new-collection-form">
                <input 
                  type="text" 
                  placeholder="Collection Name..." 
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  autoFocus
                />
                <div className="form-actions">
                  <button type="submit" className="save-btn">Create</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowNewCollection(false)}>Cancel</button>
                </div>
              </form>
            )}

            {filteredCollections.length === 0 ? (
              <div className="empty-state">No collections created</div>
            ) : (
              <div className="collections-list">
                {filteredCollections.map(col => (
                  <div key={col.id} className="collection-node">
                    <div className="collection-title-bar">
                      <div 
                        className="collection-click" 
                        onClick={() => toggleCollection(col.id)}
                      >
                        {expandedCollections[col.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="collection-name">{col.name}</span>
                        <span className="count-badge">{col.requests.length}</span>
                      </div>
                      <div className="collection-actions">
                        <button 
                          onClick={() => setSaveTargetCollection(saveTargetCollection === col.id ? null : col.id)} 
                          title="Add current request here"
                        >
                          <Plus size={14} />
                        </button>
                        <button 
                          onClick={() => onDeleteCollection(col.id)} 
                          title="Delete collection"
                          className="delete-btn"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {saveTargetCollection === col.id && (
                      <form 
                        onSubmit={(e) => handleSaveToCollectionSubmit(e, col.id)}
                        className="save-req-form"
                      >
                        <input 
                          type="text" 
                          placeholder="Request Name..." 
                          value={saveRequestName}
                          onChange={(e) => setSaveRequestName(e.target.value)}
                          autoFocus
                          required
                        />
                        <div className="form-actions">
                          <button type="submit" className="save-btn">Save</button>
                          <button type="button" className="cancel-btn" onClick={() => setSaveTargetCollection(null)}>Cancel</button>
                        </div>
                      </form>
                    )}

                    {expandedCollections[col.id] && (
                      <div className="collection-children">
                        {col.requests.length === 0 ? (
                          <div className="empty-child-state">Folder is empty</div>
                        ) : (
                          col.requests.map(req => (
                            <div key={req.id} className="collection-child-item">
                              <div 
                                className="history-info"
                                onClick={() => onSelectRequest(req.config, req.name)}
                              >
                                <span className={`method-badge ${getMethodColorClass(req.config.method)}`}>
                                  {req.config.method}
                                </span>
                                <div className="url-container">
                                  <span className="request-name">{req.name}</span>
                                  <span className="url-text">{req.config.url}</span>
                                </div>
                              </div>
                              <button 
                                className="item-delete-btn" 
                                onClick={() => onDeleteFromCollection(col.id, req.id)}
                                title="Remove request"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
