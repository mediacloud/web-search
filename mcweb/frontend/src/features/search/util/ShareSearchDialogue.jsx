import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import { ContentCopy, IosShare } from '@mui/icons-material';

export default function ShareSearchDialogue() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleShare = e => {
    e.preventDefault()
    const ahref = window.location.href
    switch (e.currentTarget.id) {

      case "copy":
        navigator.clipboard.writeText(ahref)
        break
      
      default:
        break
    }
  }
  
  return (
    <div>
      
      <Button 
      onClick={handleClickOpen}
      className="float-end"
      variant="contained"
      // need to disable the show 
      endIcon={<IosShare />}>
        Share this Search
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Share this Search
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description"> 
          <code> {window.location.href} </code>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
        
        <Button 
          variant="outlined" 
          startIcon={<ContentCopy />}
          id="copy"
          onClick={handleShare}
      > copy</Button>
        <Button variant="contained" onClick={handleClose} > Close </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
