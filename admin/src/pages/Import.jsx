import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Flex,
  Alert,
  Field
} from '@strapi/design-system';
import { Upload, CheckCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useOperationLock } from '../hooks/useOperationLock';

const Import = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [jobId, setJobId] = useState(null);
  const eventSourceRef = useRef(null);
  const fileInputRef = useRef(null);
  const { formatMessage } = useIntl();
  const { isAnyOperationRunning, lockOperation, unlockOperation, getCurrentOperation } = useOperationLock();

  // Очистка EventSource при размонтировании
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setProgress(0);
    setProgressMessage('');
  };

  const startSSEListener = (jobId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/import-export-web/status/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'progress':
            setProgress(data.progress || 0);
            setProgressMessage(data.message || '');
            break;
          case 'finished':
            setProgress(100);
            setProgressMessage('Completed successfully');
            setSuccess(true);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            eventSource.close();
            setIsLoading(false);
            unlockOperation();
            break;
          case 'error':
            setError(data.error || data.message);
            eventSource.close();
            setIsLoading(false);
            setProgress(0);
            setProgressMessage('');
            unlockOperation();
            break;
          case 'ping':
            // Keep connection alive
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = (event) => {
      console.error('SSE error:', event);
      setError('Connection error');
      eventSource.close();
      setIsLoading(false);
      setProgress(0);
      setProgressMessage('');
      unlockOperation();
    };
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError(formatMessage({
        id: 'import-export-web.import.error.no-file',
        defaultMessage: 'Please select a file to import'
      }));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('archive', selectedFile);
      formData.append('includeFiles', includeFiles ? 'true' : 'false');
      formData.append('skipAssets', !includeFiles);
      formData.append('sse', 'true'); // Всегда используем SSE

      if (!includeFiles) {
        formData.append('exclude', JSON.stringify(['files']));
      }

      const response = await fetch('/import-export-web', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Import failed' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.jobId) {
        setJobId(result.jobId);
        lockOperation('import', result.jobId);
        startSSEListener(result.jobId);
        setProgress(0);
        setProgressMessage('Starting...');
        // НЕ вызываем setIsLoading(false) - оставляем true для блокировки кнопки
        return;
      }

      if (response.status === 200) {
        setSuccess(true);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || formatMessage({
        id: 'import-export-web.import.error.title',
        defaultMessage: 'Import failed'
      }));
      // В случае ошибки всегда разблокируем
      setIsLoading(false);
      unlockOperation();
    } finally {
      // finally не нужен для SSE режима
    }
  };

  const handleReset = () => {
    // Закрываем SSE соединение если оно открыто
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setSelectedFile(null);
    setIncludeFiles(false);
    setError(null);
    setSuccess(false);
    setProgress(0);
    setProgressMessage('');
    setIsLoading(false);
    setJobId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Flex direction="column" alignItems="stretch" gap={4} height="100%" width="100%" flex="1">
      <Flex direction="column" alignItems="center" gap={2}>
        <Box
          hasRadius
          background="secondary100"
          padding={3}
        >
          <Upload width="24px" height="24px" />
        </Box>
        <Typography variant="beta" tag="h2">
          {formatMessage({
            id: 'import-export-web.import.title',
            defaultMessage: 'Import Data'
          })}
        </Typography>
        <Typography variant="pi" textColor="neutral600" textAlign="center">
          {formatMessage({
            id: 'import-export-web.import.subtitle',
            defaultMessage: 'This operation will replace existing data in your Strapi instance. By default, uploaded files are skipped for faster import.'
          })}
        </Typography>
      </Flex>

      <Flex direction="column" alignItems="stretch" gap={4}>
        <Typography variant="delta" tag="h3">
          {formatMessage({
            id: 'import-export-web.import.section-title',
            defaultMessage: 'Import Data from Archive'
          })}
        </Typography>

        <Field.Root error={error} name="archive">
          <Field.Label>
            {formatMessage({
              id: 'import-export-web.import.file-label',
              defaultMessage: 'Strapi Archive File'
            })}
          </Field.Label>
          <Field.Input
            ref={fileInputRef}
            type="file"
            accept=".tar.gz,.tgz"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Field.Hint>
            {formatMessage({
              id: 'import-export-web.import.file-hint',
              defaultMessage: 'Select a .tar.gz file exported from Strapi'
            })}
          </Field.Hint>
          <Field.Error />
        </Field.Root>

        <Box paddingTop={2}>
          <Flex alignItems="flex-start" gap={2}>
            <input
              type="checkbox"
              id="includeFiles"
              checked={includeFiles}
              onChange={(e) => setIncludeFiles(e.target.checked)}
              disabled={isLoading || isAnyOperationRunning}
              style={{
                width: '16px',
                height: '16px',
                cursor: (isLoading || isAnyOperationRunning) ? 'not-allowed' : 'pointer',
                marginTop: '2px'
              }}
            />
            <label
              htmlFor="includeFiles"
              style={{
                cursor: (isLoading || isAnyOperationRunning) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: (isLoading || isAnyOperationRunning) ? '#999' : 'inherit',
                lineHeight: '1.4'
              }}
            >
              {formatMessage({
                id: 'import-export-web.import.include-files',
                defaultMessage: 'Include uploaded files in import (may significantly increase import time)'
              })}
            </label>
          </Flex>
        </Box>

        {success && (
          <Alert
            closeLabel="Close"
            title={formatMessage({
              id: 'import-export-web.import.success.title',
              defaultMessage: 'Import successful'
            })}
            variant="success"
            icon={<CheckCircle />}
            onClose={() => setSuccess(false)}
          >
            {formatMessage({
              id: 'import-export-web.import.success.message',
              defaultMessage: 'Your data has been imported successfully. The application may need to be restarted.'
            })}
          </Alert>
        )}

        <Flex gap={2}>
          <Button
            onClick={handleImport}
            variant="primary"
            disabled={isLoading || !selectedFile || isAnyOperationRunning}
            loading={isLoading}
            startIcon={!isLoading && <Upload />}
          >
            {isLoading
              ? (progress > 0 
                  ? `Uploading... ${progress}%`
                  : formatMessage({
                      id: 'import-export-web.import.button.loading',
                      defaultMessage: 'Importing...'
                    }))
              : isAnyOperationRunning
                ? `${getCurrentOperation()?.type || 'Operation'} in progress...`
                : formatMessage({
                    id: 'import-export-web.import.button.default',
                    defaultMessage: 'Upload Archive'
                  })
            }
          </Button>

          <Button
            onClick={handleReset}
            variant="secondary"
            disabled={isLoading || isAnyOperationRunning}
          >
            {formatMessage({
              id: 'import-export-web.import.button.reset',
              defaultMessage: 'Reset'
            })}
          </Button>

        </Flex>

        {isLoading && progressMessage && (
          <Box paddingTop={2}>
            <Typography variant="pi" textColor="neutral600">
              {progressMessage}
            </Typography>
          </Box>
        )}
      </Flex>
    </Flex>
  );
};

export default Import;
