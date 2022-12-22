import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import dayjs from 'dayjs';
import { useUpdateFeedMutation, useGetFeedQuery } from '../../app/services/feedsApi';

function ModifyFeed() {
  const navigate = useNavigate();
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const feedId = Number(params.feedId); // get collection id from wildcard

  const { data, isLoading } = useGetFeedQuery(feedId);
  const [updateFeed] = useUpdateFeedMutation(feedId);

  // form state for text fields
  const [formState, setFormState] = useState({
    name: '',
    url: '',
    admin_rss_enabled: true,
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const handleCheck = () => (
    setFormState((prev) => ({ ...prev, admin_rss_enabled: !prev.admin_rss_enabled }))
  );

  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id,
        name: data.name,
        url: data.url,
        admin_rss_enabled: data.admin_rss_enabled,
        source: data.source,
        created: dayjs(data.created_at).format(),
        modified: dayjs(data.modified_at).format(),
      };
      setFormState(formData);
    }
  }, [data]);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h2>Edit Feed</h2>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <br />
          <TextField
            label="Name"
            fullWidth
            id="text"
            name="name"
            value={formState.name}
            onChange={handleChange}
          />
          <br />
          <br />
          <TextField
            fullWidth
            label="URL"
            id="outlined-multiline-static"
            name="notes"
            value={formState.url}
            onChange={handleChange}
          />
          <br />
          <br />
          <FormControl>
            <FormControlLabel
              control={<Checkbox onChange={handleCheck} checked={formState.admin_rss_enabled} />}
              label="Admin enabled?"
            />
          </FormControl>
          <br />
          <br />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await updateFeed({
                  feed: formState,
                });
                enqueueSnackbar('Saved changes', { variant: 'success' });
                navigate(`/feeds/${feedId}`);
              } catch (err) {
                const errorMsg = `Failed - ${err.data.message}`;
                enqueueSnackbar(errorMsg, { variant: 'error' });
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModifyFeed;
