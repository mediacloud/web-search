/* eslint-disable no-undef, global-require, react/prop-types */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SourceShow from '../src/features/sources/SourceShow';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ sourceId: '42' }),
  Link: ({ children }) => require('react').createElement('a', null, children),
}));

jest.mock('@mui/material/Box', () => ({ children }) => require('react').createElement('div', null, children));
jest.mock('@mui/material/Tab', () => (props) => require('react').createElement('test-tab', props));
jest.mock('@mui/material/Tabs', () => ({ children, onChange }) => (
  require('react').createElement('test-tabs', { onChange }, children)
));
jest.mock('@mui/material/CircularProgress', () => () => require('react').createElement('test-progress'));

jest.mock('../src/features/auth/Permissioned', () => ({
  PermissionedContributor: ({ children }) => require('react').createElement('div', null, children),
}));
jest.mock('../src/features/ui/TabPanelHelper', () => ({ children, value, index }) => (
  value === index ? require('react').createElement('test-panel', { index }, children) : null
));
jest.mock('../src/features/stories/StoriesOverTime', () => () => require('react').createElement('stories-over-time'));
jest.mock('../src/features/collections/CollectionList', () => () => require('react').createElement('collection-list'));
jest.mock('../src/features/feeds/FeedStories', () => () => require('react').createElement('feed-stories'));
jest.mock('../src/features/stories/RecentlyIndexedStories', () => () => (
  require('react').createElement('recently-indexed-stories')
));
jest.mock('../src/features/ui/StatPanel', () => () => require('react').createElement('stat-panel'));

jest.mock('../src/app/services/sourceApi', () => ({
  useGetSourceQuery: () => ({
    data: {
      id: 42,
      name: 'example.com',
      label: 'Example',
      homepage: 'https://example.com',
      platform: 'online_news',
      alternative_domains: [],
      modified_at: '2026-07-01T00:00:00Z',
    },
    isLoading: false,
  }),
  useListSourcesQuery: () => ({ data: { results: [] }, isLoading: false }),
}));

beforeEach(() => {
  global.document = {
    title: '',
    settings: {
      earliestAvailableDate: '2000-01-01',
      lastMetadataUpdates: {},
    },
  };
});

test('source page separates recently indexed and recently discovered stories', () => {
  let component;
  act(() => {
    component = renderer.create(<SourceShow />);
  });

  const { root } = component;
  expect(root.findAllByType('test-tab').map((tab) => tab.props.label)).toEqual([
    'Collection List',
    'Coverage Over Time',
    'Recently Discovered',
  ]);

  let [panel] = root.findAllByType('test-panel');
  expect(panel.findAllByType('collection-list')).toHaveLength(1);
  expect(panel.findAllByType('recently-indexed-stories')).toHaveLength(1);
  expect(panel.findAllByType('feed-stories')).toHaveLength(0);

  act(() => {
    root.findByType('test-tabs').props.onChange(null, 2);
  });

  [panel] = root.findAllByType('test-panel');
  expect(panel.props.index).toBe(2);
  expect(panel.findAllByType('feed-stories')).toHaveLength(1);
});
