import * as React from 'react';
import { Button, Box } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import CollectionHeader from './CollectionHeader';
import SourceList from '../sources/SourceList';

export default function CollectionShow() {
  const params = useParams()
  const collectionId = Number(params.collectionId);
  const [isShown, setIsShown] = useState(false)

  return (
    <>
      <div className='collectionHeader'>

        {/* Header  */}
        <CollectionHeader collectionId={collectionId} />

        {/* Buttons for Modifying and showing Sources */}
        <div className="buttons">

          {/* Routes to Modifying */}
          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            component={Link}
            to="modify-collection"
          >
            Modify Collection
          </Button>

          {/* Shows all associated Sources*/}
          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            onClick={async () => {
              setIsShown(!isShown)
            }}
          >
            Sources
          </Button>
        </div>
      </div>

{/* Source List */}
      {isShown && (
        <SourceList collectionId={collectionId} />
      )}
    </>
  )
}