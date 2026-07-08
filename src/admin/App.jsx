import React, { useState, useEffect, useRef } from 'react';
import {
  HardDriveUpload,
  Eye,
  EyeOff,
  ArrowRight,
  LogOut,
  Image as ImageIcon,
  CloudUpload,
  ImagePlus,
  X,
  Search,
  RefreshCw,
  FolderOpen,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { neon } from '@neondatabase/serverless';
import './App.css';

export default function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('cdn_api_key') || '');

  // Database states
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  // Search / filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  // Copy state mapping
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fileInputRef = useRef(null);

  // Trigger Toast Notification
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Run on mount
  useEffect(() => {
    if (apiKey) {
      setIsAuthenticated(true);
      fetchImages(apiKey);
      checkServerHealth();
    }
  }, [apiKey]);

  // Check health check (verify environment variable configurations)
  const checkServerHealth = async () => {
    const connStr = import.meta.env.VITE_NEONDB_CONNECTION_STRING;
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const owner = import.meta.env.VITE_GITHUB_OWNER;
    const repo = import.meta.env.VITE_GITHUB_REPO;

    const dbConfigured = connStr && !connStr.includes('postgresql://user:pass@host/db');
    const githubConfigured = token && !token.includes('your_github');

    setServerOnline(!!(dbConfigured && githubConfigured));
  };

  // Fetch Images from NeonDB directly
  const fetchImages = async (token = apiKey) => {
    setLoadingImages(true);
    try {
      const connStr = import.meta.env.VITE_NEONDB_CONNECTION_STRING;
      if (!connStr || connStr.includes('postgresql://user:pass@host/db')) {
        triggerToast('Neon DB Connection string is not configured in .env', 'error');
        setLoadingImages(false);
        return;
      }

      const sql = neon(connStr);

      // Auto-ensure images table and indexes exist
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS images (
              id SERIAL PRIMARY KEY,
              from_id VARCHAR(50) NOT NULL,
              to_id VARCHAR(50) NOT NULL,
              file_path TEXT NOT NULL,
              cdn_url TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_images_from_id ON images (from_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_images_to_id ON images (to_id)`;
      } catch (tableErr) {
        console.warn('Table check/creation error, continuing query:', tableErr);
      }

      // Query database (all items)
      const rows = await sql`
        SELECT id, from_id as "from", to_id as "to", file_path, cdn_url, created_at 
        FROM images 
        ORDER BY created_at DESC
      `;
      setImages(rows || []);
    } catch (err) {
      console.error(err);
      triggerToast('Error connecting to image database: ' + err.message, 'error');
    } finally {
      setLoadingImages(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    if (!cleanPassword) return;

    const envAdminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || import.meta.env.VITE_API_KEY || 'baby').trim();

    if (cleanPassword === envAdminPassword) {
      const tokenVal = (import.meta.env.VITE_API_KEY && import.meta.env.VITE_API_KEY !== 'your_secure_api_key_here')
        ? import.meta.env.VITE_API_KEY
        : envAdminPassword;
      setApiKey(tokenVal);
      sessionStorage.setItem('cdn_api_key', tokenVal);
      setIsAuthenticated(true);
      triggerToast('Authenticated successfully!');
    } else {
      triggerToast('Invalid admin key/password', 'error');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setApiKey('');
    sessionStorage.removeItem('cdn_api_key');
    setIsAuthenticated(false);
    setPassword('');
    setImages([]);
    triggerToast('Logged out');
  };

  // File drag & drop selection
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('Only image files are allowed', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast('File is too large. Max limit is 10MB', 'error');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePreview = (e) => {
    e.stopPropagation();
    setUploadFile(null);
    setUploadPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submission for CDN upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      triggerToast('Please select or drag an image', 'error');
      return;
    }
    if (!fromId.trim() || !toId.trim()) {
      triggerToast('Identifiers from/to are required', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      const owner = import.meta.env.VITE_GITHUB_OWNER;
      let repo = import.meta.env.VITE_GITHUB_REPO || 'cdn3';
      const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';
      const connStr = import.meta.env.VITE_NEONDB_CONNECTION_STRING;

      if (!token || token.includes('your_github_personal_access_token')) {
        throw new Error('GitHub configuration token is missing or not configured in .env');
      }
      if (!connStr || connStr.includes('postgresql://user:pass@host/db')) {
        throw new Error('NeonDB connection string is missing or not configured in .env');
      }

      // Determine active repo in rotating list cdn3 to cdn7
      const rotationRepos = ['cdn3', 'cdn4', 'cdn5', 'cdn6', 'cdn7'];
      if (rotationRepos.includes(repo)) {
        try {
          const sql = neon(connStr);
          const countsRes = await sql`
            SELECT 
              SUM(CASE WHEN cdn_url LIKE '%/cdn3@%' THEN 1 ELSE 0 END) as cdn3,
              SUM(CASE WHEN cdn_url LIKE '%/cdn4@%' THEN 1 ELSE 0 END) as cdn4,
              SUM(CASE WHEN cdn_url LIKE '%/cdn5@%' THEN 1 ELSE 0 END) as cdn5,
              SUM(CASE WHEN cdn_url LIKE '%/cdn6@%' THEN 1 ELSE 0 END) as cdn6,
              SUM(CASE WHEN cdn_url LIKE '%/cdn7@%' THEN 1 ELSE 0 END) as cdn7
            FROM images
          `;
          const counts = countsRes[0] || {};
          const repoCounts = {
            cdn3: parseInt(counts.cdn3 || 0),
            cdn4: parseInt(counts.cdn4 || 0),
            cdn5: parseInt(counts.cdn5 || 0),
            cdn6: parseInt(counts.cdn6 || 0),
            cdn7: parseInt(counts.cdn7 || 0)
          };

          const startIndex = rotationRepos.indexOf(repo);
          const activeRepos = rotationRepos.slice(startIndex);

          for (const r of activeRepos) {
            if (repoCounts[r] < 1000) {
              repo = r;
              break;
            }
            repo = r; // default to the last one if all are full
          }
          console.log(`Rotating repo selection resolved to: ${repo}`);
        } catch (dbErr) {
          console.warn("Could not query repo counts, using default repo:", dbErr);
        }
      }

      // Convert file to Base64
      const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });

      // Sanitization helper
      const sanitizeFilename = (originalName) => {
        const ext = originalName.split('.').pop() || '';
        const base = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const cleanBase = base.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
        return `${cleanBase}.${ext}`;
      };

      const cleanName = sanitizeFilename(uploadFile.name);
      const filename = `${Date.now()}-${cleanName}`;
      const base64Content = await fileToBase64(uploadFile);

      // GitHub Upload
      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
      const ghRes = await fetch(ghUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload image: ${filename} (from: ${fromId}, to: ${toId})`,
          content: base64Content,
          branch: branch,
        }),
      });

      if (!ghRes.ok) {
        const errorData = await ghRes.json().catch(() => ({}));
        throw new Error(`GitHub Upload Failed: ${errorData.message || ghRes.statusText}`);
      }

      // Generate CDN URL
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filename}`;

      // Insert record to database
      const sql = neon(connStr);
      const dbResult = await sql`
        INSERT INTO images (from_id, to_id, file_path, cdn_url)
        VALUES (${fromId.trim()}, ${toId.trim()}, ${filename}, ${cdnUrl})
        RETURNING id, from_id as "from", to_id as "to", file_path, cdn_url, created_at
      `;

      if (!dbResult || dbResult.length === 0) {
        throw new Error('Database insertion failed');
      }

      const newRecord = dbResult[0];

      triggerToast('Image uploaded successfully!');

      // Reset states
      setUploadFile(null);
      setUploadPreview('');
      setFromId('');
      setToId('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Update local state list
      setImages(prev => [newRecord, ...prev]);

    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Copy URL Clipboard helper
  const copyToClipboard = (url, index) => {
    navigator.clipboard.writeText(url).then(() => {
      triggerToast('CDN Link copied to clipboard!');
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    });
  };

  // Delete image database record and repository asset
  const handleDeleteImage = async (img) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this asset?\n\nFrom ID: ${img.from}\nTo ID: ${img.to}\nFile: ${img.file_path}`);
    if (!confirmDelete) return;

    setDeletingId(img.id);
    try {
      const connStr = import.meta.env.VITE_NEONDB_CONNECTION_STRING;
      if (!connStr || connStr.includes('postgresql://user:pass@host/db')) {
        throw new Error('NeonDB connection string is not configured.');
      }

      const sql = neon(connStr);

      // 1. Delete from database
      await sql`DELETE FROM images WHERE id = ${img.id}`;

      // 2. Attempt to delete from GitHub (optional/graceful fallback)
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      const owner = import.meta.env.VITE_GITHUB_OWNER;
      let repo = import.meta.env.VITE_GITHUB_REPO;
      if (img.cdn_url) {
        // Extract repo name dynamically from the cdn_url (handles rotating repos)
        const match = img.cdn_url.match(/\/gh\/[^/]+\/([^@/]+)/);
        if (match && match[1]) {
          repo = match[1];
        }
      }
      const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';

      if (token && owner && repo && !token.includes('your_github_personal_access_token')) {
        try {
          const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${img.file_path}?ref=${branch}`;
          const getRes = await fetch(getUrl, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github+json',
            }
          });
          if (getRes.ok) {
            const fileData = await getRes.json();
            const sha = fileData.sha;
            // Delete from GitHub
            await fetch(getUrl, {
              method: 'DELETE',
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Delete image: ${img.file_path}`,
                sha: sha,
                branch: branch
              })
            });
          }
        } catch (ghErr) {
          console.warn("Could not delete file from GitHub repository:", ghErr);
        }
      }

      // 3. Update local state
      setImages(prev => prev.filter(item => item.id !== img.id));
      triggerToast('Asset deleted successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Delete failed: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter local images array
  const filteredImages = images.filter(img => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    // Check range if search query is a number
    if (/^\d+$/.test(q)) {
      try {
        const queryNum = BigInt(q);
        const fromNum = BigInt(img.from);
        const toNum = BigInt(img.to);
        if (queryNum >= fromNum && queryNum <= toNum) {
          return true;
        }
      } catch (e) {
        // Fallback to text matching if BigInt conversion fails
      }
    }

    return (img.from && img.from.toLowerCase().includes(q)) ||
      (img.to && img.to.toLowerCase().includes(q)) ||
      (img.file_path && img.file_path.toLowerCase().includes(q));
  });

  return (
    <div className="app-container">
      {/* Background decorations */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Floating Toast Notification */}
      <div className={`toast ${toast.visible ? '' : 'hidden'} ${toast.type}`}>
        <span className="toast-icon">
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        </span>
        <span className="toast-message">{toast.message}</span>
      </div>

      {/* LOGIN CARD */}
      {!isAuthenticated ? (
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <div className="logo-icon">
                <HardDriveUpload />
              </div>
              <h2>Shree Rudra Divine</h2>
              <p>CDN Admin Control Center</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="admin-password">Admin Password / API Key</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="admin-password"
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '16px' }}>
                <span>Authenticate Portal</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="auth-footer">
              <p>Shree Rudra Divine Secure Content Delivery Network</p>
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN DASHBOARD CONTAINER */
        <div className="dashboard-wrapper">
          <header className="dashboard-header">
            <div className="brand">
              <div className="logo-icon">
                <HardDriveUpload />
              </div>
              <div>
                <h1>Shree Rudra Divine</h1>
                <span className="badge">Image CDN Panel</span>
              </div>
            </div>

            <div className="header-actions">
              <span className="server-status">
                <span className={`status-dot ${serverOnline ? 'green' : 'red'}`}></span>
                {serverOnline ? 'Server Online' : 'Database Connection Issue'}
              </span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </header>

          <main className="dashboard-content">
            {/* Control Panel: Stats & Upload Form */}
            <section className="control-panel">

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total Assets Stored</span>
                    <span className="stat-value">{images.length}</span>
                  </div>
                  <div className="stat-icon cyan">
                    <ImageIcon size={22} />
                  </div>
                </div>
              </div>

              {/* Upload Card */}
              <div className="card">
                <div className="card-header">
                  <CloudUpload className="icon-accent" />
                  <h3>Upload CDN Image</h3>
                </div>

                <form onSubmit={handleUploadSubmit} className="upload-form">
                  {/* File Dropzone */}
                  <div
                    className="dropzone"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('dragover');
                      if (e.dataTransfer.files.length) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files.length) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />

                    {!uploadPreview ? (
                      <div className="dropzone-prompt">
                        <ImagePlus className="upload-icon" />
                        <p className="primary-text">Drag & drop your image or <span>browse</span></p>
                        <p className="secondary-text">PNG, JPG, JPEG, WEBP (Max 10MB)</p>
                      </div>
                    ) : (
                      <div className="dropzone-preview">
                        <img src={uploadPreview} alt="Preview" />
                        <button type="button" className="btn-remove" onClick={handleRemovePreview}>
                          <X size={14} />
                        </button>
                        <div className="file-details">
                          <span className="preview-filename">{uploadFile?.name}</span>
                          <span className="preview-filesize">{(uploadFile ? uploadFile.size / 1024 : 0).toFixed(1)} KB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ID Input Form Rows */}
                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="upload-from">From Identifier (SKU/ID)</label>
                      <input
                        type="text"
                        id="upload-from"
                        placeholder="e.g. 10112250000"
                        value={fromId}
                        onChange={(e) => setFromId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="upload-to">To Identifier (SKU/ID)</label>
                      <input
                        type="text"
                        id="upload-to"
                        placeholder="e.g. 10112251001"
                        value={toId}
                        onChange={(e) => setToId(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={isUploading}
                  >
                    <CloudUpload size={18} />
                    <span>{isUploading ? 'Uploading to GitHub...' : 'Upload to CDN'}</span>
                  </button>
                </form>
              </div>
            </section>

            {/* Asset Listing / Grid Section */}
            <section className="feed-panel">
              <div className="feed-header">
                <div className="feed-title">
                  <h2>CDN Asset Manager</h2>
                  <p>Filter and manage images pushed to repository.</p>
                </div>

                <div className="filter-controls">
                  <div className="search-box">
                    <Search />
                    <input
                      type="text"
                      placeholder="Search by From/To ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-secondary btn-icon-only"
                    onClick={() => { triggerToast('Refreshing assets...'); fetchImages(); checkServerHealth(); }}
                    title="Refresh CDN List"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Loader */}
              {loadingImages ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading CDN assets...</p>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FolderOpen />
                  </div>
                  <h3>No assets found</h3>
                  <p>Upload your first image or clear your search query filter.</p>
                </div>
              ) : (
                /* Grid view of items */
                <>
                  <div className="image-grid">
                    {(showAll ? filteredImages : filteredImages.slice(0, 30)).map((img, index) => {
                      const formattedDate = new Date(img.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={img.id || index} className="asset-card">
                          <div className="asset-preview">
                            <img
                              src={img.cdn_url}
                              alt={img.file_path}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='10'>Broken URL</text></svg>";
                              }}
                            />
                            <div className="asset-overlay">
                              <a
                                href={img.cdn_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-icon-only"
                                title="Open CDN Image"
                              >
                                <ExternalLink />
                              </a>
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDeleteImage(img)}
                                disabled={deletingId === img.id}
                                title="Delete Asset"
                              >
                                {deletingId === img.id ? (
                                  <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'var(--accent-error)' }}></span>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="asset-body">
                            <div className="asset-tags">
                              <span className="tag tag-from">
                                <ArrowUpRight />
                                From: {img.from}
                              </span>
                              <span className="tag tag-to">
                                <ArrowDownLeft />
                                To: {img.to}
                              </span>
                            </div>

                            <div className="asset-meta">
                              <span className="asset-filename" title={img.file_path}>{img.file_path}</span>
                              <span className="asset-date">{formattedDate}</span>
                            </div>

                            <div className="asset-url-box">
                              <span className="asset-url-text">{img.cdn_url}</span>
                              <button
                                type="button"
                                className="btn-copy-url"
                                onClick={() => copyToClipboard(img.cdn_url, index)}
                                title="Copy Link"
                              >
                                {copiedIndex === index ? <Check style={{ color: '#16a34a' }} /> : <Copy />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {filteredImages.length > 30 && (
                    <div className="view-all-container">
                      <button
                        type="button"
                        className="btn-view-all"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : `View All (${filteredImages.length} items)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
