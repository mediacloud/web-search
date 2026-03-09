// tooltip text for Source object fields (based on database field name)

// exporting just strings, and not FoobarTooltip components
// because StatPanel is constructed from an array.

// Used by both SourceList.jsx and buildStatArray.js
// (covers the union of fields in those files)

// A function 'cause export default won't take an object,
// AND to make sure templates expanded with (latest) values.
export default function sourceTooltips() {
    const dslmu = document.settings.lastMetadataUpdates;
    return {
	name: "The domain that uniquely identifies the Source within our system for searching against the Online News Archive.",

	pub_country: "The primary country this Source is publishing from or where their headquarters are located. This is the 3-letter ISO 3166-1 alpha-3 standard format",

	pub_state: "The primary state or province this Source is publishing from or where their headquarters are located. This is the ISO 3166-2 standard format",

	primary_language: `Our system guesses the primary language of each article it ingests. For each Source we indicate the language the plurality of its articles are in, if we have enough to measure (updated ${dslmu['primary_language'] ?? 'weekly'}).`,

	stories_per_week: `The number of stories ingested from this Source in the past week, based on our ingestion (updated ${dslmu['stories_per_week'] ?? 'weekly'})`,

	last_story: `The most recent year and month a new story was ingested (updated ${dslmu['last_story'] ?? 'monthly'}).`,

	media_type: "Type of media: print, digital, audio or video (if known).",

	last_rescraped: "The last time our system tried to automatically check the website for more feeds we can use to ingest stories every day. “?” means it hasn't tried since fall 2023."
    };
}
