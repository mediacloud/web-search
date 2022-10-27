import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MediaPicker from '../../search/query/media-picker/MediaPicker';
import PlatformPicker from '../../search/query/PlatformPicker';
import { closeModal} from '../uiSlice';

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
        case 'platformPicker':
            component = <PlatformPicker />;
            break;
        default:
            return null;
    }

    return (
        <div className="modal-background" onClick={() => dispatch(closeModal())}>
            <div className="modal-child" onClick={e => e.stopPropagation()}>
                {component}
            </div>
        </div>
    );
}