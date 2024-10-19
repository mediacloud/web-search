from typing import Optional, List, Dict

# These are all the characters used in elastic search queries, so they should NOT be included in your search str
ALL_RESERVED_CHARS = ['+', '\\', '-', '!', '(', ')', ':', '^', '[', ']', '"', '{', '}', '~', '*', '?', '|', '&', '/']

# However, most query strings are using these characters on purpose, so let's only automatically escape some of them
RARE_RESERVED_CHARS = ['/']


def sanitize_query(query: str, reserved_char_list: Optional[List[str]] = None) -> str:
    """
    Make sure we properly escape any reserved characters in an elastic search query
    @see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/query-dsl-query-string-query.html#_reserved_characters
    :param query: a full query string
    :param reserved_char_list: characters that need escaping
    :return:
    """
    reserved_chars = reserved_char_list if reserved_char_list else RARE_RESERVED_CHARS
    sanitized = ''
    for char in query:
        if char in reserved_chars:
            sanitized += '\\%s' % char
        else:
            sanitized += char
    return sanitized


def dict_to_list(data: Dict) -> List[Dict]:
    """
    The API returns dicts, but that isn't very restful nor the current standard approach to user-friendly JSON.
    This utility method converts tht into a list of dicts.
    """
    return [{'name': k, 'value': v} for k, v in data.items()]
