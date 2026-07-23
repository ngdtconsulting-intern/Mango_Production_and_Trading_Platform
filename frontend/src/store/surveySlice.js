import { createSlice } from '@reduxjs/toolkit';

const surveySlice = createSlice({
  name: 'survey',
  initialState: { surveys: [], loading: false, error: null },
  reducers: {},
});

export default surveySlice.reducer;