import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import api, { formatErrorMessage } from "./services/api";

const names = {
  teachers: "Teachers",
  schools: "Schools",
  enrollment: "Enrollment",
  locations: "Locations",
};
const label = (entity) => names[entity] || entity;

export default function App() {
  const [files, setFiles] = useState([]),
    [inspection, setInspection] = useState(null),
    [overrides, setOverrides] = useState({});
  const [result, setResult] = useState(null),
    [quality, setQuality] = useState(null),
    [issues, setIssues] = useState([]),
    [audit, setAudit] = useState([]),
    [l3, setL3] = useState(null),
    [l4, setL4] = useState(null),
    [l5, setL5] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("ALL");
  const inspect = async (chosen) => {
    setBusy(true);
    setError("");
    try {
      setInspection(await api.inspectFiles(chosen));
      setFiles(chosen);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const process = async () => {
    setBusy(true);
    setError("");
    try {
      const upload = await api.processMultiFiles(files, overrides);
      const [report, validation, transformations] = await Promise.all([
        api.getQualityReport(upload.dataset_id),
        api.getValidationIssues(upload.dataset_id),
        api.getStandardizationChanges(upload.dataset_id),
      ]);
      setResult(upload);
      setQuality(report);
      setIssues(validation);
      setAudit(transformations.logs || []);
      setL3(null);
      setL4(null);
      setL5(null);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const runL3Analysis = async () => {
    if (!result?.dataset_id) return;
    setBusy(true);
    setError("");
    try {
      const analysis = await api.getL3Analysis(result.dataset_id);
      setL3(analysis);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const runL4Analysis = async () => {
    if (!result?.dataset_id) return;
    setBusy(true);
    setError("");
    try {
      const analysis = await api.getL4Analysis(result.dataset_id);
      setL4(analysis);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const runL5Scenarios = async () => {
    if (!result?.dataset_id) return;
    setBusy(true);
    setError("");
    try {
      setL5(await api.generateL5Scenarios(result.dataset_id));
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setInspection(null);
    setResult(null);
    setQuality(null);
    setIssues([]);
    setAudit([]);
    setL3(null);
    setL4(null);
    setL5(null);
    setError("");
  };
  const visibleIssues = issues.filter(
    (issue) => filter === "ALL" || issue.severity === filter,
  );
  return (
    <div className="page-wrapper">
      <main className="container">
        <div className="card">
          <header className="card-header">
            <span className="system-badge">ShikshaSetu · L1–L2</span>
            <h1 className="page-title">Education data cleaning</h1>
            <p className="page-description">
              Upload → inspect → clean → review → download. Source columns are
              preserved.
            </p>
          </header>
          <div className="card-body">
            {!inspection && (
              <FileUpload
                onInspect={inspect}
                isProcessing={busy}
                errorMessage={error}
                onClearError={() => setError("")}
              />
            )}
            {inspection && !result && (
              <>
                <div className="steps-nav">
                  <span className="step-item completed">1 Upload</span>
                  <span className="step-item active">2 Detect & map</span>
                  <span className="step-item">3 Clean & review</span>
                </div>
                <h2 className="page-title">
                  Entity detection and schema mapping
                </h2>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>File / sheet</th>
                        <th>Entity</th>
                        <th>Confidence</th>
                        <th>Mappings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspection.sources.map((source) => (
                        <tr key={source.source_key}>
                          <td>{source.source_key}</td>
                          <td>
                            {source.detected_entity === "unknown" ? (
                              <select
                                value={overrides[source.source_key] || ""}
                                onChange={(event) =>
                                  setOverrides({
                                    ...overrides,
                                    [source.source_key]: event.target.value,
                                  })
                                }
                              >
                                <option value="">Choose entity</option>
                                {Object.keys(names).map((entity) => (
                                  <option key={entity} value={entity}>
                                    {label(entity)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="badge badge-entity">
                                {label(source.detected_entity)}
                              </span>
                            )}
                          </td>
                          <td>{Math.round(source.confidence * 100)}%</td>
                          <td>
                            <small>
                              {source.mappings
                                .filter((item) => item.is_mapped)
                                .map(
                                  (item) =>
                                    `${item.raw_column} → ${item.canonical_column}`,
                                )
                                .join(", ")}
                              {source.unmapped_columns.length
                                ? ` · Unmapped (preserved): ${source.unmapped_columns.join(", ")}`
                                : ""}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {error && <div className="error-banner">{error}</div>}
                <div className="form-action">
                  <button
                    className="btn-primary"
                    disabled={
                      busy ||
                      inspection.sources.some(
                        (source) =>
                          source.detected_entity === "unknown" &&
                          !overrides[source.source_key],
                      )
                    }
                    onClick={process}
                  >
                    {busy
                      ? "Cleaning & standardizing…"
                      : "Clean & standardize data"}
                  </button>
                  <button className="btn-secondary" onClick={reset}>
                    Start over
                  </button>
                </div>
              </>
            )}
            {result && quality && (
              <>
                <div className="success-banner">Data cleaned successfully.</div>
                <h2 className="page-title">Quality summary</h2>
                <div className="metrics-grid">
                  <Metric label="Records processed" value={result.total_rows} />
                  <Metric
                    label="Valid records"
                    value={quality.valid_rows_count}
                  />
                  <Metric
                    label="Warnings"
                    value={quality.issue_counts_by_severity.WARNING || 0}
                  />
                  <Metric
                    label="Errors"
                    value={quality.issue_counts_by_severity.ERROR || 0}
                  />
                  <Metric
                    label="Duplicates"
                    value={quality.duplicate_rows_count}
                  />
                  <Metric
                    label="Quality score"
                    value={`${quality.scores.overall_score} / 100`}
                  />
                </div>
                <div className="clean-datasets-box">
                  <div className="clean-datasets-header">
                    <strong>Cleaned data</strong>
                    <button
                      className="btn-success btn-sm"
                      onClick={() =>
                        api.downloadCompleteExcel(result.dataset_id)
                      }
                    >
                      Download complete Excel
                    </button>
                  </div>
                  {result.available_entities.map((entity) => (
                    <div className="clean-entity-row" key={entity}>
                      <span>
                        <strong>{label(entity)}</strong> ·{" "}
                        {result.entity_counts?.[entity]?.clean || 0} clean
                        records ·{" "}
                        {quality.entity_scores?.[entity]?.overall_score ?? "—"}{" "}
                        score
                      </span>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() =>
                          api.downloadEntityDataset(result.dataset_id, entity)
                        }
                      >
                        Download CSV
                      </button>
                    </div>
                  ))}
                </div>
                <section className="l3-action-box">
                  <div>
                    <strong>Layer 3 deterministic analysis</strong>
                    <p className="page-description">
                      Analyze the cleaned teachers, schools, and enrollment
                      data.
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    disabled={busy || !result.dataset_id}
                    onClick={runL3Analysis}
                  >
                    {busy ? "Running L3 analysis..." : "Run L3 analysis"}
                  </button>
                </section>
                <section className="l3-action-box">
                  <div>
                    <strong>Layer 4 predictive analysis</strong>
                    <p className="page-description">
                      Retirement outlook, staffing risk, and school clustering.
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    disabled={busy || !result.dataset_id}
                    onClick={runL4Analysis}
                  >
                    {busy ? "Running L4 analysis..." : "Run L4 analysis"}
                  </button>
                </section>
                <section className="l3-action-box">
                  <div>
                    <strong>Layer 5 advisory staffing scenarios</strong>
                    <p className="page-description">
                      Generate explainable CP-SAT scenarios for officer review.
                      No transfer or posting is executed.
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    disabled={busy || !result.dataset_id}
                    onClick={runL5Scenarios}
                  >
                    {busy ? "Generating scenarios..." : "Generate L5 scenarios"}
                  </button>
                </section>
                {l3 && <L3Results analysis={l3} />}
                {l4 && <L4Results analysis={l4} />}
                {l5 && <L5Results result={l5} />}
                <section className="accordion">
                  <div className="accordion-content">
                    <strong>Validation issues</strong>
                    <div className="filter-bar">
                      {["ALL", "ERROR", "WARNING"].map((value) => (
                        <button
                          key={value}
                          className={`filter-btn ${filter === value ? "active" : ""}`}
                          onClick={() => setFilter(value)}
                        >
                          {value === "ALL"
                            ? "All"
                            : `${value[0]}${value.slice(1).toLowerCase()}s`}
                        </button>
                      ))}
                    </div>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Entity</th>
                            <th>Row</th>
                            <th>Field</th>
                            <th>Issue</th>
                            <th>Severity</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleIssues.slice(0, 100).map((issue, index) => (
                            <tr key={index}>
                              <td>{label(issue.entity)}</td>
                              <td>{issue.row_number}</td>
                              <td>{issue.column}</td>
                              <td>{issue.message}</td>
                              <td>
                                <span
                                  className={`badge badge-${issue.severity.toLowerCase()}`}
                                >
                                  {issue.severity}
                                </span>
                              </td>
                              <td>{String(issue.original_value ?? "")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
                <details className="accordion">
                  <summary className="accordion-trigger">
                    View standardization changes ({audit.length})
                  </summary>
                  <div className="accordion-content">
                    {audit.slice(0, 100).map((entry, index) => (
                      <p key={index}>
                        {label(entry.entity)} · {entry.column}:{" "}
                        {entry.original_value} → {entry.standard_value} (
                        {entry.rule})
                      </p>
                    ))}
                  </div>
                </details>
                <button className="btn-secondary" onClick={reset}>
                  Process another dataset
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value">{value ?? "—"}</div>
    </div>
  );
}

function L5Results({ result }) {
  return (
    <section className="l3-results">
      <h2 className="page-title">L5 advisory scenarios</h2>
      <p className="page-description">
        Solver status: <strong>{result.status}</strong> · Registry:{" "}
        {result.constraint_registry_version}
      </p>
      {result.scenarios?.length ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Movements</th>
                <th>Remaining shortages</th>
                <th>New shortages</th>
                <th>Distance (km)</th>
                <th>Solver</th>
              </tr>
            </thead>
            <tbody>
              {result.scenarios.map((scenario) => (
                <tr key={scenario.scenario_id}>
                  <td>{scenario.scenario_id}</td>
                  <td>{scenario.metrics.movement_count}</td>
                  <td>
                    {Object.values(scenario.metrics.remaining_shortages).reduce(
                      (total, value) => total + value,
                      0,
                    )}
                  </td>
                  <td>{scenario.metrics.newly_created_shortages}</td>
                  <td>{scenario.metrics.total_distance_km}</td>
                  <td>{scenario.solver_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="page-description">
          No feasible advisory scenario was generated. Review the solver
          status, constraints, exclusions, and data limitations above.
        </p>
      )}
      {result.limitations?.length > 0 && (
        <div className="error-banner">
          {result.limitations.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      )}
    </section>
  );
}

function L3Results({ analysis }) {
  const summary = analysis.summary || {};
  const ptrRows = analysis.ptr_analysis?.schools || [];
  const qualificationRows = analysis.qualification_analysis?.records || [];
  const qualificationIssues = qualificationRows.filter(
    (row) => row.qualification_match !== "MATCH",
  );
  const qualificationMismatchCount = qualificationRows.filter(
    (row) => row.qualification_match === "MISMATCH",
  ).length;
  const qualificationPartialCount = qualificationRows.filter(
    (row) => row.qualification_match === "PARTIAL_MATCH",
  ).length;
  const qualificationUnknownCount = qualificationRows.filter(
    (row) => row.qualification_match === "UNKNOWN",
  ).length;
  const geographicRows = analysis.geographic_analysis?.flags || [];

  return (
    <section className="l3-results">
      <h2 className="page-title">L3 analysis results</h2>
      <div className="metrics-grid">
        <Metric label="Schools analyzed" value={summary.schools_analyzed} />
        <Metric
          label="Schools with shortage"
          value={summary.schools_with_shortage}
        />
        <Metric
          label="Schools with surplus"
          value={summary.schools_with_surplus}
        />
        <Metric
          label="Qualification mismatches"
          value={qualificationMismatchCount}
        />
        <Metric label="Partial matches" value={qualificationPartialCount} />
        <Metric
          label="Unknown qualifications"
          value={qualificationUnknownCount}
        />
        <Metric label="Geographic flags" value={summary.geographic_flags} />
      </div>

      <h3 className="section-title">School staffing / PTR</h3>
      <DataTable
        columns={[
          "School",
          "District",
          "Students",
          "Teachers",
          "PTR",
          "Expected",
          "Shortage",
          "Surplus",
          "Status",
        ]}
        rows={ptrRows.map((row) => [
          `${row.school_code} · ${row.school_name}`,
          row.district,
          row.total_students,
          row.total_teachers,
          row.ptr ?? "—",
          row.expected_teachers,
          row.shortage,
          row.surplus,
          row.status,
        ])}
      />

      <h3 className="section-title">Qualification issues</h3>
      <DataTable
        columns={[
          "Teacher",
          "School",
          "Subject",
          "Qualification",
          "Status",
          "Reason",
        ]}
        rows={qualificationIssues.map((row) => [
          `${row.Teacher_ID} · ${row.Teacher_Name}`,
          row.School_Code,
          row.Subject,
          row.Qualification,
          row.qualification_match,
          row.reason,
        ])}
      />

      <h3 className="section-title">Geographic imbalance</h3>
      <DataTable
        columns={[
          "Shortage school",
          "Surplus school",
          "Distance",
          "Signal",
          "Reason",
        ]}
        rows={geographicRows.map((row) => [
          row.shortage_school_code,
          row.surplus_school_code,
          row.distance_km == null
            ? "District-level only"
            : `${row.distance_km} km`,
          row.potential_issue,
          row.reason,
        ])}
      />
    </section>
  );
}

function L4Results({ analysis }) {
  const retirementRows = analysis.retirement_outlook?.yearly_counts || [];
  const riskRows = analysis.future_staffing_risk?.schools || [];
  const clusterRows = analysis.school_clusters?.clusters || [];
  const clusterSummary = analysis.school_clusters?.cluster_summary || [];
  const forecast = analysis.forecast || {};

  return (
    <section className="l3-results">
      <h2 className="page-title">L4 predictive analysis</h2>
      <div className="metrics-grid">
        <Metric label="Retirement age" value={`${analysis.metadata?.retirement_age ?? "—"} years`} />
        <Metric label="Target PTR" value={analysis.metadata?.target_ptr ?? "—"} />
        <Metric label="Risk schools" value={riskRows.length} />
        <Metric label="Clusters" value={clusterRows.length || "—"} />
      </div>

      <h3 className="section-title">Retirement outlook</h3>
      <DataTable
        columns={["Year", "Teachers reaching retirement age"]}
        rows={retirementRows.map((row) => [row.year, row.teachers_reaching_retirement_age])}
      />

      <h3 className="section-title">Future staffing risk</h3>
      <DataTable
        columns={["School", "District", "Shortage", "Retirements", "PTR", "Risk Score", "Risk Category"]}
        rows={riskRows.map((row) => [
          `${row.School_Code} · ${row.School_Name}`,
          row.District,
          row.Current_Shortage,
          row.Retiring_Within_5_Years,
          row.PTR,
          row.Risk_Score,
          row.Risk_Category,
        ])}
      />

      <h3 className="section-title">School clusters</h3>
      {analysis.school_clusters?.available ? (
        <>
          <DataTable
            columns={["Cluster", "Schools", "Average Students", "Average Teachers", "Average PTR", "Average Shortage", "Average Risk"]}
            rows={clusterSummary.map((row) => [
              row.Cluster_ID,
              row.Number_of_Schools,
              row.Average_Students,
              row.Average_Teachers,
              row.Average_PTR,
              row.Average_Shortage,
              row.Average_Risk_Score,
            ])}
          />
          <p className="page-description">
            {analysis.school_clusters?.cluster_explanations?.[0] || "Cluster profile summary available."}
          </p>
        </>
      ) : (
        <p className="page-description">{analysis.school_clusters?.message || "Insufficient school records for reliable clustering."}</p>
      )}

      <h3 className="section-title">Forecast validation</h3>
      {forecast.available ? (
        <DataTable
          columns={["Model", "Status", "MAPE"]}
          rows={forecast.models.map((model) => [model.model, model.status, model.mape ?? "Not yet evaluated"])}
        />
      ) : (
        <p className="page-description">{forecast.message || "Historical time-series data insufficient for Prophet/ARIMA backtesting."}</p>
      )}
    </section>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell ?? "—"}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>No records available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
