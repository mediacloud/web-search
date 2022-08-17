import { createSlice } from '@reduxjs/toolkit';


// Most of the operations will automatically fetched and managed 
// via RTK operations in reducers it maintians. However: 

// Featured: array of featured collection objects, fetched
// just once at page load, based on a static list of collections 
// IDs we maintain in the server code (this doesn't change very often)

// Selected: if the user is on a collection or source page, this 
// ID is filled in (probably this should be parsed and set from the URL)


const slice = createSlice({
  name: 'collections',
  
  initialState: { featured: null, selected: null }

})

export default slice.reducer