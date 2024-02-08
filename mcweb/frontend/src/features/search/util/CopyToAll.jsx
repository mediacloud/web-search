import * as React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';

export default function CopyToAll({
  openDialog, title, content, action, actionTarget, dispatchNeeded,
  snackbar, snackbarText, confirmButtonText,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = React.useState(openDialog);

  const dispatch = useDispatch();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = async () => {
    if (dispatchNeeded) {
      try {
        await dispatch(action(actionTarget));
      } catch (error) {
        enqueueSnackbar(error, { variant: 'error' });
      }
    } else {
      action(actionTarget);
    }
    if (snackbar) {
      enqueueSnackbar(snackbarText, { variant: 'success' });
    }
    handleClose();
  };

  return (
    <>
      <div
        style={{
          color: '#d24527', fontSize: '12px', marginLeft: '3px', cursor: 'pointer',
        }}
        onClick={handleClickOpen}
      >
        &gt;&gt;
      </div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleClose}

          >
            Cancel
          </Button>
          <Box>
            <Button
              variant="contained"
              onClick={handleClick}
              autoFocus
            >
              {confirmButtonText}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}

CopyToAll.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  action: PropTypes.func.isRequired,
  actionTarget: PropTypes.oneOfType([PropTypes.object, PropTypes.bool, PropTypes.number]).isRequired,
  dispatchNeeded: PropTypes.bool.isRequired,
  snackbar: PropTypes.bool,
  snackbarText: PropTypes.string,
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

CopyToAll.defaultProps = {
  snackbar: false,
  snackbarText: '',
};
