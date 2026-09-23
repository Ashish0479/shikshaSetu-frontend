import axios from 'axios';

// Base API configuration
const rawBase = import.meta.env.VITE_API_BASE_URL || '';
let resolvedBaseUrl = '/api';

if (rawBase) {
  const trimmed = rawBase.replace(/\/$/, '');
  resolvedBaseUrl = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = resolvedBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

/**
 * Format user-friendly error messages, preventing exposure of technical stack traces.
 */
export const formatErrorMessage = (err) => {
  if (!err) return 'An unexpected error occurred.';

  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }
    return 'Backend server is unavailable. Please verify that the backend is running.';
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
    return 'Dataset processing failed. Please verify file formatting and try again.';
  }

  return data?.detail || 'An error occurred while processing the request.';
};

export const api = {
  /**
   * Step 2 & 3: Inspect uploaded file(s) or sheets for entity detection and schema mapping.
   * Endpoint: POST /api/upload/inspect
   */
  inspectFiles: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post('/upload/inspect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Step 4: Process multiple files or multi-sheet Excel with optional entity overrides.
   * Endpoint: POST /api/upload/multi
   */
  processMultiFiles: async (files, entityOverrides = {}) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    if (entityOverrides && Object.keys(entityOverrides).length > 0) {
      formData.append('entity_overrides', JSON.stringify(entityOverrides));
    }

    const response = await apiClient.post('/upload/multi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload single file (backward compatible).
   * Endpoint: POST /api/upload
   */
  uploadFile: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Load demo dataset.
   * Endpoint: POST /api/upload/demo
   */
  loadDemoDataset: async () => {
    const response = await apiClient.post('/upload/demo');
    return response.data;
  },

  /**
   * Fetch dataset metadata.
   * Endpoint: GET /api/datasets/{dataset_id}
   */
  getDatasetMetadata: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}`);
    return response.data;
  },

  /**
   * Fetch dataset quality analysis report.
   * Endpoint: GET /api/quality/{dataset_id}
   */
  getQualityReport: async (datasetId) => {
    const response = await apiClient.get(`/quality/${datasetId}`);
    return response.data;
  },

  /**
   * Fetch validation issues with filters.
   * Endpoint: GET /api/quality/{dataset_id}/issues
   */
  getValidationIssues: async (datasetId, { entity, severity, column } = {}) => {
    const params = {};
    if (entity) params.entity = entity;
    if (severity && severity !== 'ALL') params.severity = severity;
    if (column) params.column = column;

    const response = await apiClient.get(`/quality/${datasetId}/issues`, { params });
    return response.data;
  },

  /**
   * Fetch standardization changes / audit log.
   * Endpoint: GET /api/quality/{dataset_id}/standardization
   */
  getStandardizationChanges: async (datasetId, entity = null) => {
    const params = entity ? { entity } : {};
    const response = await apiClient.get(`/quality/${datasetId}/standardization`, { params });
    return response.data;
  },

  /**
   * Download clean entity CSV.
   * Endpoint: GET /api/datasets/{dataset_id}/download?entity={entity}
   */
  downloadEntityDataset: async (datasetId, entity, filename) => {
    try {
      const response = await apiClient.get(`/datasets/${datasetId}/download`, {
        params: { entity },
        responseType: 'blob',
      });
      const downloadFilename = filename || `cleaned_${entity}.csv`;
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
   * Download complete multi-sheet Excel workbook.
   * Endpoint: GET /api/datasets/{dataset_id}/download-excel
   */
  downloadCompleteExcel: async (datasetId, filename = 'cleaned_dataset.xlsx') => {
    try {
      const response = await apiClient.get(`/datasets/${datasetId}/download-excel`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', filename);
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  /**
   * Backward-compatible high level workflow helper for single file.
   */
  processDatasetWorkflow: async (file) => {
    const uploadRes = await api.uploadFile(file);
    const datasetId = uploadRes.dataset_id;

    let qualityReport = null;
    try {
      qualityReport = await api.getQualityReport(datasetId);
    } catch (e) {
      // ignore
    }

    return {
      datasetId,
      filename: uploadRes.filename,
      originalRecords: uploadRes.total_rows,
      cleanRecords: qualityReport?.total_clean_rows ?? uploadRes.total_rows,
      duplicatesRemoved: qualityReport?.duplicate_rows_count ?? 0,
      qualityScore: uploadRes.overall_quality_score,
      createdAt: uploadRes.created_at,
      availableEntities: uploadRes.available_entities || ['teachers'],
    };
  },
};

export default api;
