import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
// import { useCSVDownloader } from 'react-papaparse';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import CollectionList from '../collections/CollectionList';
import { useCreateSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import {
  useGetSourceQuery,
  useUpdateSourceMutation,
  // useDeleteSourceMutation,
  // usePostSourceMutation,
}
  from '../../app/services/sourceApi';

export default function ModifySource() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const [formState, setFormState] = React.useState({
    id: '', name: '', notes: '', homepage: '', label: '', service: '',
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  // const { CSVDownloader, Type } = useCSVDownloader();

  // show data
  const [isShown, setIsShown] = useState(true);

  // create
  // const [post, { setPost }] = usePostSourceMutation();

  // update
  const [updateSource] = useUpdateSourceMutation();

  // delete
  // const [remove, { setRemove }] = useDeleteSourceMutation();

  const {
    data,
    isLoading,
  } = useGetSourceQuery(sourceId);

  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id, name: data.name, notes: data.notes, homepage: data.homepage, label: data.label,
      };
      setFormState(formData);
    }
  }, [data]);
  const [collectionId, setCollectionId] = useState('');

  const collectionData = useGetCollectionQuery(collectionId);

  const [createSourceCollectionAssociation] = useCreateSourceCollectionAssociationMutation();

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
      <div className="modifyHeader">

        <h1>
          Modify
          {data.id}
          :
          {data.label}
        </h1>

        <div className="actions">
          <Button
            style={{ backgroundColor: 'white' }}
            variant="contained"
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            onClick={async () => {
              setIsShown(!isShown);
            }}
          >
            Associations
          </Button>
        </div>
      </div>

      {/* Source Content */}
      <div className="modifyCollectionContent">
        <ul>
          {/* Name */}
          <li>
            <h5>Name</h5>
            <TextField
              fullWidth
              id="text"
              name="name"
              value={formState.name ? formState.name : 'enter name'}
              onChange={handleChange}
            />
          </li>

          {/* Notes */}
          <li>
            <h5>Notes</h5>
            <TextField
              fullWidth
              id="outlined-multiline-static"
              name="notes"
              multiline
              rows={4}
              value={formState.notes === null ? '' : formState.notes}
              onChange={handleChange}
            />
          </li>

          {/* Homepage */}
          <li>
            <h5>Homepage</h5>
            <TextField
              fullWidth
              id="text"
              name="homepage"
              value={formState.homepage}
              onChange={handleChange}
            />
          </li>

          {/* Label */}
          <li>
            <h5>Label</h5>
            <TextField
              fullWidth
              id="text"
              name="label"
              value={formState.label ? formState.label : 'enter or edit label'}
              onChange={handleChange}
            />
          </li>

          {/* Update */}
          <Button
            style={{ backgroundColor: 'white' }}
            variant="contained"
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            onClick={async () => {
              const updateCollection = await updateSource(formState).unwrap();
            }}
          >
            Update
          </Button>
        </ul>
      </div>

      {/* Assocation Content */}

      {isShown
          && (
          <div>
            <div className="sourceAssocationContent">
              <h1> Add Collection to Source (enter the collection ID): </h1>
              <input type="text" value={collectionId} onChange={(e) => setCollectionId(Number(e.target.value))} />

              <Button onClick={() => {
                const assoc = { source_id: sourceId, collection_id: collectionId };
                const collection = collectionData.data;
                createSourceCollectionAssociation(assoc);
                setCollectionId('');
              }}
              >
                Add Collection
              </Button>

            </div>
            <CollectionList edit sourceId={sourceId} />
          </div>
          )}

    </>

  );
}
