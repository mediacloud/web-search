import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { googleFaviconUrl } from '../ui/uiUtil';

function FeedStories({ feedId }) {
  return (<h2>Stories Coming Soon</h2>);
  //   return (
  //     <div className="results-item-wrapper results-sample-stories">
  //       <div className="row">
  //         <div className="col-12">
  //           <h2>Stories</h2>
  //         </div>
  //         <div className="row">

//           <div className="col-8">
//             <table>
//               <tbody>
//                 <tr>
//                   <th>Title</th>
//                   <th>Source</th>
//                   <th>Publication Date</th>
//                 </tr>
//                 {/* {data.sample.map((sampleStory) => ( */}
//                 <tr>
//                   {/* <td><a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a></td> */}
//                   <td>
//                     <img
//                       className="google-icon"
//                     //   src={googleFaviconUrl(sampleStory.media_url)}
//                       alt="{sampleStory.media_name}"
//                     />
//                     {/* <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a> */}
//                   </td>
//                   {/* <td>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</td> */}
//                 </tr>
//                 {/* ))} */}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
}

FeedStories.propTypes = {
  feedId: PropTypes.number.isRequired,
};

export default FeedStories;
