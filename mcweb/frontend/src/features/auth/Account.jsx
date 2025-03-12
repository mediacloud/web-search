import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
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
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [deleteUser] = useDeleteUserMutation();
  const [resetToken] = useResetTokenMutation();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

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
          {!isApiAccess(currentUser.groupNames) && (
          <div style={{ marginBottom: '20px' }}>
            <dt>API Access:</dt>
            <Button
              onClick={() => setOpenDialog(true)}
              variant="outlined"
            >
              Request API Access...
            </Button>
            <Dialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
            >
              <DialogTitle id="alert-dialog-title">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Click to Request API Access
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                  In order to request API Access please first verify you are a human by clicking confirm,
                  completing the captcha, and then please wait while an email is sent with a verification code.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button onClick={() => navigate('/verify-user')}>Confirm</Button>
              </DialogActions>
            </Dialog>
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
            actionTarget={currentUser}
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
