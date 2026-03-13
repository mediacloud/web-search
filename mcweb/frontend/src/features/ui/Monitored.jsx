import React from 'react';
import PropTypes from 'prop-types';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

// Phil writes: Forgive me, for I know not what I do!  REALLY! No clue
// whatsoever!!  I wanted to create a component that hides the name of
// the MUI icon, color and hover text being used to decorate monitored
// collections and sources.  It _seems_ to work!

export default function Monitored({ fontSize, type }) {
    // type is "source" or "collection", if needed to vary more verbose hover text
    return <QueryStatsIcon color="success" titleAccess="monitored" fontSize={fontSize} />
}

Monitored.propTypes = {
  type: PropTypes.string.isRequired,
  fontSize: PropTypes.string.isRequired,
};
