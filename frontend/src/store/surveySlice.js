import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const checkSurveyStatus = createAsyncThunk(
  'survey/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/surveys', { params: { limit: 1 } });
      return data.total > 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to check survey status');
    }
  }
);

const surveySlice = createSlice({
  name: 'survey',
  initialState: {
    hasSurvey: null,
    checking: false,
  },
  reducers: {
    resetSurveyStatus: (state) => {
      state.hasSurvey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSurveyStatus.pending, (state) => { state.checking = true; })
      .addCase(checkSurveyStatus.fulfilled, (state, action) => {
        state.checking = false;
        state.hasSurvey = action.payload;
      })
      .addCase(checkSurveyStatus.rejected, (state) => {
        state.checking = false;
        state.hasSurvey = true; // fail open — don't lock farmers out on a network error
      });
  },
});

export const { resetSurveyStatus } = surveySlice.actions;
export default surveySlice.reducer;