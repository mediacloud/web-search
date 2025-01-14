import * as React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useCSVReader } from 'react-papaparse';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { useUploadSourcesMutation } from '../../app/services/sourceApi';

export default function UploadSources({ collectionId, rescrape, managedCollection }) {
  const { enqueueSnackbar } = useSnackbar();
  const [updating, setUpdating] = useState(false);
  const [uploadSources, { isLoading: isUpdating }] = useUploadSourcesMutation();

  const { CSVReader } = useCSVReader();

  return (
    <div>
      <CSVReader
        config={{
          header: true,
          delimiter: ',',
        }}
        onUploadAccepted={async (uploadInfo) => {
          setUpdating(true);
          console.log(uploadInfo);
          const results = await uploadSources({ sources: uploadInfo.data, collection_id: collectionId, rescrape });
          setUpdating(false);
          enqueueSnackbar(
            `Created ${results.data.created}. Updated ${results.data.updated}. Skipped ${results.data.skipped}.`,
            { variant: 'info' },
          );
        }}
      >
        {({
          getRootProps,
          acceptedFile,
        }) => (
          <div>
            <Button
              disabled={updating || managedCollection}
              variant="outlined"
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...getRootProps()}
            >
              Upload CSV
            </Button>
            {(isUpdating || updating) && <CircularProgress />}
            <div>
              {acceptedFile && (
              <i>
                Upload:
                {' '}
                {acceptedFile.name}
              </i>
              )}
            </div>
          </div>
        )}
      </CSVReader>
    </div>
  );
}

UploadSources.propTypes = {
  collectionId: PropTypes.number.isRequired,
  rescrape: PropTypes.bool.isRequired,
  managedCollection: PropTypes.bool.isRequired,
};
