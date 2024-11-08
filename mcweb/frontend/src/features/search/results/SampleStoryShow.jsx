import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD } from '../util/platforms';
import { googleFaviconUrl } from '../../ui/uiUtil';
import InfoMenu from '../../ui/InfoMenu';
import { selectCurrentUser } from '../../auth/authSlice';

export default function SampleStoryShow({
  data, lSTP, platform,
}) {
  const currentUser = useSelector(selectCurrentUser);

  return (

    <table>
      <tbody>
        <tr>
          <th>Title</th>
          <th>Source</th>
          <th>Publication Date</th>
        </tr>

        {([PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD]).includes(platform) && (data.map((sampleStory) => (
          <tr key={`story-${sampleStory.id}`}>

            <td>
              <a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a>
            </td>

            <td>
              <img
                className="google-icon"
                src={platform === PROVIDER_NEWS_MEDIA_CLOUD ? googleFaviconUrl(`https://${sampleStory.media_url}`)
                  : googleFaviconUrl(`${sampleStory.media_url}`)}
                alt={`${sampleStory.media_name}`}
              />
              <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
            </td>

            <td>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</td>
            {/* if platform is wayback-machine OR media-cloud and the currentUser is a staff */}
            {
              (([PROVIDER_NEWS_WAYBACK_MACHINE].includes(platform) && lSTP === PROVIDER_NEWS_WAYBACK_MACHINE)
                || ([PROVIDER_NEWS_MEDIA_CLOUD].includes(platform) && lSTP === PROVIDER_NEWS_MEDIA_CLOUD && currentUser.isStaff))
              && (
                <InfoMenu platform={platform} sampleStory={sampleStory} />
              )
            }
          </tr>
        )))}
      </tbody>
    </table>
  );
}

SampleStoryShow.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    archived_url: PropTypes.string,
    article_url: PropTypes.string,
    id: PropTypes.string,
    language: PropTypes.string,
    media_name: PropTypes.string,
    media_url: PropTypes.string,
    publish_date: PropTypes.string,
    title: PropTypes.string,
    url: PropTypes.string,
  })).isRequired,
  lSTP: PropTypes.string.isRequired,
  platform: PropTypes.string.isRequired,
};
