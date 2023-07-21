import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import { useSnackbar } from 'notistack';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import CheckIcon from '@mui/icons-material/Check';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import {
  useResetTokenMutation, useDeleteUserMutation, useSaveAPIMutation, useGetAPIsQuery,
  useDeleteAPIMutation,
} from '../../app/services/authApi';
import Permissioned, { ROLE_STAFF } from './Permissioned';
import { selectCurrentUser, setCredentials } from './authSlice';
import Header from '../ui/Header';
import AlertDialog from '../ui/AlertDialog';
import TaskList from '../tasks/TaskList';

function Account() {
  const currentUser = useSelector(selectCurrentUser);
  const [deleteUser] = useDeleteUserMutation();
  const [resetToken] = useResetTokenMutation();
  const [deleteKey] = useDeleteAPIMutation();
  const [saveKey] = useSaveAPIMutation();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState([false]);
  const [value, setValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const { data: savedApiList, isLoading } = useGetAPIsQuery();

  const [apiList, setApiList] = useState([]);

  const logAndRefresh = (message, duration, delay) => {
    enqueueSnackbar(message, { variant: 'success', autoHideDuration: duration });
    setTimeout(() => {
      window.location.reload();
    }, delay);
  };

  const handleClick = (event, index) => {
    setValue(index);
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (index, apiName) => {
    const updatedApiList = [...apiList];
    updatedApiList[index].apiName = apiName;
    setApiList(updatedApiList);
    setAnchorEl(null);
  };

  const handleAPIAdd = () => {
    setApiList(() => [...apiList, { apiName: 'API Name', apiKey: 'API Key' }]);
    setEdit(() => [...edit, true]);
  };

  const handleAPIRemove = async (index) => {
    setApiList(apiList.filter((_, i) => i !== index));
    setEdit(edit.filter((_, i) => i !== index));
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
                    logAndRefresh('Token Reset!', 3000, 1250);
                  } catch (err) {
                    enqueueSnackbar(`Token reset failed - ${err}`, { variant: 'error' });
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>

          <Permissioned role={ROLE_STAFF}>
            <dt>Staff?</dt>
            <dd>{currentUser.isStaff ? 'yes' : 'no'}</dd>
            <dt>Super User?</dt>
            <dd>{currentUser.isSuperuser ? 'yes' : 'no'}</dd>
          </Permissioned>

          {/* Saved Users API Keys */}
          {!isLoading && savedApiList.api_keys.map((key) => (
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <dt>{`Saved ${key}`}</dt>
              </div>
              <Box sx={{ marginLeft: '15px' }}>
                <AlertDialog
                  outsideTitle="Delete Key"
                  title="Delete your API Key?"
                  content="Are you sure you would like to delete your API Key?"
                  dispatchNeeded={false}
                  action={deleteKey}
                  actionTarget={{ key }}
                  snackbar={false}
                  snackbarText={`${key} was deleted!`}
                  navigateNeeded
                  navigate="/account"
                  onClick={() => setOpen(true)}
                  openDialog={open}
                  variant="outlined"
                  confirmButtonText="Delete"
                  logAndRefresh={logAndRefresh} // Passing the logAndRefresh function to the component
                />
              </Box>
            </Box>
          ))}
          {/* Creating API Keys */}
          {apiList.map((item, index) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {
                !edit[index] && (
                  <div
                    key={item.key}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <div>
                      <dt>{item.apiName}</dt>
                      <dd>{item.apiKey}</dd>
                    </div>
                    <EditIcon
                      sx={{ marginLeft: '35px' }}
                      onClick={() => {
                        const updatedEdit = [...edit];
                        updatedEdit[index] = true;
                        setEdit(updatedEdit);
                      }}
                    >
                      Edit
                    </EditIcon>
                  </div>
                )
              }
              {/* Edit API Keys */}
              {edit[index] && (
                <div>
                  {/* Dropdown menu for key name options */}
                  <Button
                    onClick={(event) => handleClick(event, index)}
                  >
                    {apiList[index].apiName === 'API Name' ? 'API NAME' : apiList[index].apiName}
                  </Button>
                  <Menu key={apiList[index].apiName + apiList[index].apiKey} anchorEl={anchorEl} open={Boolean(anchorEl)}>
                    <MenuItem onClick={() => handleClose(value, 'Twitter')}>Twitter</MenuItem>
                    <MenuItem onClick={() => handleClose(value, 'Youtube')}>Youtube</MenuItem>
                    <MenuItem onClick={() => handleClose(value, 'Reddit')}>Reddit</MenuItem>
                  </Menu>
                  {/* input for customizing api key */}
                  <input
                    style={{ width: '400px' }}
                    value={apiList[index].apiKey}
                    type="text"
                    onChange={(event) => {
                      const updatedValues = [...apiList];
                      updatedValues[index].apiKey = event.target.value;
                      setApiList(updatedValues);
                    }}
                  />
                  {/* Save API Key */}
                  <CheckIcon
                    sx={{ marginLeft: '35px' }}
                    onClick={async () => {
                      try {
                        await saveKey({ apiData: apiList[index], username: currentUser.username }).unwrap();
                        logAndRefresh(`${apiList[index].apiName} token is saved!`, 3000, 1500);
                        handleAPIRemove(index);
                      } catch (err) {
                        enqueueSnackbar(
                          `Saving API Key Error- ${err.data.error}`,
                          { variant: 'error', autoHideDuration: 5000 },
                        );
                      }
                    }}
                  />
                </div>
              )}
              {/* Remove Key */}
              <RemoveCircleOutlineIcon
                sx={{ marginLeft: '15px' }}
                onClick={() => handleAPIRemove(index)}
              >
                Delete
              </RemoveCircleOutlineIcon>
            </Box>
          ))}
        </dl>

        <Button variant="outlined" color="primary" onClick={handleAPIAdd}>
          Add Service API
        </Button>
        <br />
        <br />
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
        <Permissioned role={ROLE_STAFF}>
          <div className="row">
            <div className="col-6">
              <TaskList completed={false} />
            </div>

            <div className="col-6">
              <TaskList completed />
            </div>
          </div>
        </Permissioned>
      </div>
    </>
  );
}

export default Account;
