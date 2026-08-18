import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { getCurrentBsYear } from '../utils/treeAgeYield';

/**
 * The survey is an annual census, so "has this farmer filed?" is only ever
 * meaningful for a given year. Asking whether they have *ever* filed would
 * silence the reminder permanently after the first submission.
 */
export const checkSurveyStatus = createAsyncThunk(
  'survey/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/surveys/my-years');
      return {
        currentYearBS: data.currentYearBS,
        hasCurrentYear: data.hasCurrentYear,
        years: data.years || [],
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to check survey status');
    }
  }
);

const surveySlice = createSlice({
  name: 'survey',
  initialState: {
    currentYearBS: getCurrentBsYear(),
    hasCurrentYear: null,
    years: [],
    checking: false,
  },
  reducers: {
    resetSurveyStatus: (state) => {
      state.hasCurrentYear = null;
      state.years = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSurveyStatus.pending, (state) => {
        state.checking = true;
      })
      .addCase(checkSurveyStatus.fulfilled, (state, action) => {
        state.checking = false;
        state.currentYearBS = action.payload.currentYearBS;
        state.hasCurrentYear = action.payload.hasCurrentYear;
        state.years = action.payload.years;
      })
      .addCase(checkSurveyStatus.rejected, (state) => {
        state.checking = false;
        // Fail open — a network error must not nag a farmer who already filed.
        state.hasCurrentYear = true;
      });
  },
});

export const { resetSurveyStatus } = surveySlice.actions;
export default surveySlice.reducer;
