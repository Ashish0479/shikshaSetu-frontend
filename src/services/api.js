import axios from 'axios';

// Base API configuration
// Uses VITE_API_BASE_URL if specified in .env, otherwise defaults to relative '/api' proxied by Vite
const rawBase = import.meta.env.VITE_API_BASE_URL || '';
let resolvedBaseUrl = '/api';

if (rawBase) {
  const trimmed = rawBase.replace(/\/$/, '');
  resolvedBaseUrl = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = resolvedBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

/**
 * Format user-friendly error messages, preventing exposure of technical stack traces.
 */
export const formatErrorMessage = (err) => {
  if (!err) return 'An unexpected error occurred.';

  // Network error or backend offline
  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }
    return 'Backend server is unavailable.';
  }

  const { status, data } = err.response;

  if (status === 400) {
    const detail = data?.detail;
    return typeof detail === 'string' ? detail : 'Invalid dataset format or content.';
  }

  if (status === 413) {
    return 'File size exceeds server threshold (15 MB maximum).';
  }

  if (status === 404) {
    return 'Requested dataset or endpoint was not found.';
  }

  if (status >= 500) {
    return 'File processing failed. Please try again.';
  }

  return data?.detail || 'An error occurred while processing the request.';
};

export const api = {
  /**
   * Upload and process dataset
   * Uses existing backend endpoint: POST /api/upload
   * Field name: 'file' (multipart/form-data)
   */
  uploadFile: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Fetch dataset metadata
   * Uses existing backend endpoint: GET /api/datasets/{dataset_id}
   */
  getDatasetMetadata: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}`);
    return response.data;
  },

  /**
   * Fetch dataset quality analysis report
   * Uses existing backend endpoint: GET /api/quality/{dataset_id}
   */
  getQualityReport: async (datasetId) => {
    const response = await apiClient.get(`/quality/${datasetId}`);
    return response.data;
  },

  /**
   * Get direct URL for clean dataset download
   * Uses existing backend endpoint: GET /api/datasets/{dataset_id}/download
   */
  getCleanDownloadUrl: (datasetId) => {
    return `${API_BASE_URL}/datasets/${datasetId}/download`;
  },

  /**
   * Download clean CSV dataset as a file download in browser
   * Uses existing backend endpoint: GET /api/datasets/{dataset_id}/download
   */
  downloadCleanDataset: async (datasetId, filename = 'cleaned_teachers_dataset.csv') => {
    try {
      const response = await apiClient.get(`/datasets/${datasetId}/download`, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if available
      let downloadFilename = filename;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          downloadFilename = matches[1].replace(/['"]/g, '');
        }
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', downloadFilename);
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  /**
   * Complete high-level workflow:
   * 1. Upload & trigger processing pipeline
   * 2. Retrieve metadata & quality score
   * 3. Return consolidated result metrics
   */
  processDatasetWorkflow: async (file, onProgress) => {
    // 1. Upload file
    const uploadRes = await api.uploadFile(file, onProgress);
    const datasetId = uploadRes.dataset_id;

    // 2. Fetch dataset metadata and quality report in parallel
    let totalRowsClean = uploadRes.total_rows;
    let duplicatesRemoved = 0;
    let qualityScore = uploadRes.overall_quality_score;

    try {
      const [metadataRes, qualityRes] = await Promise.allSettled([
        api.getDatasetMetadata(datasetId),
        api.getQualityReport(datasetId),
      ]);

      if (metadataRes.status === 'fulfilled' && metadataRes.value) {
        totalRowsClean = metadataRes.value.total_rows_clean ?? totalRowsClean;
        if (metadataRes.value.overall_quality_score !== undefined) {
          qualityScore = metadataRes.value.overall_quality_score;
        }
      }

      if (qualityRes.status === 'fulfilled' && qualityRes.value) {
        duplicatesRemoved = qualityRes.value.duplicate_rows_count ?? 0;
      } else if (metadataRes.status === 'fulfilled' && metadataRes.value) {
        duplicatesRemoved = Math.max(0, (metadataRes.value.total_rows_raw || 0) - (metadataRes.value.total_rows_clean || 0));
      }
    } catch (e) {
      // Fallback to upload response data
    }

    return {
      datasetId: uploadRes.dataset_id,
      filename: uploadRes.filename,
      originalRecords: uploadRes.total_rows,
      cleanRecords: totalRowsClean,
      duplicatesRemoved,
      qualityScore,
      createdAt: uploadRes.created_at,
    };
  },
};

export default api;
