import * as React from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionHeader(props) {
    const { collectionId } = props
    const {
        data,
        isLoading,
        isSuccess,
        isError,
        error,
    } = useGetCollectionQuery(collectionId);
    const collection = data;

    if (isLoading) return (<h1>Loading...</h1>)
    else {
        return (
            <div className='collectionHeader'>

                {/* Title and Collection ID */}
                <div className="collectionInformation">
                    <h1 className="title">{collection.name}</h1>
                    <h3>Collection #{collectionId}</h3>
                </div>

                {/* Buttons for Modifying and showing Sources */}
                <div className="buttons">

                    {/* Routes to Modifying*/}
                    <Button
                        style={{ backgroundColor: "white" }}
                        variant='contained'
                        sx={{ my: 2.25, color: 'black', display: 'block' }}
                        component={Link}
                        to="modify-collection"
                    >
                        Modify this Collection
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
        )
    }
}
