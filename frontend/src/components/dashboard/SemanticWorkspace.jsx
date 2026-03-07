import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FolderSearch, User, LogOut, ChevronDown } from 'lucide-react';
import FileUpload from './FileUpload';
import SearchPanel from './SearchPanel';
import ChatAssistant from './ChatAssistant';
import Sidebar from './Sidebar';
import DendrogramChart from '../ui/dendrogram';
import ThemeToggle from './ThemeToggle';
import Loader from '../ui/Loader';
import { useAuth } from '../../context/AuthContext';

import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './SemanticWorkspace.css';

const SemanticWorkspace = () => {
  const [files, setFiles] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Refs to compare before setting state (avoids unnecessary re-renders)
  const filesRef = useRef('[]');
  const statusRef = useRef('null');

  const [dataLoading, setDataLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loading = dataLoading || uploadLoading || deleteLoading;

  // Fetch files list — only update state if data changed
  const fetchFiles = useCallback(async (showLoader = false) => {
    if (showLoader) setDataLoading(true);
    try {
      const { data } = await api.get('/files');
      const json = JSON.stringify(data);
      if (json !== filesRef.current) {
        filesRef.current = json;
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      if (showLoader) setDataLoading(false);
    }
  }, []);

  // Fetch system status — only update state if data changed
  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/status');
      const json = JSON.stringify(data);
      if (json !== statusRef.current) {
        statusRef.current = json;
        setSystemStatus(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch status:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Show loader on initial load
    fetchFiles(true);
    fetchStatus();

    // Poll status + files every 5 seconds (no loader for background polling)
    const interval = setInterval(() => {
      fetchStatus();
      fetchFiles(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger, fetchFiles, fetchStatus]);

  // When uploadLoading is true, poll rapidly until backend says processing is done
  useEffect(() => {
    if (!uploadLoading) return;

    const poll = setInterval(async () => {
      const status = await fetchStatus();
      await fetchFiles(false);
      if (status && !status.is_processing) {
        setUploadLoading(false);
      }
    }, 1000);

    pollRef.current = poll;

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [uploadLoading, fetchStatus, fetchFiles]);

  const pollRef = useRef(null);
  const deletePollRef = useRef(null);

  // When deleteLoading is true, poll rapidly until backend says processing is done
  useEffect(() => {
    if (!deleteLoading) return;

    const poll = setInterval(async () => {
      const status = await fetchStatus();
      await fetchFiles(false);
      if (status && !status.is_processing) {
        setDeleteLoading(false);
      }
    }, 1000);

    deletePollRef.current = poll;

    return () => {
      if (deletePollRef.current) clearInterval(deletePollRef.current);
    };
  }, [deleteLoading, fetchStatus, fetchFiles]);

  const handleUploadStart = () => setUploadLoading(true);
  const handleUploadEnd = () => {
    // Keep uploadLoading = true — don't clear it here.
    // The rapid poll above will clear it once backend confirms processing is done.
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteStart = () => setDeleteLoading(true);




  return (
    <div className="semantic-workspace">
      {loading && <Loader />}
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <div className="nav-brand">
              <div className="brand-icon">
                <FolderSearch size={28} />
              </div>
              <span className="brand-name" style={{ fontFamily: "'Cedarville Cursive', cursive", fontSize: '1.4rem', fontWeight: 700, marginLeft: '0.125rem' }}>FileMind</span>
            </div>
          </div>

          <div className="nav-search">
            <SearchPanel />
          </div>

          <div className="nav-right">
            <ThemeToggle />
            <div className="user-dropdown-wrapper" ref={userMenuRef}>
              <button
                className="user-dropdown-trigger"
                onClick={() => setUserMenuOpen(prev => !prev)}
                aria-label="User menu"
              >
                <div className="nav-avatar">
                  <User size={16} />
                </div>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar"><User size={18} /></div>
                    <div className="dropdown-user-details">
                      <span className="dropdown-user-name">{user?.email?.split('@')[0] || 'User'}</span>
                      <span className="dropdown-user-email">{user?.email || ''}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-logout" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar - File Tree & Status */}
        <aside className="left-panel">
          <Sidebar files={files} status={systemStatus} onRefresh={handleUploadSuccess} onDeleteStart={handleDeleteStart} />
        </aside>

        {/* Center - Knowledge Workspace */}
        <main className="center-panel">
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
          />
          <DendrogramChart files={files} />
        </main>


        {/* Right Panel - AI Assistant */}
        <aside className="right-panel">
          <ChatAssistant />
        </aside>
      </div>
    </div>
  );
};

export default SemanticWorkspace;
