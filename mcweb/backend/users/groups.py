"""
Constants that define available group names and associated permissions
"""

CONTRIBUTOR = "contributor"
API_ACCESS = "api_access"
HIGH_RATE_LIMIT_GROUP = "api-high-rate-limit"

GROUPS = {
    CONTRIBUTOR: {
        #django app model specific permissions
        "source" : ["add","change","view"],
        "collection" : ["add","change","view"],
        "feed" : ["add","change","view"],     
    },
    API_ACCESS: {
    },
    HIGH_RATE_LIMIT_GROUP: {
    }
}


DEFAULT_USERS = {
    CONTRIBUTOR : ["e.leon@northeastern.edu"],
    API_ACCESS : ["all"],
    HIGH_RATE_LIMIT_GROUP: []
}