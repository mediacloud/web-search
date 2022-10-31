import * as React from 'react';
import { Link } from 'react-router-dom';

export default function SourceItem(props) {
  const { source } = props;
  return (
    <li className="source">
      <Link className="source-collection-item" to={`/sources/${source.id}`}>
        <h5>{source.id}</h5>
        <h5>{source.label}</h5>
        <h5>{source.name}</h5>
      </Link>
    </li>
  );
}
