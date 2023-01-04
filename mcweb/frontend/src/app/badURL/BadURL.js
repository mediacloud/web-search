import * as React from 'react';
import { assetUrl } from '../../features/ui/uiUtil';


export default function BadURL() {
  
  return (
    <div className='fail-div'>
    
    <h1 className='fail-text'>This page doesn't exist.</h1>
    
    {/* using fail-text class because both classes would have same 'text-align'ing purpose */}
    <div className='fail-text'>
      <img className='fail-img' src={assetUrl('img/fail-fox-bad-url.png')} alt="failed url fox" />
    
    </div>
    
    
    </div>
    )
    
  }
  