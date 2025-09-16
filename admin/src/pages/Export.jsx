import React, { useState } from 'react';
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

const Export = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [includeFiles, setIncludeFiles] = useState(false);
  const { formatMessage } = useIntl();
  const { get } = getFetchClient();

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

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const params = new URLSearchParams();
      if (includeFiles) {
        params.append('includeFiles', 'true');
      }

      const url = `/import-export-web${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      console.log('Blob type:', blob.type);

      const contentDisposition = response.headers.get('content-disposition');
      console.log('Content-Disposition header:', contentDisposition);
      
      const filename = getAttachmentName(contentDisposition) || "strapi-export.tar.gz";
      console.log('Final filename:', filename);

      if (blob.size > 0) {
        downloadFile(filename, blob);
        setSuccess(true);
      } else {
        throw new Error('Received empty file from server');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || formatMessage({
        id: 'import-export-web.export.error.title',
        defaultMessage: 'Export failed'
      }));
    } finally {
      setIsLoading(false);
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
          <Flex alignItems="center" gap={2}>
            <input
              type="checkbox"
              id="includeFiles"
              checked={includeFiles}
              onChange={(e) => setIncludeFiles(e.target.checked)}
              disabled={isLoading}
              style={{
                width: '16px',
                height: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            />
            <label 
              htmlFor="includeFiles"
              style={{
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: isLoading ? '#999' : 'inherit'
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
          disabled={isLoading}
          loading={isLoading}
          startIcon={!isLoading && <Download />}
        >
          {isLoading 
            ? formatMessage({
                id: 'import-export-web.export.button.loading',
                defaultMessage: 'Exporting...'
              })
            : formatMessage({
                id: 'import-export-web.export.button.default',
                defaultMessage: 'Download Archive'
              })
          }
        </Button>
      </Flex>
    </Flex>
  );
};

export default Export;
