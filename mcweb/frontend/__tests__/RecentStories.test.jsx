/* eslint-disable no-undef */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import RecentlyIndexedStories from '../src/features/stories/RecentlyIndexedStories';
import FeedStories from '../src/features/feeds/FeedStories';
import { useGetRecentlyIndexedStoriesQuery } from '../src/app/services/searchApi';

jest.mock('../src/app/services/searchApi', () => ({
  useGetRecentlyIndexedStoriesQuery: jest.fn(() => ({ data: { stories: [] }, isLoading: false })),
}));
jest.mock('../src/app/services/feedsApi', () => ({
  useListStoriesQuery: () => ({ data: { stories: [] }, isLoading: false }),
}));
jest.mock('../src/features/search/util/platforms', () => ({
  PROVIDER_NEWS_MEDIA_CLOUD: 'onlinenews-mediacloud',
  earliestAllowedStartDate: () => ({ format: () => '2000-01-01' }),
  latestAllowedEndDate: () => ({ format: () => '2026-07-19' }),
}));

test('recently indexed heading and query use the default window', () => {
  let component;
  act(() => {
    component = renderer.create(<RecentlyIndexedStories sourceId={42} />);
  });

  expect(component.root.findByType('h1').children).toEqual(['Stories indexed in the last 90 days']);
  expect(useGetRecentlyIndexedStoriesQuery).toHaveBeenCalledWith({
    sourceId: 42,
    dayWindow: 90,
    startDate: '2000-01-01',
    endDate: '2026-07-19',
  });
});

test('recently indexed heading and query use a custom window', () => {
  let component;
  act(() => {
    component = renderer.create(<RecentlyIndexedStories sourceId={42} dayWindow={30} />);
  });

  expect(component.root.findByType('h1').children).toEqual(['Stories indexed in the last 30 days']);
  expect(useGetRecentlyIndexedStoriesQuery).toHaveBeenCalledWith(expect.objectContaining({ dayWindow: 30 }));
});

test.each([false, true])('discovered stories heading and note render with feed=%s', (feed) => {
  let component;
  act(() => {
    component = renderer.create(<FeedStories feed={feed} feedId={7} sourceId={42} />);
  });

  const heading = component.root.findByType('h1');
  expect(heading.children).toEqual(['Latest Discovered Stories']);
  const note = [
    'The URLs for these stories have been recently discovered, but might not show up in',
    'search results yet because that can take a few hours.',
  ].join(' ');
  expect(heading.parent.children[1].children).toEqual([
    note,
  ]);
});
