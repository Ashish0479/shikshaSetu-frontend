import React, { useState } from "react";
import api, { formatErrorMessage } from "../services/api";

export default function Copilot({ datasetId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const submitQuestion = async (event) => {
    event.preventDefault();
    const value = question.trim();
    if (!value || loading) return;

    setMessages((current) => [...current, { role: "user", text: value }]);
    setQuestion("");
    setLoading(true);
    try {
      const response = await api.askCopilot(value, datasetId);
      setMessages((current) => [...current, { role: "assistant", response }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "error", text: formatErrorMessage(error) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="copilot-panel">
      <div className="copilot-heading">
        <div>
          <span className="system-badge">Layer 6</span>
          <h2 className="page-title">AI Copilot</h2>
          <p className="page-description">
            Ask evidence-grounded questions about staffing, risk, policy, and
            advisory scenarios.
          </p>
        </div>
        <span className="copilot-advisory">Advisory only · no HR action</span>
      </div>

      <div className="copilot-history" aria-live="polite">
        {!messages.length && (
          <div className="copilot-empty">
            <strong>Ask a question in English or Hindi</strong>
            <span>
              {datasetId
                ? "The selected dataset will be used for current evidence."
                : "Select or process a dataset for current staffing evidence."}
            </span>
          </div>
        )}
        {messages.map((message, index) => (
          <article
            className={`copilot-message copilot-${message.role}`}
            key={`${message.role}-${index}`}
          >
            {message.role === "user" && <strong>{message.text}</strong>}
            {message.role === "error" && <p>{message.text}</p>}
            {message.response && (
              <>
                <p className="copilot-answer">{message.response.answer}</p>
                <div className="copilot-meta">
                  <span>Intent: {message.response.intent}</span>
                  <span>
                    Provider: {message.response.provider_status}
                    {message.response.provider_error_category
                      ? ` (${message.response.provider_error_category})`
                      : ""}
                  </span>
                </div>
                {message.response.evidence?.length > 0 && (
                  <div className="copilot-evidence">
                    <strong>Sources</strong>
                    {message.response.evidence.map((source, sourceIndex) => (
                      <span
                        key={`${source.source_type}-${source.source_id}-${sourceIndex}`}
                      >
                        {source.title} · {source.source_id}
                      </span>
                    ))}
                  </div>
                )}
                {message.response.limitations?.length > 0 && (
                  <div className="copilot-limitation">
                    <strong>Limitations:</strong>{" "}
                    {message.response.limitations.join(" ")}
                  </div>
                )}
              </>
            )}
          </article>
        ))}
        {loading && (
          <div className="copilot-loading">
            Retrieving evidence and preparing response...
          </div>
        )}
      </div>

      <form className="copilot-form" onSubmit={submitQuestion}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. Which schools have the highest mathematics shortages?"
          maxLength={2000}
          aria-label="Copilot question"
        />
        <button
          className="btn-primary"
          type="submit"
          disabled={loading || !question.trim()}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
