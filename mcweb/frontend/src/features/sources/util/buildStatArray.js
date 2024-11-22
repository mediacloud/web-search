const statPanelValues = [
  { label: 'First Story', value: 'first_story' },
  { label: 'Stories per Week', value: 'stories_per_week' },
  { label: 'Pub Country', value: 'pub_country' },
  { label: 'Pub State', value: 'pub_state' },
  { label: 'Language', value: 'primary_language' },
  { label: 'Media Type', value: 'media_type' },
  { label: 'Last Rescraped', value: 'last_rescraped' },
];

const buildStatArray = (sourceObject) => {
  const returnArr = [];
  statPanelValues.forEach((panelValue) => {
    returnArr.push({ label: panelValue.label, value: sourceObject[panelValue.value] });
  });
  return returnArr;
};

export default buildStatArray;

// [
//     { label: 'First Story', value: source.first_story },
//     { label: 'Stories per Week', value: source.stories_per_week },
//     { label: 'Publication Country', value: source.pub_country },
//     { label: 'Publication State', value: source.pub_state },
//     { label: 'Primary Language', value: source.primary_language },
//     { label: 'Media Type', value: source.media_type },
//   ]

// {
//     "id": 1096,
//     "name": "npr.org",
//     "url_search_string": null,
//     "label": "NPR",
//     "homepage": "http://www.npr.org/",
//     "notes": null,
//     "platform": "online_news",
//     "stories_per_week": 635,
//     "first_story": null,
//     "created_at": "2023-02-21T16:54:28.035524Z",
//     "modified_at": "2023-07-20T13:24:37.455921Z",
//     "pub_country": "USA",
//     "pub_state": null,
//     "primary_language": null,
//     "media_type": "video_broadcast",
//     "collection_count": 26
// }
