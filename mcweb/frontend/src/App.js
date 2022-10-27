import React from 'react';
import {Route, Navigate, useLocation, Routes} from 'react-router-dom';
import { useSelector } from 'react-redux';

import Header from './features/header/Header';
import Footer from './features/footer/Footer';

// user status
import Account from './features/auth/Account';
import SignIn from './features/auth/SignIn';
import SignUp from './features/auth/SignUp';
import ResetPassword from './features/auth/ResetPassword';
import ConfirmedReset from './features/auth/ConfirmedReset';

// pages
import Collections from './features/collections/CollectionShow';
import FeaturedCollections from './features/collections/FeaturedCollections';
import CreateCollection from './features/collections/CreateCollection';
import Search from './features/search/Search';
import SourceHome from './features/sources/SourceHome';
import SourceShow from './features/sources/SourceShow';

//modify pages
import ModifyCollection from './features/collections/ModifyCollection';
import ModifySource from './features/sources/ModifySource';

import { selectIsLoggedIn } from './features/auth/authSlice';

const App = () => {
  return (
    <>
      <Header />
      <div id="content">
        <Routes>
             <Route path="collections/:collectionId/modify-collection" element={
              <RequireAuth>
                <ModifyCollection />
              </RequireAuth>} />

            <Route path="collections/:collectionId" element={
              <RequireAuth>
                <Collections />
              </RequireAuth>}
            />

            <Route path="collections/create" element={
              <RequireAuth>
                <CreateCollection />
              </RequireAuth>}
            />

            <Route path="collections" element={
              <RequireAuth>
                <FeaturedCollections />
              </RequireAuth>}
            />

            <Route path="search" element={
              <RequireAuth>
                <Search />
              </RequireAuth>} />

            <Route path="sources/:sourceId/modify-source" element={
              <RequireAuth>
                <ModifySource />
              </RequireAuth>} />

            <Route path="sources/:sourceId" element={
              <RequireAuth>
                <SourceShow />
              </RequireAuth>} />

            <Route path="sources" element={
              <RequireAuth>
                <SourceHome />
              </RequireAuth>} />

            <Route path="sign-in" element={<SignIn />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="reset-password/confirmed" element={<ConfirmedReset />} />

            <Route path="sign-up" element={<SignUp />} />
            <Route path="account" element={
              <RequireAuth>
                <Account />
              </RequireAuth>} />

        </Routes>
      </div>
      <Footer />
    </>
  );
};

function RequireAuth({ children }) {
  const auth = useSelector(selectIsLoggedIn);
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }
  return children;
}

export default App;
