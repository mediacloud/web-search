import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'sources',

  initialState: { id: null, name: null, label: null, url: null}

})

export default slice.reducer