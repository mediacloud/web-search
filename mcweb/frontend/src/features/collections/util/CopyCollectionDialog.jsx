import * as React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useCopyCollectionMutation } from '../../../app/services/collectionsApi';

export default function CopyCollectionDialog({
  openDialog, title, collectionId, variant, startIcon,
  confirmButtonText,
}) {
  const navigate = useNavigate();

  const [copyCollection] = useCopyCollectionMutation();

  const [open, setOpen] = React.useState(openDialog);
  const [copyName, setName] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleChange = ({ target: { name, value } }) => (
    setName(value)
  );

  const handleClick = async () => {
    await copyCollection({
      name: copyName || null,
      id: collectionId,
    }).unwrap()
      .then(
        (collection) => navigate(`/collections/${collection.id}`),
      );
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClickOpen}
        startIcon={startIcon}
      >
        Copy Collection
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
            Please enter a name for the copied collection or leave blank to use the original name.
          </DialogContentText>
          <br />
          <TextField
            fullWidth
            id="text"
            name="name"
            label="Name"
            value={copyName}
            onChange={handleChange}
          />
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

CopyCollectionDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  collectionId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  variant: PropTypes.string,
  startIcon: PropTypes.element,
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

CopyCollectionDialog.defaultProps = {
  variant: 'text',
  startIcon: null,
};
