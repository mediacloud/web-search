import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import { useSnackbar } from 'notistack';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  useResetTokenMutation,
  useDeleteUserMutation,
  useGetUserSecretsMutation,
  useCreateUserSecretMutation,
  useUpdateUserSecretMutation,
  useDeleteUserSecretMutation,
} from '../../app/services/authApi';
import Permissioned, { ROLE_STAFF } from './Permissioned';
import { selectCurrentUser, setCredentials } from './authSlice';
import Header from '../ui/Header';
import AlertDialog from '../ui/AlertDialog';
import TaskList from '../tasks/TaskList';
import { platformDisplayName, mask } from '../ui/uiUtil';

function Account() {
  const currentUser = useSelector(selectCurrentUser);
  const [deleteUser] = useDeleteUserMutation();
  const [resetToken] = useResetTokenMutation();
  const { enqueueSnackbar } = useSnackbar();

  const logAndRefresh = (delay) => {
    enqueueSnackbar('Token reset!', { variant: 'success' });
    setTimeout(() => {
      window.location.reload();
    }, delay);
  };

  // const { data: apiListData } = useGetUserSecretsMutation();
  // const [createUserSecret] = useCreateUserSecretMutation();
  // const [updateUserSecret] = useUpdateUserSecretMutation();
  // const [deleteUserSecret] = useDeleteUserSecretMutation();
  const [open, setOpen] = useState(false);

  const [edit, setEdit] = useState([false]);
  const [apiList, setApiList] = useState([
    {
      apiName: 'twitter',
      apiValue: 'b3ca728ebdf19dca0f221b6b0d6e3c1fcd356879kkkjkj',
    },
  ]);

  const handleAPIAdd = () => {
    const list = [...apiList];
    list.push({ apiName: '', apiValue: '' });
    setApiList(list);
  };

  console.log(apiList);
  // const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }));

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

          <Permissioned role={ROLE_STAFF}>
            <dt>Staff?</dt>
            <dd>{currentUser.isStaff ? 'yes' : 'no'}</dd>
            <dt>Super User?</dt>
            <dd>{currentUser.isSuperuser ? 'yes' : 'no'}</dd>
          </Permissioned>

          {apiList.map((item) => (
            <div key={item.apiName} style={{ display: 'flex', alignItems: 'center' }}>
              <div>
                <div>
                  <dt>
                    {item.apiName}
                  </dt>
                  <dd>{mask(item.apiValue, 8, '*')}</dd>
                </div>
              </div>
              <div style={{ paddingLeft: '25px' }}>
                <EditIcon
                  style={{ marginRight: '15px' }}
                  onClick={() => { console.log('edit'); }}
                >
                  Edit
                </EditIcon>
                <RemoveCircleOutlineIcon
                  onClick={() => { console.log('delete'); }}
                >
                  Delete
                </RemoveCircleOutlineIcon>
              </div>
            </div>
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
        {/* Modal For Updating or Adding API */}

      </div>
    </>
  );
}

export default Account;

// <Dialog
//   open={openAPI}
//   onClose={handleCloseAPI}
//   maxWidth="md"
//   fullWidth
// >
//   <DialogTitle>
//     {editedApiElement ? 'Update' : 'Add'}
//     {' '}
//     Service Specific API key
//   </DialogTitle>
//   <DialogContent>
//     <br />
//     <FormControl fullWidth>
//       <InputLabel id="type-select-label">Select API type</InputLabel>
//       <Select
//         labelId="type-select-label"
//         id="type-select"
//         name="apiName"
//         label="Select API type"
//         value={formState.apiName}
//         onChange={handleChange}
//       >
//         <MenuItem value="twitter">
//           {platformDisplayName('twitter')}
//         </MenuItem>
//         <MenuItem value="youtube">
//           {platformDisplayName('youtube')}
//         </MenuItem>
//       </Select>
//     </FormControl>
//     <br />
//     <br />
//     <TextField
//       name="apiValue"
//       label="API"
//       value={formState.apiValue}
//       onChange={handleChange}
//       fullWidth
//     />
//   </DialogContent>
//   <DialogActions>
//     <Button onClick={handleCloseAPI}>Cancel</Button>
//     <Button onClick={handleSubmitAPI}>Confirm</Button>
//   </DialogActions>
// </Dialog>
