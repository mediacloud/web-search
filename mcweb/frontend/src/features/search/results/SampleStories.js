import * as React from 'react';
import { useEffect } from 'react';
import {useSelector} from 'react-redux';

import { useGetSampleStoriesMutation, useDownloadSampleStoriesCSVMutation } from '../../../app/services/searchApi';
import { queryGenerator } from '../util/queryGenerator';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import  CircularProgress  from '@mui/material/CircularProgress';
import { PLATFORM_REDDIT, PLATFORM_ONLINE_NEWS, PLATFORM_TWITTER } from '../Search';

const supportsDownload = (platform) => [PLATFORM_ONLINE_NEWS, PLATFORM_REDDIT, PLATFORM_TWITTER].includes(platform);

export default function SampleStories(){

    const { queryList,
        negatedQueryList,
        platform,
        startDate,
        endDate,
        collections,
        sources,
        lastSearchTime,
        anyAll } = useSelector(state => state.query);

    const queryString = queryGenerator(queryList, negatedQueryList, platform);

    const [query, { isLoading, data }] = useGetSampleStoriesMutation();
    const [downloadStories, downloadResult ] = useDownloadSampleStoriesCSVMutation();

    const collectionIds = collections.map(collection => collection['id']);

    useEffect(() => {
        if (queryList[0].length !== 0) {
            query({
                'query': queryString,
                startDate,
                endDate,
                'collections': collectionIds,
                sources,
                platform

            });
        }
    }, [lastSearchTime]);

    if (isLoading) return (<div> <CircularProgress size="75px" /> </div>);
    if (!data) return null;

    const content = (
      <div className="results-item-wrapper results-sample-stories">
          <h2>Sample Matching Content</h2>
          <table>
            <tbody>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Publication Date</th>
              </tr>
              {data.sample.map((sampleStory, index) => {
                  return (
                      <tr key={`${index}-${sampleStory.media_id}`}>
                          <td><a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a></td>
                          <td>
                            {(platform === PLATFORM_ONLINE_NEWS) && (
                              <img className="google-icon"
                                    src={`https://www.google.com/s2/favicons?domain=${sampleStory.media_url}`}
                                      alt="{sampleStory.media_name}" />
                            )}
                            <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
                          </td>
                          <td>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</td>
                      </tr>
                  );
              })}
            </tbody>
          </table>
      </div>
    );

    let platformSpecficContent;
    if (supportsDownload(platform)){
        platformSpecficContent = (
          <div className="clearfix">
            <div className="float-end">
              <Button variant="text" onClick={() => {
                  downloadStories({
                      'query': queryString,
                      startDate,
                      endDate,
                      'collections': collectionIds,
                      sources,
                      platform

                  });
              }}>
                  Download CSV
              </Button>
            </div>
          </div>
        );
    }
    return (
      <>
        {content}
        {platformSpecficContent}
      </>
    );

}
