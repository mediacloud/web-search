import * as React from 'react';
import PropTypes from 'prop-types';
import { useCSVReader } from 'react-papaparse';
import Button from '@mui/material/Button';
import { useUploadSourcesMutation } from '../../app/services/sourceApi';

export default function UploadSources(props) {
  const { collectionId } = props;

  const [uploadSources] = useUploadSourcesMutation();

  const { CSVReader } = useCSVReader();

  return (
    <div>
      <CSVReader
        config={{ header: true }}
        onUploadAccepted={(results) => {
          // RTK Mutation
          uploadSources({ sources: results.data, collection_id: collectionId });
        }}
      >
        {({
          getRootProps,
          acceptedFile,
        }) => (
          <div>
            <Button variant="outlined" {...getRootProps()}>
              Upload CSV
            </Button>
            <div>
              {acceptedFile && acceptedFile.name}
            </div>
          </div>
        )}
      </CSVReader>
    </div>
  );
}

UploadSources.propTypes = {
  collectionId: PropTypes.number.isRequired,
};
