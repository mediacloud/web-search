import * as React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import prepareQueries from '../util/prepareQueries';
import { getDownloadUrl } from '../util/getDownloadUrl';
import { useDownloadAllQueriesMutation } from '../../../app/services/searchApi';

export default function CSVDialog({
  openDialog, queryState, downloadType, outsideTitle, title,
  snackbar, snackbarText, variant,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [downloadAll, { isLoading }] = useDownloadAllQueriesMutation();

  const [open, setOpen] = React.useState(openDialog);

  // const query = prepareQueries(queryState);

  const handleDownloadRequest = (queryIndex) => {
    const url = getDownloadUrl(downloadType);
    const querySlice = queryState[queryIndex];
    const query = prepareQueries([querySlice]);

    window.location = `/api/search/${url}?qS=${encodeURIComponent(JSON.stringify(query))}`;
  };

  const handleDownloadAll = () => {
    console.log(prepareQueries(queryState));
    downloadAll(prepareQueries(queryState));
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = async () => {
    if (snackbar) {
      enqueueSnackbar(snackbarText, { variant: 'success' });
    }
    handleClose();
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
                  <th className="col-8">Name</th>
                  <th className="col-4">Download</th>
                </tr>
              </thead>
              <tbody>
                {queryState.map((querySlice, i) => (
                  <tr key={querySlice.name} className="row">
                    <td className="col-8">
                      {querySlice.name}
                    </td>
                    <td className="col-4">
                      <IconButton
                        size="sm"
                        aria-label="remove"
                        onClick={() => handleDownloadRequest(i)}
                      >
                        <DownloadIcon sx={{ color: '#d24527' }} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DialogContentText>
        </DialogContent>
        <DialogActions>

          {/* Additional button to download all CSVs */}
          <Button
            variant="outlined"
            onClick={handleClose}

          >
            Cancel
          </Button>
          <Box>
            <Button
              variant="contained"
              onClick={handleDownloadAll}
              autoFocus
            >
              Download All
            </Button>
          </Box>
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
  snackbar: PropTypes.bool,
  snackbarText: PropTypes.string,
  variant: PropTypes.string,
};

CSVDialog.defaultProps = {
  snackbar: false,
  snackbarText: '',
  variant: 'text',
};
