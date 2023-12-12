import datetime as dt
import json
from typing import List, Dict
from django.apps import apps
from mc_providers import provider_name, PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER, PLATFORM_YOUTUBE,\
    PLATFORM_SOURCE_YOUTUBE, PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT, PLATFORM_SOURCE_MEDIA_CLOUD,\
    PLATFORM_SOURCE_WAYBACK_MACHINE, PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD_LEGACY
from settings import MC_LEGACY_API_KEY, YOUTUBE_API_KEY, NEWS_SEARCH_API_URL


def fill_in_dates(start_date, end_date, existing_counts):
    delta = (end_date + dt.timedelta(1)) - start_date
    date_count_dict = {k['date']: k['count'] for k in existing_counts}

    # whether or not the dates in existing_counts are string types
    dates_as_strings = (len(date_count_dict.keys()) == 0) or (isinstance(next(iter(date_count_dict.keys())), str))
    if not dates_as_strings:
        date_count_dict = {dt.datetime.strftime(k, "%Y-%m-%d %H:%M:%S"): v for k, v in date_count_dict.items()}

    filled_counts = []
    for i in range(delta.days):
        day = start_date + dt.timedelta(days=i)
        day_string = dt.datetime.strftime(day, "%Y-%m-%d %H:%M:%S")
        if day_string not in date_count_dict.keys():
            filled_counts.append({"count": 0, "date": day_string})
        else:
            filled_counts.append({'count': date_count_dict[day_string], 'date': day_string})
    return filled_counts


def parse_query(request) -> tuple:
    http_method = request.method

    if http_method == 'POST':
        payload = json.loads(request.body).get("queryObject")
        provider_name = payload["platform"]
        query_str = payload["query"]
        collections = payload["collections"]
        sources = payload["sources"]
        provider_props = search_props_for_provider(provider_name, collections, sources, request.GET)
        start_date = payload["startDate"]
        start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
        end_date = payload["endDate"]
        end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
        api_key = _get_api_key(provider_name)
        base_url = NEWS_SEARCH_API_URL if provider_name == 'onlinenews-mediacloud' else None
    elif http_method == 'GET':
        provider_name = request.GET.get("p", 'onlinenews-mediacloud')
        query_str = request.GET.get("q", "*")
        collections = request.GET.get("cs", None)
        collections = collections.split(",") if collections is not None else []
        sources = request.GET.get("ss", None)
        sources = sources.split(",") if sources is not None else []
        sort_field = request.GET.get("sort_field")
        sort_order = request.GET.get("sort_order")
        page_size = request.GET.get("page_size")
        pagination_token = request.GET.get("pagination_token")
        expanded = request.GET.get("expanded")
        provider_props = search_props_for_provider(
            provider_name, 
            collections,
            sources, 
            {"sort_field": sort_field, 
             "sort_order": sort_order, 
             "page_size": page_size,
             "pagination_token": pagination_token,
             "expanded": expanded,
             }
        )
        start_date = request.GET.get("start")
        start_date = dt.datetime.strptime(start_date, '%Y-%m-%d')
        end_date = request.GET.get("end")
        end_date = dt.datetime.strptime(end_date, '%Y-%m-%d')
        api_key = _get_api_key(provider_name)
        base_url = NEWS_SEARCH_API_URL if provider_name == 'onlinenews-mediacloud' else None 
    return start_date, end_date, query_str, provider_props, provider_name, api_key, base_url


def parse_query_array(queryObject) -> tuple:
    # payload = json.loads(request.body).get("queryObject") if http_method == 'POST' else json.loads(request.GET.get("queryObject"))
    payload = queryObject
    provider_name = payload["platform"]
    query_str = payload["query"]
    collections = payload["collections"]
    sources = payload["sources"]
    provider_props = search_props_for_provider(provider_name, collections, sources, queryObject)
    # api_key = _get_api_key(provider_name)
    start_date = payload["startDate"]
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
    end_date = payload["endDate"]
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
    api_key = _get_api_key(provider_name)
    base_url = NEWS_SEARCH_API_URL if provider_name == 'onlinenews-mediacloud' else None 
    return start_date, end_date, query_str, provider_props, provider_name, api_key, base_url


def _get_api_key(provider): 
    if provider == provider_name(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE):
        return YOUTUBE_API_KEY
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD_LEGACY):
        return MC_LEGACY_API_KEY
    return None


def search_props_for_provider(provider, collections: List, sources: List, all_params: Dict = None) -> Dict:
    if provider == provider_name(PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER):
        return _for_twitter_api(collections, sources)
    if provider == provider_name(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE):
        return _for_youtube_api(collections, sources)
    if provider == provider_name(PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT):
        return _for_reddit_pushshift(collections, sources)
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE):
        return _for_wayback_machine(collections, sources)
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD):
        return _for_media_cloud(collections, sources, all_params)
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD_LEGACY):
        return _for_media_cloud_legacy(collections, sources)
    return {}


def _for_youtube_api(collections: List, sources: List) -> Dict:
    # TODO: filter by a list of channels
    return dict()


def _for_twitter_api(collections: List, sources: List) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    usernames = []
    # turn media ids into list of usernames
    selected_sources = Source.objects.filter(id__in=sources)
    usernames += [s.name for s in selected_sources]
    # turn collections ids into list of usernames
    selected_sources = Source.objects.filter(collections__id__in=collections)
    usernames += [s.name for s in selected_sources]
    return dict(usernames=usernames)


def _for_reddit_pushshift(collections: List, sources: List) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    subreddits = []
    # turn media ids into list of subreddits
    selected_sources = Source.objects.filter(id__in=sources)
    subreddits += [s.name for s in selected_sources]
    # turn collections ids into list of subreddits
    selected_sources = Source.objects.filter(collections__id__in=collections)
    subreddits += [s.name for s in selected_sources]
    # clean up names
    subreddits = [s.replace('/r/', '') for s in subreddits]
    return dict(subreddits=subreddits)


def _for_wayback_machine(collections: List, sources: List) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    # 1. pull out all unique domains that don't have url_search_strs
    domains = []
    # turn media ids into list of domains
    selected_sources = Source.objects.filter(id__in=sources)
    domains += [s.name for s in selected_sources if s.url_search_string is None]
    # turn collections ids into list of domains
    selected_sources_in_collections = Source.objects.filter(collections__id__in=collections)
    selected_sources_in_collections = [s for s in selected_sources_in_collections if s.name is not None]
    domains += [s.name for s in selected_sources_in_collections if bool(s.url_search_string) is False]
    # 2. pull out all the domains that have url_search_strings and turn those into search clauses
    # CURRENTLY URL_SEARCH_STRINGS ARE NOT IMPLEMENTED IN WB SYSTEM
    # sources_with_url_search_strs = []
    # sources_with_url_search_strs += [s for s in selected_sources if bool(s.url_search_string) is not False]
    # sources_with_url_search_strs += [s for s in selected_sources_in_collections if bool(s.url_search_string) is not False]
    # domain_url_filters = ["(domain:{} AND url:*{}*)".format(s.name, s.url_search_string) for s in sources_with_url_search_strs]
    return dict(domains=domains)

def _for_media_cloud(collections: List, sources: List, all_params: Dict) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    # 1. pull out all unique domains that don't have url_search_strs
    domains = []
    # turn media ids into list of domains
    selected_sources = Source.objects.filter(id__in=sources)
    domains += [s.name for s in selected_sources if s.url_search_string is None]
    # turn collections ids into list of domains
    selected_sources_in_collections = Source.objects.filter(collections__id__in=collections)
    selected_sources_in_collections = [s for s in selected_sources_in_collections if s.name is not None]
    domains += [s.name for s in selected_sources_in_collections if bool(s.url_search_string) is False]
    # 2. pull out all the domains that have url_search_strings and turn those into search clauses
    sources_with_url_search_strs = []
    sources_with_url_search_strs += [s for s in selected_sources if bool(s.url_search_string) is not False]
    sources_with_url_search_strs += [s for s in selected_sources_in_collections if bool(s.url_search_string) is not False]
    domain_url_filters = ["(canonical_domain:{} AND url:*{}*)".format(s.name, s.url_search_string) for s in sources_with_url_search_strs]
    # 3. assemble and add in other supported params
    supported_extra_props = ['pagination_token', 'page_size', 'sort_field', 'sort_order',
                             'expanded']  # make sure nothing nefarious gets through
    extra_props = dict(domains=domains, filters=domain_url_filters)
    for prop_name in supported_extra_props:
        if prop_name in all_params:
            extra_props[prop_name] = all_params.get(prop_name)
    return extra_props


def _for_media_cloud_legacy(collections: List, sources: List) -> Dict:
    return dict(
        collections=collections,
        sources=sources
    )
