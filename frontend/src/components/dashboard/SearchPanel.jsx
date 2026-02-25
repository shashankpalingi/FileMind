import React, { useState, useRef, useEffect } from 'react';
import { Search, AlertCircle, X } from 'lucide-react';
import api from '../../api';
import './SearchPanel.css';

const SearchPanel = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!query.trim()) return;

        setSearching(true);
        setError(null);

        try {
            const { data } = await api.post('/search', { query: query.trim() });
            setResults(data.results || []);
            setShowResults(true);
        } catch (err) {
            setError('Failed to search. Please try again.');
            setResults([]);
            setShowResults(true);
        } finally {
            setSearching(false);
        }
    };

    const getFileName = (filePath) => {
        if (!filePath) return 'Unknown file';
        return filePath.split('/').pop();
    };

    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        if (showResults) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showResults]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setShowResults(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div className="search-panel-container" ref={panelRef}>
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                    <Search size={15} className="search-icon-left" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search your knowledge base..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if (results.length > 0 || error) setShowResults(true); }}
                        disabled={searching}
                    />
                    <span className="search-shortcut">⌘K</span>
                    <button
                        type="submit"
                        className="search-btn"
                        disabled={searching || !query.trim()}
                    >
                        {searching ? (
                            <div className="search-spinner" />
                        ) : (
                            <Search size={14} />
                        )}
                        <span>Search</span>
                    </button>
                </div>
            </form>

            {/* Dropdown results */}
            {showResults && (
                <div className="search-dropdown">
                    <div className="search-dropdown-header">
                        <span className="results-count">{results.length} results found</span>
                        <button className="search-close-btn" onClick={() => { setShowResults(false); setQuery(''); setResults([]); }}>
                            <X size={16} />
                        </button>
                    </div>

                    {results.map((result, index) => (
                        <div key={index} className="result-card">
                            <div className="result-header">
                                <h3 className="result-file">{getFileName(result.file)}</h3>
                                <span className="similarity-score">
                                    {(result.similarity * 100).toFixed(1)}%
                                </span>
                            </div>

                            {result.snippet && (
                                <p className="result-snippet">{result.snippet}</p>
                            )}

                            <div className="result-footer">
                                <span className="result-path">{result.file}</span>
                            </div>
                        </div>
                    ))}

                    {!searching && results.length === 0 && query && !error && (
                        <div className="empty-results">
                            <Search size={24} className="empty-search-icon" />
                            <p>No results found</p>
                            <span className="empty-subtitle">Try a different search query</span>
                        </div>
                    )}

                    {error && (
                        <div className="search-error">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPanel;
