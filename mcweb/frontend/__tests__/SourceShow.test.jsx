/* eslint-disable no-undef, global-require, react/prop-types */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SourceShow from '../src/features/sources/SourceShow';

let mockPlatform = 'online_news';
let mockSourceId = '42';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ sourceId: mockSourceId }),
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
      platform: mockPlatform,
      alternative_domains: [],
      modified_at: '2026-07-01T00:00:00Z',
    },
    isLoading: false,
  }),
  useListSourcesQuery: () => ({ data: { results: [] }, isLoading: false }),
}));

beforeEach(() => {
  mockPlatform = 'online_news';
  mockSourceId = '42';
  global.document = {
    title: '',
    settings: {
      earliestAvailableDate: '2000-01-01',
      lastMetadataUpdates: {},
    },
  };
});

test('online news source has collection, recent stories, and coverage tabs', () => {
  let component;
  act(() => {
    component = renderer.create(<SourceShow />);
  });

  const { root } = component;
  expect(root.findAllByType('test-tab').map((tab) => tab.props.label)).toEqual([
    'Collection List',
    'Recent Stories',
    'Coverage Over Time',
  ]);
  expect(root.findAllByType('test-tab').map((tab) => tab.props.id)).toEqual([
    'simple-tab-0',
    'simple-tab-1',
    'simple-tab-2',
  ]);

  expect(root.findAllByType('test-panel')).toHaveLength(1);
  let [panel] = root.findAllByType('test-panel');
  expect(panel.props.index).toBe(0);
  expect(panel.findAllByType('collection-list')).toHaveLength(1);
  expect(panel.findByType('collection-list').parent.parent.props.className).toBe('col-12');
  expect(panel.findAllByType('recently-indexed-stories')).toHaveLength(0);
  expect(panel.findAllByType('feed-stories')).toHaveLength(0);

  act(() => {
    root.findByType('test-tabs').props.onChange(null, 1);
  });

  expect(root.findAllByType('test-panel')).toHaveLength(1);
  [panel] = root.findAllByType('test-panel');
  expect(panel.props.index).toBe(1);
  expect(panel.findAllByType('collection-list')).toHaveLength(0);
  const [leftColumn, rightColumn] = panel.findAllByProps({ className: 'col-6' });
  expect(leftColumn.findAllByType('recently-indexed-stories')).toHaveLength(1);
  expect(rightColumn.findAllByType('feed-stories')).toHaveLength(1);

  act(() => {
    root.findByType('test-tabs').props.onChange(null, 2);
  });

  expect(root.findAllByType('test-panel')).toHaveLength(1);
  [panel] = root.findAllByType('test-panel');
  expect(panel.props.index).toBe(2);
  expect(panel.findAllByType('stories-over-time')).toHaveLength(1);
});

test('other source has collection and coverage tabs', () => {
  mockPlatform = 'other';
  let component;
  act(() => {
    component = renderer.create(<SourceShow />);
  });

  const { root } = component;
  expect(root.findAllByType('test-tab').map((tab) => tab.props.label)).toEqual([
    'Collection List',
    'Coverage Over Time',
  ]);
  expect(root.findAllByType('test-tab').map((tab) => tab.props.id)).toEqual([
    'simple-tab-0',
    'simple-tab-1',
  ]);

  act(() => {
    root.findByType('test-tabs').props.onChange(null, 1);
  });

  expect(root.findAllByType('test-panel')).toHaveLength(1);
  const [panel] = root.findAllByType('test-panel');
  expect(panel.props.index).toBe(1);
  expect(panel.findAllByType('stories-over-time')).toHaveLength(1);
  expect(panel.findAllByType('recently-indexed-stories')).toHaveLength(0);
  expect(panel.findAllByType('feed-stories')).toHaveLength(0);
});

test('changing source resets the selected tab to Collection List', () => {
  let component;
  act(() => {
    component = renderer.create(<SourceShow />);
  });

  const { root } = component;
  act(() => {
    root.findByType('test-tabs').props.onChange(null, 2);
  });
  expect(root.findAllByType('test-panel')).toHaveLength(1);
  expect(root.findByType('test-panel').props.index).toBe(2);

  act(() => {
    mockSourceId = '43';
    mockPlatform = 'other';
    component.update(<SourceShow />);
  });

  expect(root.findAllByType('test-panel')).toHaveLength(1);
  const panel = root.findByType('test-panel');
  expect(panel.props.index).toBe(0);
  expect(panel.findAllByType('collection-list')).toHaveLength(1);
});
