import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { selectIsLoggedIn, selectCurrentUser } from './authSlice';

export const ROLE_USER = 'USER'; // this is kind of implicit
export const ROLE_STAFF = 'STAFF';
export const ROLE_ADMIN = 'ADMIN';

export default function Permissioned({ children, role }) {
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

Permissioned.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
  role: PropTypes.string,
};

Permissioned.defaultProps = {
  role: ROLE_USER,
};
