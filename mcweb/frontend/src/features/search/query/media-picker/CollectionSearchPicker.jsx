import * as React from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';
import { useLazyGetCollectionSearchQuery } from '../../../../app/services/searchApi';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';

export default function CollectionSearchPicker() {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyGetCollectionSearchQuery();
  const dispatch = useDispatch();
  const { previewCollections } = useSelector((state) => state.query);

  const collectionIds = previewCollections.map((collection) => collection.id);

  const inSelectedMedia = (collectionId) => collectionIds.includes(collectionId);
  return (
    <div className="collection-search-picker-container">
      {/* CollectionSearch */}
      <TextField size="large" sx={{ marginTop: '1rem' }} label="Search Collection by Name" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Button sx={{ marginLeft: '1rem', marginTop: '1rem' }} variant="outlined" onClick={() => trigger(query)}>
        Search
      </Button>
      {/* CollectionSearch results? */}
      {isLoading && (
        <div>Loading...</div>
      )}
      {data && (
        <div>
          <p>
            {data.collections.length}
            {' '}
            Collections matching "
            {query}
            "
          </p>

          <table>
            <tbody>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
              {data.collections.map((collection) => (
                <tr key={collection.id}>
                  <td><Link to={`/collections/${collection.id}`} target="_blank" rel="noopener noreferrer">{collection.name}</Link></td>
                  <td>{collection.notes}</td>
                  <td>
                    {!(inSelectedMedia(collection.id)) && (
                    <AddCircleIcon sx={{ color: '#d24527' }} onClick={() => dispatch(addPreviewSelectedMedia(collection))} />
                    )}
                    {(inSelectedMedia(collection.id)) && (
                    <RemoveCircleIcon sx={{ color: '#d24527' }} onClick={() => dispatch(removePreviewSelectedMedia(collection.id))} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}
    </div>
  );
}
