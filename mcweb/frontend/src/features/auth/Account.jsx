import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import { useSnackbar } from 'notistack';
import { useResetTokenMutation, useDeleteUserMutation } from '../../app/services/authApi';
import {
  PermissionedStaff, PermissionedContributor, ROLE_STAFF, isContributor, isApiAccess,
} from './Permissioned';
import { selectCurrentUser, setCredentials } from './authSlice';
import Header from '../ui/Header';
import AlertDialog from '../ui/AlertDialog';
import TaskList from '../tasks/TaskList';
import UserQuotaTable from '../quotas/UserQuotaTable';

function Account() {
  const currentUser = useSelector(selectCurrentUser);
  const [deleteUser] = useDeleteUserMutation();
  const [resetToken] = useResetTokenMutation();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);

  // show the snackbar for 1.25 second and then reload the screen
  const logAndRefresh = (delay) => {
    enqueueSnackbar('Token reset!', { variant: 'success' });
    setTimeout(() => {
      window.location.reload();
    }, delay);
  };

  return (
    <>
      <Header>
        <h1>Profile</h1>
      </Header>
      <div className="container profile">
        <dl>
          <dt>Account Username:</dt>
          <dd>{currentUser.username}</dd>
          <dt>Email:</dt>
          <dd>{currentUser.email}</dd>
          {isApiAccess(currentUser.groupNames) && (
          <div>
            <dt>API Token:</dt>
            <div className="reset-token">
              <dd>{currentUser.token}</dd>
              <Tooltip
                title="Generate a new token"
                sx={{
                  color: 'black',
                }}
              >
                <IconButton
                  onClick={async () => {
                    try {
                      await resetToken(currentUser.id).unwrap();
                      logAndRefresh(1250);
                    } catch (err) {
                      enqueueSnackbar(`Token reset failed - ${err}`, { variant: 'error' });
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          )}

          <PermissionedContributor>
            <dt>Contributor?</dt>
            <dd>{isContributor(currentUser.groupNames) ? 'yes' : 'no'}</dd>
          </PermissionedContributor>

          <PermissionedStaff role={ROLE_STAFF}>
            <dt>Staff?</dt>
            <dd>{currentUser.isStaff ? 'yes' : 'no'}</dd>
            <dt>Super User?</dt>
            <dd>{currentUser.isSuperuser ? 'yes' : 'no'}</dd>
          </PermissionedStaff>
        </dl>
        <Alert severity="error">
          <AlertTitle>Delete Account</AlertTitle>
          <AlertDialog
            outsideTitle="Delete Account"
            title="Delete your account? "
            content="Are you sure you would like to permanently delete your account, all account data and history in our system?
            this cannot be undone. "
            dispatchNeeded={false}
            action={deleteUser}
            actionTarget={currentUser.id}
            snackbar
            snackbarText="Account Deleted!"
            navigateNeeded
            navigateTo="/"
            secondAction={setCredentials}
            onClick={() => setOpen(true)}
            openDialog={open}
            variant="outlined"
            startIcon={<DeleteIcon titleAccess="delete account" />}
            confirmButtonText="Delete"
          />
        </Alert>
        <div className="row" style={{ marginTop: '20px' }}>
          <div className="col-4">
            <Alert severity="info">
              Quota is 4000 hits per week.
            </Alert>
          </div>
        </div>
        <div className="row">
          <div className="col-4">
            <UserQuotaTable currentUser={currentUser} />
          </div>
          <PermissionedContributor>
            <div className="col-4">
              <TaskList completed={false} />
            </div>

            <div className="col-4">
              <TaskList completed />
            </div>
          </PermissionedContributor>
        </div>
      </div>
    </>
  );
}

export default Account;
