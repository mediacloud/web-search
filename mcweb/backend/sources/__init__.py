import os

# Same env var names as rss-fetcher config:
# Allows testing against alternate (eg; dev, staging) instances of rss-fetcher:
RSS_FETCHER_USER = os.getenv('RSS_FETCHER_USER', None)
RSS_FETCHER_PASS = os.getenv('RSS_FETCHER_PASS', None)
RSS_FETCHER_URL = os.getenv('RSS_FETCHER_URL', 'https://rss-fetcher.tarbell.mediacloud.org')
