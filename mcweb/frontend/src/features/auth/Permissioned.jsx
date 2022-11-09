import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { selectIsLoggedIn, selectCurrentUser } from './authSlice';

export const ROLE_USER = 'USER'; // this is kind of implicit
export const ROLE_STAFF = 'STAFF';
export const ROLE_ADMIN = 'ADMIN';

export default function Permissioned({ children, role }) {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentUser = useSelector(selectCurrentUser);

  let allowed = false;
  if ((role === ROLE_USER) && isLoggedIn) {
    allowed = true;
  } else if ((role === ROLE_STAFF) && currentUser.isStaff) {
    allowed = true;
  } else if ((role === ROLE_ADMIN) && currentUser.isSuperuser) {
    allowed = true;
  }

  return allowed ? children : null;
}

Permissioned.propTypes = {
  children: PropTypes.element.isRequired,
  role: PropTypes.optionalString,
};

Permissioned.defaultProps = {
  role: ROLE_USER,
};
