import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import prepareQueries from './prepareQueries';
import {
  getDownloadUrl, TA, AOT, WORDS, SOURCES, LANG,
} from './getDownloadUrl';
import TotalAttentionEmailModal from './TotalAttentionEmailModal';

export default function CSVDialog({
  openDialog, queryState, downloadType, outsideTitle, title,
  snackbarText, variant, userEmail, data,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(openDialog);

  const [openTAModal, setOpenTAModal] = useState(false);
  // const query = prepareQueries(queryState);

  const handleDownloadRequest = (queryIndex) => {
    const url = getDownloadUrl(downloadType);
    const querySlice = queryState[queryIndex];
    const query = prepareQueries([querySlice]);
    window.location = `/api/search/${url}?qS=${encodeURIComponent(JSON.stringify(query))}`;
    enqueueSnackbar(snackbarText, { variant: 'success' });
  };

  // const handleDownloadAll = () => {
  //   const url = getDownloadUrl(downloadType);
  //   const queries = prepareQueries(queryState);
  //   // downloadAll(prepareQueries(queryState));
  // };

  const getRelevantCount = (index) => data[index].count.relevant;

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTAClick = () => {
    setOpen(false);
    setOpenTAModal(true);
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClickOpen}
        startIcon={<DownloadIcon />}
      >
        {outsideTitle}
        ...
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
            <table className="col-12">
              <thead>
                <tr className="row">
                  <th className="col-10">Name</th>
                  <th className="col-2">Download</th>
                </tr>
              </thead>
              <tbody>
                {queryState.map((querySlice, i) => (
                  <tr key={querySlice.name} className="row">
                    <td className="col-11">
                      {querySlice.name}
                    </td>
                    <td className="col-1">
                      {(downloadType === TA) && (
                        <TotalAttentionEmailModal
                          title="Download all urls for your query?"
                          content="For a download of this size a zipped csv will need to be sent to you via email"
                          dispatchNeeded={false}
                          navigateTo="/"
                          onClick={() => handleTAClick()}
                          openDialog={openTAModal}
                          querySlice={querySlice}
                          confirmButtonText="Confirm"
                          userEmail={userEmail}
                          totalCountOfQuery={getRelevantCount(i)}
                        />
                      )}
                      {([AOT, WORDS, SOURCES, LANG].includes(downloadType)) && (
                        <IconButton
                          size="sm"
                          aria-label="remove"
                          onClick={() => handleDownloadRequest(i)}
                        >
                          <DownloadIcon sx={{ color: '#d24527' }} />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleClose}
          >
            Cancel
          </Button>
          {/* Additional button to download all CSVs */}
          {/* <Box>
            <Button
              variant="contained"
              onClick={handleDownloadAll}
              autoFocus
            >
              Download All
            </Button>
          </Box> */}
        </DialogActions>
      </Dialog>
    </>
  );
}

CSVDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  outsideTitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  downloadType: PropTypes.string.isRequired,
  snackbarText: PropTypes.string,
  variant: PropTypes.string,
  userEmail: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object),
  queryState: PropTypes.arrayOf(PropTypes.object),
};

CSVDialog.defaultProps = {
  snackbarText: '',
  variant: 'text',
  userEmail: '',
  data: [{}],
};
