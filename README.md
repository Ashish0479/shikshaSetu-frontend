# ShikshaSetu L1–L2 demo UI

`frontend2` is the lightweight interface for deterministic education-data ingestion and cleaning. It supports teacher-only files, multiple entity files, and Excel workbooks with entity sheets.

## Workflow

1. Upload one or more CSV/XLS/XLSX files.
2. Review entity detection, schema mapping, and preserved unmapped columns.
3. Select an entity manually only when detection is ambiguous.
4. Clean and standardize the uploaded data.
5. Review quality, validation issues, and transformation audit entries.
6. Download per-entity CSVs or a combined Excel workbook.

The UI uses the backend's `/api/upload/inspect`, `/api/upload/multi`, `/api/quality`, and `/api/datasets` endpoints. It does not contain L3 planning or recommendation logic.

## Run

Start the FastAPI backend on port 8000, then run:

```bash
cd frontend2
npm install
npm run dev
```

Vite proxies `/api` to the local backend. Set `VITE_API_BASE_URL` when using a different backend host.
