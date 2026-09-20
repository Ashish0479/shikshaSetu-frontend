import React, { useState } from 'react';
import api from '../services/api';

export default function ProcessingResult({ result, onReset }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const {
    datasetId,
    filename,
    originalRecords,
    cleanRecords,
    duplicatesRemoved,
    qualityScore,
  } = result;

  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    setDownloadError('');
    try {
      const baseName = filename ? filename.replace(/\.[^/.]+$/, '') : 'dataset';
      const cleanFileName = `cleaned_${baseName}.csv`;
      await api.downloadCleanDataset(datasetId, cleanFileName);
    } catch (err) {
      setDownloadError(err.message || 'Failed to download clean dataset.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="result-container">
      {/* Success Banner */}
      <div className="success-banner" role="status">
        <svg
          className="success-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="success-text">File processed successfully</span>
      </div>

      {/* Basic Metrics Returned by Backend */}
      <div className="metrics-box">
        <div className="metric-row">
          <span className="metric-label">Original records:</span>
          <span className="metric-value">{originalRecords ?? '—'}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Clean records:</span>
          <span className="metric-value text-clean">{cleanRecords ?? '—'}</span>
        </div>
        {duplicatesRemoved !== undefined && duplicatesRemoved !== null && (
          <div className="metric-row">
            <span className="metric-label">Duplicates removed:</span>
            <span className="metric-value">{duplicatesRemoved}</span>
          </div>
        )}
        {qualityScore !== undefined && qualityScore !== null && (
          <div className="metric-row">
            <span className="metric-label">Quality score:</span>
            <span className="metric-value text-score">{qualityScore} / 100</span>
          </div>
        )}
      </div>

      {/* Download Error Banner if any */}
      {downloadError && (
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
          <span>{downloadError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="download-actions">
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={isDownloading}
          className="btn-download-csv"
        >
          <svg
            className="download-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{isDownloading ? 'Preparing CSV...' : 'Download Clean CSV'}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="btn-reset"
        >
          Process Another Dataset
        </button>
      </div>
    </div>
  );
}
