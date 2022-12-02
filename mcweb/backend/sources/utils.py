import json 
from .models import Collection

# Example of custom encoder
class CustomJsonEncoder(json.JSONEncoder):
    def default(self, o):
        # Here you can serialize your object depending of its type
        # or you can define a method in your class which serializes the object           
        if isinstance(o, (Collection)):
            return o.__dict__  # Or another method to serialize it
        else:
            return json.JSONEncoder.encode(self, o)