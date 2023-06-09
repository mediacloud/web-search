import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import { TextField } from '@mui/material';
import prepareQueries from '../search/util/prepareQueries';

export default function TotalAttentionEmailModal({
  openDialog, outsideTitle, title, variant, endIcon, confirmButtonText, currentUserEmail, totalCountOfQuery, queryState,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(openDialog);
  const [emailModal, setModalEmail] = useState('');

  const handleEmailChange = ({ target: { name, value } }) => (
    setModalEmail((prev) => ({ ...prev, [name]: value }))
  );

  const handleDownloadRequest = (qs) => {
    window.location = `/api/search/download-all-content-csv?qS=${encodeURIComponent(JSON.stringify(prepareQueries(qs)))}`;
  };

  const sendEmail = (qs, email) => {
    const prepareQuery = prepareQueries(qs);
    fetch('/api/search/send-email-large-download-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Csrftoken': window.CSRF_TOKEN,
      },
      body: JSON.stringify({ prepareQuery, email }),
    })
      .then((response) => {
        console.log(response);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // download button is hit but the count is less than 25k, no need to ask for an email it will download
  const handleClickOpen = () => {
    if (totalCountOfQuery < 25000) {
      enqueueSnackbar('Downloading your data!', { variant: 'success' });
      handleDownloadRequest(queryState);
    } else {
      setOpen(true);
    }
  };

  // if cancel button is hit, sendEmail will use the typed password
  const handleClose = () => {
    if (currentUserEmail) {
      if (totalCountOfQuery >= 25000 && totalCountOfQuery <= 200000) {
        sendEmail(queryState, currentUserEmail);
        enqueueSnackbar(
          `An email will be sent to ${currentUserEmail} with your total attention data!`,
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar('The size of your downloaded data is too large!', { variant: 'error' });
      }
    } else {
      enqueueSnackbar('You do not have an email registered', { variant: 'error' });
    }
    setOpen(false);
  };

  // if submit button is hit, sentEmail will use the typed password
  const handleClick = async () => {
    if (emailModal.email) {
      if (totalCountOfQuery >= 25000 && totalCountOfQuery <= 200000) {
        sendEmail(queryState, emailModal.email);
        enqueueSnackbar(
          `An email will be sent to ${emailModal.email} with your total attention data!`,
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar('The size of your downloaded data is too large!', { variant: 'error' });
      }
    } else {
      enqueueSnackbar('Email is empty', { variant: 'error' });
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClickOpen}
        endIcon={endIcon}
      >
        {outsideTitle}
      </Button>
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
            <TextField
              margin="normal"
              required
              fullWidth
              id="text"
              label="Email"
              name="email"
              autoComplete="Email"
              autoFocus
              onChange={handleEmailChange}
            />
            {' '}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            handleClose();
          }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClick}
            autoFocus
          >
            {confirmButtonText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

TotalAttentionEmailModal.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  outsideTitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  // action: PropTypes.func.isRequired,
  // actionTarget: PropTypes.oneOfType([PropTypes.object, PropTypes.bool, PropTypes.number]).isRequired,
  // dispatchNeeded: PropTypes.bool.isRequired,
  // snackbar: PropTypes.bool,
  // snackbarText: PropTypes.string,
  variant: PropTypes.string,
  endIcon: PropTypes.element,
  // navigateNeeded: PropTypes.bool,
  // navigateTo: PropTypes.string,
  // secondAction: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  currentUserEmail: PropTypes.string,
  totalCountOfQuery: PropTypes.number,
  queryState: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,

};

TotalAttentionEmailModal.defaultProps = {
  // snackbar: false,
  // snackbarText: '',
  variant: 'text',
  endIcon: null,
  // navigateNeeded: false,
  // navigateTo: '',
  // secondAction: null,
  currentUserEmail: '',
  totalCountOfQuery: 0,

};
