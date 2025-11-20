/* eslint-disable no-useless-escape */
import Prism from 'prismjs';

import {
  PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_NEWS_MEDIA_CLOUD,
} from './platforms';

Prism.languages.news = {
  negation: /\b(NOT)\b/,
  keyword: /\b(OR|AND)\b/,
  operator: /\*|\~/,
  punctuation: /"|\(|\)/,
};

const setLanguage = (platform) => {
  let language;
  if (platform === PROVIDER_NEWS_MEDIA_CLOUD || platform === PROVIDER_NEWS_WAYBACK_MACHINE) {
    language = Prism.languages.news;
  } else {
    language = null;
  }
  return language;
};

export default setLanguage;
