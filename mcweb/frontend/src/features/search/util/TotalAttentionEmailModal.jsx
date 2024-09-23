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
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import prepareQueries from './prepareQueries';
import { useSendTotalAttentionDataEmailMutation } from '../../../app/services/searchApi';

export default function TotalAttentionEmailModal({
  openDialog, title, content, confirmButtonText, userEmail, totalCountOfQuery, querySlice,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [sendTotalAttentionDataEmail] = useSendTotalAttentionDataEmailMutation();
  const [open, setOpen] = useState(openDialog);

  const handleDownloadRequest = () => {
    window.location = `/api/search/download-all-content-csv?qS=${
      encodeURIComponent(JSON.stringify(prepareQueries([querySlice])))}`;
  };

  // download button is hit but the count is less than 25k, no need to ask for an email it will download
  const handleClickOpen = () => {
    if (totalCountOfQuery < 25000) {
      enqueueSnackbar('Downloading your data!', { variant: 'success' });
      handleDownloadRequest([querySlice]);
    } else {
      setOpen(true);
    }
  };

  // if cancel button is hit, sendEmail will use the typed password
  const handleClose = () => {
    if (userEmail) {
      if (totalCountOfQuery >= 25000 && totalCountOfQuery <= 200000) {
        sendTotalAttentionDataEmail({
          prepareQuery: prepareQueries([querySlice]),
          email: userEmail,
        }).unwrap();
        enqueueSnackbar(
          `An email will be sent to ${userEmail} with your total attention data!`,
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
            {content}
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
            {/* Primary Action */}
            <Button
              variant="contained"
              onClick={handleClose}
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
  content: PropTypes.string.isRequired,
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  userEmail: PropTypes.string,
  totalCountOfQuery: PropTypes.number,
  querySlice: PropTypes.object.isRequired,
};

TotalAttentionEmailModal.defaultProps = {
  userEmail: '',
  totalCountOfQuery: 0,
};
