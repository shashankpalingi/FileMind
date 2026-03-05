import React, { useMemo, useCallback, useState } from 'react';
import { Zap, Layers, FileText, FolderTree } from 'lucide-react';
import { FilesystemItem } from '../ui/filesystem-item';
import api from '../../api';
import './Sidebar.css';

const Sidebar = ({ files, status, onRefresh, onDeleteStart }) => {
    const isOnline = status?.status === 'running' || status?.status === 'online';



    const handleDelete = useCallback(async (fileName) => {
        if (onDeleteStart) onDeleteStart();
        try {
            const { data } = await api.delete(`/files/${encodeURIComponent(fileName)}`);
            if (data.error) {
                console.error('Delete failed:', data.error);
                return;
            }
            console.log('Deleted:', fileName);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Delete error:', error);
        }
    }, [onRefresh, onDeleteStart]);

    const handleUpdate = useCallback(async (fileName, newFile) => {
        try {
            const formData = new FormData();
            formData.append('file', newFile);

            const { data } = await api.put(`/files/${encodeURIComponent(fileName)}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (data.error) {
                console.error('Update failed:', data.error);
                return;
            }
            console.log('Updated:', fileName);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Update error:', error);
        }
    }, [onRefresh]);

    // Build tree from files grouped by cluster_label
    const treeNodes = useMemo(() => {
        if (!files || files.length === 0) return [];

        const clusters = {};
        files.forEach((file) => {
            const label = file.cluster_label || `Cluster ${file.cluster_id}`;
            if (!clusters[label]) {
                clusters[label] = [];
            }
            const fileName = file.file ? file.file.split('/').pop() : 'Unknown';
            clusters[label].push({ name: fileName });
        });

        // Create root node
        const rootNodes = Object.entries(clusters).map(([label, children]) => ({
            name: label,
            nodes: children,
        }));

        return [
            {
                name: 'Knowledge Base',
                nodes: rootNodes,
            },
        ];
    }, [files]);

    return (
        <div className="sidebar">
            {/* Mini Status Bar */}
            <div className="sidebar-status">
                <div className="status-mini-item">
                    <Zap size={14} className={isOnline ? 'icon-online' : 'icon-offline'} />
                    <span className={isOnline ? 'online' : 'offline'}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
                <div className="status-mini-divider" />
                <div className="status-mini-item">
                    <Layers size={14} />
                    <span>{status?.clusters ?? '—'}</span>
                </div>
                <div className="status-mini-divider" />
                <div className="status-mini-item">
                    <FileText size={14} />
                    <span>{status?.files ?? '—'}</span>
                </div>
            </div>

            {/* File Tree Section */}
            <div className="sidebar-section">
                <div className="section-header">
                    <FolderTree size={14} />
                    <span>File Explorer</span>
                    <span className="file-count-badge">{files?.length || 0}</span>
                </div>

                <div className="file-tree-container">
                    {treeNodes.length > 0 ? (
                        <ul className="file-tree-root">
                            {treeNodes.map((node) => (
                                <FilesystemItem
                                    node={node}
                                    key={node.name}
                                    animated
                                    onDelete={handleDelete}
                                    onUpdate={handleUpdate}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="tree-empty">
                            <FolderTree size={24} className="tree-empty-icon" />
                            <p>No files indexed</p>
                            <span>Upload files to see them here</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(Sidebar);
