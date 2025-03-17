import { PARTISAN, GLOBAL } from './generateComparativeQuery';

const PARTISAN_COLORS = ['#4D1AF1', '#C1B0F7', '#A211BD', '#F58B8B', '#E80C0C'];
const GLOBAL_COLORS = ['#b22033', '#032169', '#008751', '#ffc400', '#000000', '#F3EFEF', '#009b3a', '#ff9933'];
const DEFAULT_COLORS = ['#2f2d2b', '#d24527', '#f7a44e', '#334cda', '#d23716', '#b22033', '#032169', '#008751', '#ffc400'];

const getQueryType = (queryState) => {
  const queryLength = queryState.length;
  const firstName = queryState[0].name;

  if (queryLength === 5 && firstName === 'left') {
    return PARTISAN;
  } if (queryLength === 8 && firstName === 'united states') {
    return GLOBAL;
  }
  return null;
};

export default function getColors(queryState) {
  const queryType = getQueryType(queryState);
  if (queryType && (queryType === PARTISAN)) {
    return PARTISAN_COLORS;
  } if (queryType && (queryType === GLOBAL)) {
    return GLOBAL_COLORS;
  }
  return DEFAULT_COLORS;
}

// Partisan
// [left, center left, center, center right, right]

// Global
// [us, uk, nigeria, spain, germany, france, brazil, india]
