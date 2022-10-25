import * as React from 'react';
import { useEffect } from 'react';
import {useSelector} from 'react-redux';

import { useGetSampleStoriesMutation, useDownloadSampleStoriesCSVMutation } from '../../../app/services/searchApi';
import { queryGenerator } from '../util/queryGenerator';
import dayjs from 'dayjs';

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

    const PLATFORM_TWITTER = 'twitter';
    const PLATFORM_ONLINE_NEWS = 'onlinenews';
    const PLATFORM_YOUTUBE = 'youtube';
    const PLATFORM_REDDIT = 'reddit';

    const [query, { isLoading, data }] = useGetSampleStoriesMutation();
    const [downloadStories, downloadResult ] = useDownloadSampleStoriesCSVMutation();

    const collectionIds = collections.map(collection => collection['id']);

    useEffect(() => {
        if (queryList) {
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

    if (!data) return null;
    if (isLoading) return (<h1>Loading...</h1>);
    if (platform === PLATFORM_ONLINE_NEWS){
        return(
            <div className='sample-container'>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {data.sample.map((sampleStory, index) => {
                        return(
                            <div className='sample-story-item' key={`${index}-${sampleStory.media_id}`}>
                                <a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a>
                                <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
                                <p>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</p>
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => {
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
                </button>
            </div>
        );
    } else if (platform === PLATFORM_TWITTER){
        return (
            <div>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {data.sample.map((sampleStory, index) => {
                        return (
                            <div className='sample-story-item' key={`${index}-${sampleStory.media_id}`}>
                                <a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.content}</a>
                                <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.author}</a>
                                <p>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    } else if (platform === PLATFORM_YOUTUBE){
        return (
            <div>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {data.sample.map((sampleStory, index) => {
                        return (
                            <div className='sample-story-item' key={`${index}-${sampleStory.media_id}`}>
                                <a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.content}</a>
                                <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
                                <p>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    } else if (platform === PLATFORM_REDDIT){
        return (
            <div>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {data.sample.map((sampleStory, index) => {
                        return (
                            <div className='sample-story-item' key={`${index}-${sampleStory.media_id}`}>
                                <a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a>
                                <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
                                <p>{sampleStory.publish_date}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}