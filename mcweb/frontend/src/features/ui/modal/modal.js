import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MediaPicker from '../../search/media_picker/MediaPicker';
import { closeModal, changeTab } from '../uiSlice';

export default function Modal() {
    const dispatch = useDispatch(); 

    const { modal } = useSelector(state => state.ui);
 
    if (!modal) {
        return null;
    }

    let component; 

    switch (modal) {
        case 'mediaPicker':
            component = <MediaPicker />;
            break;
        default:
            return null;
    }

    return (
        <div className="modal-background" onClick={() => dispatch(closeModal())}>
            <div className="modal-child" onClick={e => e.stopPropagation()}>
                <button onClick={() => dispatch(changeTab('featuredCollections'))}>Featured Collections</button>
                <button onClick={() => dispatch(changeTab('collectionSearch'))}>Search Collections</button>
                <button onClick={() => dispatch(changeTab('sourceSearch'))}>Search Sources</button>
                {component}
            </div>
        </div>
    );
}