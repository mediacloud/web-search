import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { selectIsLoggedIn, selectCurrentUser } from './authSlice';

export const ROLE_USER = 'USER'; // this is kind of implicit
export const ROLE_STAFF = 'STAFF';
export const ROLE_ADMIN = 'ADMIN';
export const ROLE_CONTRIBUTOR = 'CONTRIBUTOR';

export const isContributor = (userGroups) => userGroups.includes(ROLE_CONTRIBUTOR.toLocaleLowerCase());

export function PermissionedStaff({ children, role }) {
  const isLoggedIn = useSelector(selectIsLoggedIn); // will be undefined if not logged in
  const currentUser = useSelector(selectCurrentUser); // will be undefined if not logged in

  let allowed = false;
  if ((role === ROLE_USER) && isLoggedIn) {
    allowed = true;
  } else if ((role === ROLE_STAFF) && isLoggedIn
    && (currentUser.isStaff || currentUser.isSuperuser)) {
    allowed = true;
  } else if ((role === ROLE_ADMIN) && isLoggedIn && currentUser.isSuperuser) {
    allowed = true;
  }

  return allowed ? children : null;
}

export function PermissionedContributor({ children }) {
  const isLoggedIn = useSelector(selectIsLoggedIn); // will be undefined if not logged in
  const currentUser = useSelector(selectCurrentUser); // will be undefined if not logged in
  const userGroups = currentUser.groupNames;
  const contributor = isContributor(userGroups);
  let allowed = false;
  if ((contributor) && isLoggedIn) {
    allowed = true;
  } else if ((contributor && isLoggedIn)
    || (currentUser.isStaff || currentUser.isSuperuser)) {
    allowed = true;
  }

  return allowed ? children : null;
}

PermissionedStaff.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
  role: PropTypes.string,
};

PermissionedStaff.defaultProps = {
  role: ROLE_USER,
};

PermissionedContributor.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
  role: PropTypes.string,
};

PermissionedContributor.defaultProps = {
  role: ROLE_USER,
};
