import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ProcessingResult from './components/ProcessingResult';
import api, { formatErrorMessage } from './services/api';

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleProcess = async (file) => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const processedData = await api.processDatasetWorkflow(file);
      setResult(processedData);
    } catch (err) {
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage('');
  };

  return (
    <div className="page-wrapper">
      <main className="container">
        <div className="card">
          {/* Header */}
          <header className="card-header">
            <h1 className="page-title">Teacher Data Cleaning &amp; Standardization</h1>
            <p className="page-description">
              Upload a teacher dataset in CSV or Excel format. The system will validate,
              clean, standardize and return the processed dataset.
            </p>
          </header>

          {/* Body: Upload Form or Processing Result */}
          <div className="card-body">
            {!result ? (
              <FileUpload
                onProcess={handleProcess}
                isProcessing={isProcessing}
                errorMessage={errorMessage}
                onClearError={() => setErrorMessage('')}
              />
            ) : (
              <ProcessingResult
                result={result}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
