import * as React from 'react';
import { TextField, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import { useUpdateCollectionMutation, useGetCollectionQuery } from '../../app/services/collectionsApi';
import SourceList from '../sources/SourceList';
import UploadSources from '../sources/UploadSources';
import CollectionHeader from './CollectionHeader';

export default function ModifyCollection() {
  const params = useParams();
  const collectionId = Number(params.collectionId); // get collection id from wildcard

  const { data, isLoading } = useGetCollectionQuery(collectionId);

  // form state for text fields
  const [formState, setFormState] = useState({
    id: 0, name: '', notes: '',
  });

  // formState declaration
  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  // rtk operations
  const [updateCollection] = useUpdateCollectionMutation();
  // const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();

  // set form data to the collection specified in url
  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id,
        name: data.name,
        notes: data.notes ? data.notes : '',
      };
      setFormState(formData);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <CollectionHeader collectionId={collectionId} />

      <div className="container">

        <div className="row">
          <div className="col-12">
            <h2>Modify this Collection</h2>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <br />
            <TextField
              label="Name"
              fullWidth
              id="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
            />
            <br />
            <br />
            <TextField
              fullWidth
              label="Notes"
              id="outlined-multiline-static"
              name="notes"
              multiline
              rows={4}
              value={formState.notes}
              onChange={handleChange}
            />
            <br />
            <br />
            <Button
              variant="contained"
              onClick={async () => {
                const updatedCollection = await updateCollection({
                  id: formState.id,
                  name: formState.name,
                  notes: formState.notes,
                }).unwrap();
              }}
            >
              Update
            </Button>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h3>Add/Remove Sources</h3>
            <UploadSources collectionId={collectionId} />
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <SourceList collectionId={collectionId} edit />
          </div>
        </div>
      </div>

    </>
  );
}
