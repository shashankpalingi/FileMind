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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loading = dataLoading || uploadLoading || isTransitioning || !!systemStatus?.is_processing;

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
    } catch (error) {
      console.error('Failed to fetch status:', error);
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

  // Fast polling during processing to dismiss loader quickly
  useEffect(() => {
    if (isTransitioning || systemStatus?.is_processing) {
      const fastPoll = setInterval(() => {
        fetchStatus();
        fetchFiles(false);
      }, 2000);
      return () => clearInterval(fastPoll);
    }
  }, [isTransitioning, systemStatus?.is_processing, fetchStatus, fetchFiles]);


  const handleUploadStart = () => {
    setUploadLoading(true);
    setIsTransitioning(false);
  };

  const handleUploadEnd = () => {
    setUploadLoading(false);
    // Start transition period to wait for status poll to catch the 'is_processing' state
    setIsTransitioning(true);
  };

  // Clear transition once we actually see processing or after a safety timeout
  useEffect(() => {
    if (systemStatus?.is_processing) {
      setIsTransitioning(false);
    }
  }, [systemStatus?.is_processing]);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 3000); // 3s safety timeout
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };



  return (
    <div className="semantic-workspace">
      {loading && <Loader />}
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <div className="nav-brand">
              <div className="brand-icon">
                <FolderSearch size={22} />
              </div>
              <span className="brand-name">FileMind</span>
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
          <Sidebar files={files} status={systemStatus} onRefresh={handleUploadSuccess} />
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
