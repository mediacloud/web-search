# Sources Application Data Model

## Overview

The Sources application data model represents a hierarchical organization of media sources, their content feeds, and organizational collections. The model supports multi-platform content sources (online news, YouTube, Twitter, Reddit) and provides mechanisms for organizing sources into collections, tracking alternative domain identifiers, and managing RSS feed discovery.

## Entity Descriptions

### Collection

A **Collection** represents an organizational grouping of media sources. Collections serve as thematic or administrative containers that allow users to organize sources according to research interests, geographic regions, or content categories.

**Key Attributes:**
- **name** (unique): The unique identifier for the collection
- **platform**: The content platform type (online_news, reddit, twitter, youtube)
- **public**: Visibility flag determining whether the collection is publicly accessible
- **featured**: Flag indicating whether the collection is featured/promoted
- **managed**: Administrative flag for managed collections
- **notes**: Free-text administrative notes

**Relationships:**
- Many-to-many relationship with Source entities
- A collection can contain multiple sources
- A source can belong to multiple collections

### Source

A **Source** represents an individual media organization or content outlet. Each source is identified by a canonical domain name and maintains metadata about its publication characteristics, geographic location, and content metrics.

**Key Attributes:**
- **name**: Canonical domain identifier (e.g., "example.com")
- **homepage**: Primary website URL (required)
- **url_search_string**: URL pattern used for content matching (e.g., "example.com/*")
- **label**: Human-readable display name
- **platform**: Content platform type (online_news, youtube, twitter, reddit)
- **media_type**: Type of media organization (audio_broadcast, digital_native, print_native, video_broadcast, other)
- **pub_country**: ISO 3166-1 alpha-3 country code
- **pub_state**: ISO 3166-2 state/province code
- **primary_language**: ISO 639-1 language code
- **stories_per_week**: Weekly story publication count
- **first_story**: Date of first story publication
- **last_rescraped**: Timestamp of last RSS feed discovery operation
- **search_vector**: Full-text search index vector for keyword search

**Relationships:**
- Many-to-many relationship with Collection entities
- One-to-many relationship with Feed entities (a source publishes multiple feeds)
- One-to-many relationship with AlternativeDomain entities (a source may have multiple domain identifiers)

### Feed

A **Feed** represents an individual RSS feed or news sitemap endpoint associated with a source. Feeds are discovered through automated scraping operations and serve as the primary mechanism for content ingestion.

**Key Attributes:**
- **url** (unique): The unique feed URL
- **admin_rss_enabled**: Administrative flag indicating whether the feed is enabled for RSS fetching
- **name**: Optional feed name

**Relationships:**
- Many-to-one relationship with Source (each feed belongs to exactly one source)
- A source can publish multiple feeds

### AlternativeDomain

An **AlternativeDomain** represents an additional domain name that may be used to identify the same source. This entity supports cases where sources use multiple domain variants (e.g., www and non-www, or domain aliases).

**Key Attributes:**
- **domain**: Alternative domain identifier (unique per source)

**Relationships:**
- Many-to-one relationship with Source (each alternative domain belongs to exactly one source)
- A source can have multiple alternative domain identifiers

## Relationship Summary

1. **Collection ↔ Source** (Many-to-Many)
   - Implemented via a junction table (implicit in Django ORM)
   - A collection can organize multiple sources
   - A source can belong to multiple collections
   - This relationship enables flexible categorization and cross-cutting organizational schemes

2. **Source → Feed** (One-to-Many)
   - A source publishes multiple feeds
   - Each feed belongs to exactly one source
   - Feeds are discovered through automated scraping operations

3. **Source → AlternativeDomain** (One-to-Many)
   - A source can have multiple alternative domain identifiers
   - Each alternative domain belongs to exactly one source
   - Supports domain alias and variant management

## Data Integrity Constraints

- **Collection.name**: Must be unique across all collections
- **Feed.url**: Must be unique across all feeds
- **Source**: Unique constraint on (name, platform, url_search_string) combination
- **AlternativeDomain**: Unique constraint on (source, domain) combination

## Temporal Attributes

All entities include temporal metadata:
- **created_at**: Record creation timestamp (auto-generated)
- **modified_at**: Record modification timestamp (auto-updated)

## Indexing Strategy

The model includes strategic indexes for performance:
- Collection platform index for filtering
- Source platform index for filtering
- Source search_vector GIN index for full-text search
- AlternativeDomain domain index for lookup operations

## Academic Context

This data model supports research applications in media studies, computational journalism, and content analysis. The hierarchical organization (Collections → Sources → Feeds) enables researchers to:
- Organize sources by research themes or geographic regions
- Track content publication patterns across platforms
- Manage multi-domain source identification
- Support automated content discovery and ingestion workflows


