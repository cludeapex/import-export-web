import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography,
  Flex,
  Alert
} from '@strapi/design-system';
import { Download, CheckCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getFetchClient } from '@strapi/strapi/admin';
import { useOperationLock } from '../hooks/useOperationLock';

const Export = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [jobId, setJobId] = useState(null);
  const eventSourceRef = useRef(null);
  const { formatMessage } = useIntl();
  const { get } = getFetchClient();
  const { isAnyOperationRunning, lockOperation, unlockOperation, getCurrentOperation } = useOperationLock();

  // Очистка EventSource при размонтировании
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getAttachmentName = (contentDispositionHeader = "") => {
    const val = new URLSearchParams(
      contentDispositionHeader.replace("attachment;", "").trim()
    );
    return val.get("filename");
  };

  const downloadFile = (name, blob) => {
    const anchorEl = document.createElement("a");
    anchorEl.href = URL.createObjectURL(blob);
    anchorEl.download = name;

    document.body.appendChild(anchorEl);
    anchorEl.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(anchorEl.href);
      document.body.removeChild(anchorEl);
    }, 200);
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
            setProgressMessage('Export completed');
            setSuccess(true);
            eventSource.close();
            setIsLoading(false);
            unlockOperation();
            
            // Автоматически скачиваем файл
            if (data.result?.fileName) {
              const link = document.createElement('a');
              link.href = `/import-export-web?includeFiles=${includeFiles}`;
              link.download = data.result.fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
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

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const params = new URLSearchParams();
      if (includeFiles) {
        params.append('includeFiles', 'true');
      }
      params.append('sse', 'true'); // Всегда используем SSE

      const url = `/import-export-web${params.toString() ? `?${params.toString()}` : ''}`;
      
      // SSE mode (всегда)
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setJobId(result.jobId);
      lockOperation('export', result.jobId);
      startSSEListener(result.jobId);
      setProgress(0);
      setProgressMessage('Starting...');
      // НЕ вызываем setIsLoading(false) - оставляем true для блокировки кнопки
      return;

    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || formatMessage({
        id: 'import-export-web.export.error.title',
        defaultMessage: 'Export failed'
      }));
      // В случае ошибки всегда разблокируем
      setIsLoading(false);
      unlockOperation();
    }
  };


  return (
    <Flex direction="column" alignItems="stretch" gap={4} height="100%" width="100%" flex="1">
      <Flex direction="column" alignItems="center" gap={2}>
        <Box
          hasRadius
          background="primary100"
          padding={3}
        >
          <Download width="24px" height="24px" />
        </Box>
        <Typography variant="beta" tag="h2">
          {formatMessage({
            id: 'import-export-web.export.title',
            defaultMessage: 'Export Data'
          })}
        </Typography>
        <Typography variant="pi" textColor="neutral600" textAlign="center">
          {formatMessage({
            id: 'import-export-web.export.subtitle',
            defaultMessage: 'Download all your Strapi data as an archive'
          })}
        </Typography>
      </Flex>

      <Flex direction="column" alignItems="stretch" gap={4}>
        <Typography variant="delta" tag="h3">
          {formatMessage({
            id: 'import-export-web.export.section-title',
            defaultMessage: 'Export All Data'
          })}
        </Typography>

        <Typography variant="pi" textColor="neutral600">
          {formatMessage({
            id: 'import-export-web.export.description',
            defaultMessage: 'This will create a complete backup of your Strapi instance including content and configuration.'
          })}
        </Typography>

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
                id: 'import-export-web.export.include-files',
                defaultMessage: 'Include uploaded files in export (may significantly increase file size)'
              })}
            </label>
          </Flex>
        </Box>

        {success && (
          <Alert
            closeLabel="Close"
            title={formatMessage({
              id: 'import-export-web.export.success.title',
              defaultMessage: 'Export successful'
            })}
            variant="success"
            onClose={() => setSuccess(false)}
          >
            {formatMessage({
              id: 'import-export-web.export.success.message',
              defaultMessage: 'Your data has been exported successfully and the download should start automatically.'
            })}
          </Alert>
        )}

        {error && (
          <Alert
            closeLabel="Close"
            title={formatMessage({
              id: 'import-export-web.export.error.title',
              defaultMessage: 'Export failed'
            })}
            variant="danger"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Button
          onClick={handleExport}
          variant="primary"
          disabled={isLoading || isAnyOperationRunning}
          loading={isLoading}
          startIcon={!isLoading && <Download />}
        >
          {isLoading 
            ? (progress > 0 
                ? `Exporting... ${progress}%`
                : formatMessage({
                    id: 'import-export-web.export.button.loading',
                    defaultMessage: 'Exporting...'
                  }))
            : isAnyOperationRunning
              ? `${getCurrentOperation()?.type || 'Operation'} in progress...`
              : formatMessage({
                  id: 'import-export-web.export.button.default',
                  defaultMessage: 'Download Archive'
                })
          }
        </Button>

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

export default Export;
