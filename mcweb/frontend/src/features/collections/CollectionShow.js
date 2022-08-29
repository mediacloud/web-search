import * as React from 'react';
import { Button, Box } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import CollectionHeader from './CollectionHeader';
import SourceList from '../sources/SourceList';

export default function CollectionShow() {
  const params = useParams()
  const collectionId = Number(params.collectionId);
  const [isShown, setIsShown] = useState(true)

    return (
      <div className="container">
        <div className="collection-header">
          <CollectionHeader collectionId={collectionId} />
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              style={{ backgroundColor: "white" }}
              variant='contained'
              sx={{ my: 2.25, color: 'black', display: 'block' }}
              component={Link}
              to="modify-collection"
            >
              Modify this Collection
            </Button>

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
          </Box>

          <SourceList collectionId={collectionId} />

      
          {/* <h3> Notes: {collection.notes}</h3>  */}

        </div>
        
        {isShown && ( 
        <div className='content'>
            <SourceList collectionId={collectionId} />
        </div>
        )}
      </div >
    )
}