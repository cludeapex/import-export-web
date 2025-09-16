import React, { useState, useRef } from 'react';
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

const Import = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [includeFiles, setIncludeFiles] = useState(false);
  const fileInputRef = useRef(null);
  const { formatMessage } = useIntl();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIncludeFiles(false);
    setError(null);
    setSuccess(false);
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
            disabled={isLoading || !selectedFile}
            loading={isLoading}
            startIcon={!isLoading && <Upload />}
          >
            {isLoading
              ? formatMessage({
                  id: 'import-export-web.import.button.loading',
                  defaultMessage: 'Importing...'
                })
              : formatMessage({
                  id: 'import-export-web.import.button.default',
                  defaultMessage: 'Upload Archive'
                })
            }
          </Button>

          <Button
            onClick={handleReset}
            variant="secondary"
            disabled={isLoading}
          >
            {formatMessage({
              id: 'import-export-web.import.button.reset',
              defaultMessage: 'Reset'
            })}
          </Button>

        </Flex>
      </Flex>
    </Flex>
  );
};

export default Import;
