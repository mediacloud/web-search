import * as React from 'react';
import Button from '@mui/material/Button';
import { useParams, Link } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import SourceHeader from './SourceHeader';
import CollectionList from '../collections/CollectionList';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import StatPanel from '../ui/StatPanel';

export default function SourceShow() {
  const params = useParams();
  const sourceId = Number(params.sourceId);

  const {
    data,
    isLoading,
  } = useGetSourceQuery(sourceId);

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <>

      <SourceHeader sourceId={sourceId} />

      <div className="sub-feature">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <Permissioned role={ROLE_STAFF}>
                <Button variant="outlined" component={Link} to="modify-source">
                  Modify Source
                  <p>{data.notes}</p>
                </Button>
              </Permissioned>
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        <StatPanel items={[
          { label: 'First Story', value: data.first_story },
          { label: 'Stories per Week', value: data.stories_per_week },
          { label: 'Publication Country', value: data.pub_country },
          { label: 'Publication State', value: data.pub_state },
          { label: 'Primary Language', value: data.primary_language },
          { label: 'Media Type', value: data.media_type },
        ]}
        />

        <div className="row">
          <div className="col-6">
            <CollectionList sourceId={sourceId} />
          </div>
        </div>

      </div>

    </>
  );
}
