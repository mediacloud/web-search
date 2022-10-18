import * as React from 'react';
import {useSelector} from 'react-redux';
import dayjs from 'dayjs';

export default function SampleStories(props){

    const {platform} = props;
    const {sample} = useSelector(state => state.results);

    if (!sample) return null;
   
    if (platform === 'Online News Archive'){
        return(
            <div className='sample-container'>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {sample.map((sampleStory, index) => {
                        return(
                            <div className='sample-story-item' key={`${index}-${sampleStory.media_id}`}>
                                <a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a>
                                <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
                                <p>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    } else if (platform === 'Twitter'){
        return (
            <div>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {sample.map((sampleStory, index) => {
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
    } else if (platform === 'Youtube'){
        return (
            <div>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {sample.map((sampleStory, index) => {
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
    } else if (platform === 'Reddit'){
        return (
            <div>
                <h3>Sample Stories</h3>
                <div className='sample-title'>
                    <h5>Title</h5>
                    <h5>Media Source</h5>
                    <h5>Published</h5>
                </div>
                <div>
                    {sample.map((sampleStory, index) => {
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