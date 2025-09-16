import React from 'react';
import { 
  Box, 
  Typography,
  Flex,
  Grid
} from '@strapi/design-system';
import { Database } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';
import Export from './Export';
import Import from './Import';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Box padding={8}>
      <Box paddingBottom={8}>
        <Flex direction="column" alignItems="center" gap={4}>
          <Box
            hasRadius
            background="primary100"
            padding={6}
          >
            <Database width="48px" height="48px" />
          </Box>
          <Typography variant="alpha" tag="h1">
            {formatMessage({
              id: 'import-export-web.home.title',
              defaultMessage: 'Import/Export Data'
            })}
          </Typography>
          <Typography variant="pi" textColor="neutral600" textAlign="center" maxWidth="500px">
            {formatMessage({
              id: 'import-export-web.home.subtitle',
              defaultMessage: 'Manage your Strapi data with import and export functionality. Create backups or restore from previous exports.'
            })}
          </Typography>
        </Flex>
      </Box>
      
      <Grid.Root gap={6}>
        <Grid.Item col={6}>
          <Box
            hasRadius
            background="neutral0"
            shadow="tableShadow"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="neutral200"
            padding={6}
            height="100%"
            width="100%"
            display="flex"
          >
            <Export />
          </Box>
        </Grid.Item>
        
        <Grid.Item col={6}>
          <Box
            hasRadius
            background="neutral0"
            shadow="tableShadow"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="neutral200"
            padding={6}
            height="100%"
            width="100%"
            display="flex"
          >
            <Import />
          </Box>
        </Grid.Item>
      </Grid.Root>
    </Box>
  );
};

export { HomePage };
