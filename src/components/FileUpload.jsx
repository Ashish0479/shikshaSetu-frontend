import React, { useRef, useState } from 'react';

const supported = new Set(['csv', 'xlsx', 'xls']);

export default function FileUpload({ onInspect, isProcessing, errorMessage, onClearError }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [localError, setLocalError] = useState('');
  const addFiles = (input) => {
    onClearError?.();
    const incoming = Array.from(input || []);
    const valid = incoming.filter((file) => supported.has(file.name.split('.').pop().toLowerCase()));
    setLocalError(valid.length === incoming.length ? '' : 'Only CSV and Excel files are supported.');
    setFiles((old) => [...old, ...valid].filter((file, i, all) => all.findIndex((item) => item.name === file.name && item.size === file.size) === i));
  };
  return <form className="upload-form" onSubmit={(event) => { event.preventDefault(); if (files.length) onInspect(files); else setLocalError('Choose at least one file.'); }}>
    <div className="upload-area" role="button" tabIndex="0" onClick={() => !isProcessing && inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
      <input ref={inputRef} hidden type="file" multiple accept=".csv,.xlsx,.xls" onChange={(event) => addFiles(event.target.files)} />
      <div className="upload-icon-container">↑</div><p className="upload-prompt-title">Upload one workbook or multiple CSV/XLSX files</p>
      <button className="btn-choose-file" type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>Choose files</button>
      <div className="format-info">CSV, XLSX, XLS · multiple files supported</div>
    </div>
    {files.length > 0 && <div className="file-list-box"><div className="file-list-title">Selected files</div>{files.map((file, index) => <div className="file-item" key={`${file.name}-${file.size}`}><span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span><button type="button" className="file-item-remove" onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove</button></div>)}</div>}
    {(localError || errorMessage) && <div className="error-banner">{localError || errorMessage}</div>}
    <div className="form-action"><button className="btn-primary" disabled={isProcessing || !files.length}>{isProcessing ? 'Inspecting…' : 'Inspect data'}</button></div>
  </form>;
}
