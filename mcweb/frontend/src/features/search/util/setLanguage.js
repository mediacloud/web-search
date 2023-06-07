/* eslint-disable no-useless-escape */
import Prism from 'prismjs';

import {
  PROVIDER_TWITTER_TWITTER,
  PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_REDDIT_PUSHSHIFT,
  PROVIDER_YOUTUBE_YOUTUBE,
  PROVIDER_NEWS_MEDIA_CLOUD,
} from './platforms';

Prism.languages.news = {
  keyword: /\b(or|and|OR|AND)\b/,
  negation: /\b(not|NOT)\b/,
  operator: /\*|\~/,
  punctuation: /"|\(|\)/,
};

Prism.languages.reddit = {
  keyword: /\+|\|/,
  negation: /\-/,
  punctuation: /"|\(|\)/,
};

Prism.languages.twitter = {
  keyword: /\b(OR)\b/,
  operator: /#/,
  negation: /\-/,
  punctuation: /\(|\)|"/,
};
Prism.languages.youtube = {
  keyword: /\|/,
  negation: /\-/,
};

const setLanguage = (platform) => {
  let language;
  if (platform === PROVIDER_NEWS_MEDIA_CLOUD || platform === PROVIDER_NEWS_WAYBACK_MACHINE) {
    language = Prism.languages.news;
  } else if (platform === PROVIDER_REDDIT_PUSHSHIFT) {
    language = Prism.languages.reddit;
  } else if (platform === PROVIDER_TWITTER_TWITTER) {
    language = Prism.languages.twitter;
  } else if (platform === PROVIDER_YOUTUBE_YOUTUBE) {
    language = Prism.languages.youtube;
  } else {
    language = null;
  }
  return language;
};

export default setLanguage;
