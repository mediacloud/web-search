export const WORDS = 'words';
export const AOT = 'attentionOverTime';
export const TA = 'totalAttention';
export const LANG = 'language';
export const SOURCES = 'sources';

export const getDownloadUrl = (downloadType) => {
  if (downloadType === WORDS) {
    return 'download-top-words-csv';
  }
  if (downloadType === AOT) {
    return 'download-counts-over-time-csv';
  }
  if (downloadType === TA) {
      return 'download-all-content-csv';
    }
  if (downloadType === LANG) {
    return 'download-top-languages-csv';
  }
  if (downloadType === SOURCES) {
    return 'download-top-sources-csv';
  }
};
