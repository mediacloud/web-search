import * as React from 'react';
import {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FeaturedCollectionsPicker from './FeaturedCollectionsPicker';
import SelectedMediaPreview from '../SelectedMediaPreview';
import CollectionSearchPicker from './CollectionSearchPicker';
import { addSelectedMedia } from '../querySlice';
import { closeModal } from '../../../ui/uiSlice';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function MediaPicker(props) {
    // const {isOpen} = props;
    // console.log(isOpen);
    const [tab, setTab] = useState('featuredCollections');
    const dispatch = useDispatch();
    const {previewCollections} = useSelector(state => state.query);
    const [open, setOpen] = useState(false);

    // useEffect(() => {
    //     setOpen(isOpen);
    // }, [isOpen]);
    // return(
    // <div className='container media-picker-container'>
    //     <div className='row'>
    //         <div className='col-5'>
    //             <div className='media-picker-tab' onClick={() => setTab('featuredCollections')}>Featured Collections</div>
    //             <div className='media-picker-tab' onClick={() => setTab('collectionSearch')}>Search Collections</div>
    //             <div className='media-picker-tab' onClick={() => setTab('sourceSearch')}>Search Sources</div>
    //             <SelectedMediaPreview />
    //         </div>

        

    //         <div className='col-7'>
    //             {tab === 'featuredCollections' && (
    //                 <FeaturedCollectionsPicker />
    //             )}

    //             {tab === 'collectionSearch' && (
    //                 // <FeaturedCollectionsPicker />
    //                 <CollectionSearchPicker />
    //             )}

    //             {tab === 'sourceSearch' && (
    //                 // <FeaturedCollectionsPicker />
    //                 <h3>Sources search...under construction</h3>
    //             )}
    //         </div>

    //     </div>
    //     <button onClick={() => {
    //         dispatch(addSelectedMedia(previewCollections));
    //         dispatch(closeModal());
    //     }}>Confirm</button>
    //     <button onClick={() => {
    //         dispatch(closeModal());
    //     }}>Close</button>
    // </div>
    // );
    return (
        <div>
            <Button variant="outlined" onClick={()=> setOpen(true)}>
                    Select Media
                </Button>
            <Dialog maxWidth={'xl'} fullWidth={true} open={open} onClose={() => setOpen(false)}>
                <DialogContent>
                    <div className='container media-picker-container'>
                        <div className='row'>

                            <div className='col-5'>
                                <div className='media-picker-tab' onClick={() => setTab('featuredCollections')}>Featured Collections</div>
                                <div className='media-picker-tab' onClick={() => setTab('collectionSearch')}>Search Collections</div>
                                <div className='media-picker-tab' onClick={() => setTab('sourceSearch')}>Search Sources</div>
                                <SelectedMediaPreview />
                            </div>



                            <div className='col-7'>
                                {tab === 'featuredCollections' && (
                                    <FeaturedCollectionsPicker />
                                )}

                                {tab === 'collectionSearch' && (
                                    // <FeaturedCollectionsPicker />
                                    <CollectionSearchPicker />
                                )}

                                {tab === 'sourceSearch' && (
                                    // <FeaturedCollectionsPicker />
                                    <h3>Sources search...under construction</h3>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOpen(false);
                        dispatch(addSelectedMedia(previewCollections));
                    }}>
                            Confirm
                        </Button>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}