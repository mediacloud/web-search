import React, { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DownloadIcon from '@mui/icons-material/Download';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import prepareQueries from './prepareQueries';
import { useSendTotalAttentionDataEmailMutation } from '../../../app/services/searchApi';

export default function TotalAttentionEmailModal({
  openDialog, title, confirmButtonText, currentUserEmail, totalCountOfQuery, querySlice
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [sendTotalAttentionDataEmail] = useSendTotalAttentionDataEmailMutation();
  const [open, setOpen] = useState(openDialog);
  const [emailModal, setModalEmail] = useState('');

  const handleEmailChange = ({ target: { name, value } }) => (
    setModalEmail((prev) => ({ ...prev, [name]: value }))
  );

  const handleDownloadRequest = () => {
    window.location = `/api/search/download-all-content-csv?qS=${encodeURIComponent(JSON.stringify(prepareQueries([querySlice])))}`;
  };

  // download button is hit but the count is less than 25k, no need to ask for an email it will download
  const handleClickOpen = () => {
    if (totalCountOfQuery < document.settings.allUrlsCsvEmailMin) {
      enqueueSnackbar('Downloading your data!', { variant: 'success' });
      handleDownloadRequest([querySlice]);
    } else if (!currentUserEmail) {
      enqueueSnackbar('You do not have an email registered, please input an email', { variant: 'error' });
      setOpen(true);
    } else {
      setOpen(true);
    }
  };

  // if cancel button is hit, sendEmail will use the typed password
  const handleClose = () => {
    if (currentUserEmail) {
      if (totalCountOfQuery >= document.settings.allUrlsCsvEmailMin &&
	  totalCountOfQuery <= document.settings.allUrlsCsvEmailMax) {
        sendTotalAttentionDataEmail({
          prepareQuery: prepareQueries([querySlice]),
          email: currentUserEmail,
        }).unwrap();
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
      if (totalCountOfQuery >= document.settings.allUrlsCsvEmailMin &&
	  totalCountOfQuery <= document.settings.allUrlsCsvEmailMax) {
        sendTotalAttentionDataEmail({
          prepareQuery: prepareQueries([querySlice]),
          email: emailModal.email,
        }).unwrap();

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

  const cancelClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={() => handleClickOpen()}
      >
        <DownloadIcon sx={{ color: '#d24527' }} />
      </IconButton>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            cancelClose();
          } else {
            handleClose();
          }
        }}
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
        <DialogActions sx={{ justifyContent: 'space-between' }}>

          {/* Cancel / Destructive */}
          <Button
            variant="outlined"
            onClick={cancelClose}
            sx={{ alignSelf: 'flex-start' }}
          >
            Cancel
          </Button>

          <Box>
            {/* Secondary Action */}
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ marginRight: '10px' }}
            >
              Use Current Email
            </Button>

            {/* Primary Action */}
            <Button
              variant="contained"
              onClick={handleClick}
            >
              {confirmButtonText}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}

TotalAttentionEmailModal.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  variant: PropTypes.string,
  endIcon: PropTypes.element,
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  currentUserEmail: PropTypes.string,
  totalCountOfQuery: PropTypes.number,
  querySlice: PropTypes.object.isRequired,
};

TotalAttentionEmailModal.defaultProps = {
  variant: 'text',
  endIcon: null,
  currentUserEmail: '',
  totalCountOfQuery: 0,
};
