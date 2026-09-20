# Teacher Data Cleaning & Standardization (Demonstration Frontend 2)

A lightweight, standalone demonstration interface designed for the **Teacher Data Quality & Standardization System**.

## Purpose

Provides a clean, administrative utility workflow:
```
Upload CSV/Excel ───▶ Process & Clean ───▶ Download Clean CSV
```

This frontend is completely isolated from the primary dashboard and is dedicated to single-step demonstration runs.

---

## Existing Backend Endpoints Used

`frontend2` connects directly to the existing FastAPI backend without duplicating any server-side logic:

1. **Dataset Upload & Processing:**
   - **Method / Path:** `POST /api/upload`
   - **Payload:** `multipart/form-data` with field `file` (`.csv`, `.xlsx`, or `.xls`)
   - **Backend Processing:** Ingestion, schema validation, 13-stage cleaning pipeline, and standardized record generation.

2. **Dataset Metadata & Quality Metrics:**
   - **Method / Path:** `GET /api/datasets/{dataset_id}` and `GET /api/quality/{dataset_id}`
   - **Returned Information:**
     - Original records (`total_rows_raw` / `total_rows`)
     - Clean records (`total_rows_clean`)
     - Duplicates removed (`duplicate_rows_count`)
     - Quality score (`overall_quality_score`)

3. **Clean Dataset Download:**
   - **Method / Path:** `GET /api/datasets/{dataset_id}/download`
   - **Format:** CSV download (`Content-Disposition: attachment; filename="cleaned_<name>.csv"`)

---

## Prerequisites

- Node.js (v18+)
- Running backend server (defaults to `http://127.0.0.1:8000`)

---

## Getting Started

1. Navigate to the `frontend2` directory:
   ```bash
   cd frontend2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment:
   Copy `.env.example` to `.env` if your backend is hosted on a custom address:
   ```bash
   cp .env.example .env
   ```
   *Note: In local development, the Vite dev server automatically proxies `/api` calls to `http://127.0.0.1:8000`.*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser at:
   ```
   http://localhost:5174
   ```
   *(Port 5174 is used so it does not collide with the main frontend on port 5173).*

---

## Workflow

1. **Select File:** Choose a CSV or Excel (`.xlsx`, `.xls`) dataset via file dialog or drag-and-drop.
2. **Process Dataset:** Click **Process Dataset** to stream the file to the backend cleaning pipeline.
3. **Review Results:** Review the backend-verified metrics:
   - Original records count
   - Clean records count
   - Duplicates removed
   - Overall data quality score
4. **Download Clean Dataset:** Click **Download Clean CSV** to download the deduplicated, standardized dataset.
