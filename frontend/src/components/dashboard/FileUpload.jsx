import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        const validFiles = files.filter(file =>
            file.type === 'text/plain' || file.type === 'application/pdf'
        );

        if (validFiles.length === 0) {
            setUploadStatus({ type: 'error', message: 'Only .txt and .pdf files are supported' });
            setTimeout(() => setUploadStatus(null), 3000);
            return;
        }

        for (const file of validFiles) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file) => {
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (!data.error) {
                setUploadProgress(100);
                setUploadStatus({
                    type: 'success',
                    message: `${file.name} uploaded successfully!`,
                    fileName: file.name,
                    fileSize: formatFileSize(file.size)
                });

                // Trigger refresh in parent component
                if (onUploadSuccess) {
                    onUploadSuccess();
                }

                setTimeout(() => {
                    setUploadStatus(null);
                    setUploadProgress(0);
                }, 3000);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            setUploadStatus({
                type: 'error',
                message: `Failed to upload ${file.name}`
            });
            setTimeout(() => setUploadStatus(null), 3000);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="file-upload-container">
            <div
                className={`upload-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {!uploading && !uploadStatus && (
                    <>
                        <div className="upload-icon-wrapper">
                            <Upload size={24} />
                        </div>
                        <h3 className="upload-title">Drop files here or click to upload</h3>
                        <p className="upload-subtitle">
                            Supports
                            <span className="file-type-badge">.txt</span>
                            <span className="file-type-badge">.pdf</span>
                            files
                        </p>
                    </>
                )}

                {uploading && (
                    <div className="upload-progress">
                        <div className="spinner" />
                        <p>Processing...</p>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {uploadStatus && (
                    <div className={`upload-status ${uploadStatus.type}`}>
                        <div className="status-icon-circle">
                            {uploadStatus.type === 'success' ? (
                                <CheckCircle size={28} />
                            ) : (
                                <XCircle size={28} />
                            )}
                        </div>
                        <p className="status-message">{uploadStatus.message}</p>
                        {uploadStatus.fileName && (
                            <div className="file-details">
                                <span className="file-name">{uploadStatus.fileName}</span>
                                <span className="file-size">{uploadStatus.fileSize}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
