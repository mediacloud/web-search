import React, { useState, useEffect } from 'react';
import {
  Route, Navigate, useLocation, Routes, useSearchParams
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Homepage from './features/homepage/Homepage';

import Header from './features/header/Header';
import Footer from './features/footer/Footer';

// user status
import Account from './features/auth/Account';
import SignIn from './features/auth/SignIn';
import SignUp from './features/auth/SignUp';
import ResetPassword from './features/auth/ResetPassword';
import ConfirmedReset from './features/auth/ConfirmedReset';
import BadURL from './app/badURL/BadURL';
// pages
import CollectionShow from './features/collections/CollectionShow';
import DirectoryHome from './features/directory/DirectoryHome';
import CreateCollection from './features/collections/CreateCollection';
import CreateSource from './features/sources/CreateSource';
import CollectionHeader from './features/collections/CollectionHeader';
import GeographicNewsCollections from './features/collections/GeographicNewsCollections';
import Search from './features/search/Search';
import SourceShow from './features/sources/SourceShow';
import ListSourceFeeds from './features/sources/ListSourceFeeds';
import CreateFeed from './features/feeds/CreateFeed';
import ModifyFeed from './features/feeds/ModifyFeed';
import FeedHeader from './features/feeds/FeedHeader';
import FeedShow from './features/feeds/FeedShow';
import SourceHeader from './features/sources/SourceHeader';

import ModifyCollection from './features/collections/ModifyCollection';
import ModifySource from './features/sources/ModifySource';
import { selectIsLoggedIn } from './features/auth/authSlice';
import setSearchQuery from './features/search/util/setSearchQuery';


function App() {
  const { lastSearchTime } = useSelector((state) => state.query);
  const [searchParams] = useSearchParams();
  const [trigger, setTrigger] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    if (trigger && searchParams.get('start')) {
      setSearchQuery(searchParams, dispatch);
      setTrigger(false);
    }
  }, [lastSearchTime]);

  return (
    <>
      <Header />
      <div id="content">
        <Routes>
          <Route index element={<Homepage />} />

          <Route
            path="directory"
            element={(
              <RequireAuth>
                <DirectoryHome />
              </RequireAuth>
            )}
          />

          <Route
            path="collections"
            element={(
              <RequireAuth>
                <CollectionHeader />
              </RequireAuth>
            )}
          >

            <Route
              path=":collectionId"
              element={(
                <RequireAuth>
                  <CollectionShow />
                </RequireAuth>
            )}
            />
            <Route
              path=":collectionId/edit"
              element={(
                <RequireAuth>
                  <ModifyCollection />
                </RequireAuth>
            )}
            />

          </Route>
          <Route
            path="collections/create"
            element={(
              <RequireAuth>
                <CreateCollection />
              </RequireAuth>
            )}
          />
          <Route
            path="collections/news/geographic"
            element={(
              <RequireAuth>
                <GeographicNewsCollections />
              </RequireAuth>
            )}
          />
          <Route
            path="search"
            element={(
              <RequireAuth>
                <Search />
              </RequireAuth>
            )}
          />

          <Route
            path="sources"
            element={(
              <RequireAuth>
                <SourceHeader />
              </RequireAuth>
            )}
          >
            <Route
              path=":sourceId"
              element={(
                <RequireAuth>
                  <SourceShow />
                </RequireAuth>
              )}
            />
            <Route
              path=":sourceId/feeds"
              element={(
                <RequireAuth>
                  <ListSourceFeeds />
                </RequireAuth>
              )}
            />
            <Route
              path=":sourceId/edit"
              element={(
                <RequireAuth>
                  <ModifySource />
                </RequireAuth>
                )}
            />
            <Route
              path=":sourceId/feeds/create"
              element={(
                <RequireAuth>
                  <CreateFeed />
                </RequireAuth>
              )}
            />
          </Route>
          <Route
            path="sources/create"
            element={(
              <RequireAuth>
                <CreateSource />
              </RequireAuth>
            )}
          />

          <Route
            path="feeds"
            element={(
              <RequireAuth>
                <FeedHeader />
              </RequireAuth>
            )}
          >
            <Route
              path=":feedId"
              element={(
                <RequireAuth>
                  <FeedShow />
                </RequireAuth>
              )}
            />
            <Route
              path=":feedId/edit"
              element={(
                <RequireAuth>
                  <ModifyFeed />
                </RequireAuth>
              )}
            />
          </Route>

          <Route path="sign-in" element={<SignIn />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="reset-password/confirmed" element={<ConfirmedReset />} />

          <Route path="sign-up" element={<SignUp />} />
          <Route
            path="account"
            element={(
              <RequireAuth>
                <Account />
              </RequireAuth>
            )}
          />

          <Route
            path="*"
            element={<BadURL />}
          />

        </Routes>
      </div>
      <Footer />
    </>
  );
}

function RequireAuth({ children }) {
  const auth = useSelector(selectIsLoggedIn);
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }
  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.element.isRequired,
};

export default App;
