import React, { useState, useRef } from 'react';

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

export default function FileUpload({ onProcess, isProcessing, errorMessage, onClearError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    if (onClearError) onClearError();
    setValidationError('');

    if (!file) {
      setSelectedFile(null);
      return false;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError('Only CSV and Excel files are supported.');
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleChooseFileClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onClearError) onClearError();
    setValidationError('');

    if (!selectedFile) {
      setValidationError('No file selected.');
      return;
    }

    onProcess(selectedFile);
  };

  const activeError = validationError || errorMessage;

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      {/* Upload Drop Area */}
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleChooseFileClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChooseFileClick();
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        <div className="upload-icon-container">
          <svg
            className="upload-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="upload-prompt-title">Upload your CSV or Excel file</p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleChooseFileClick();
          }}
          disabled={isProcessing}
          className="btn-choose-file"
        >
          Choose File
        </button>

        <div className="format-info">
          <span>Supported formats:</span>
          <strong>CSV, XLSX</strong>
        </div>
      </div>

      {/* Selected File Section */}
      {selectedFile && (
        <div className="selected-file-info">
          <div className="selected-file-label">Selected file:</div>
          <div className="selected-file-name">
            <svg
              className="file-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>{selectedFile.name}</span>
            <span className="file-size">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {activeError && (
        <div className="error-banner" role="alert">
          <svg
            className="error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{activeError}</span>
        </div>
      )}

      {/* Process Button */}
      <div className="form-action">
        <button
          type="submit"
          className="btn-process"
          disabled={isProcessing || !selectedFile}
        >
          {isProcessing ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              <span>Processing...</span>
            </>
          ) : (
            'Process Dataset'
          )}
        </button>
      </div>
    </form>
  );
}
