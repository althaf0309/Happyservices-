from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """Wrap validation errors as {"errors": {field: [messages]}} per the API contract."""
    response = exception_handler(exc, context)
    if response is not None and isinstance(exc, ValidationError):
        data = response.data
        if not isinstance(data, dict):
            data = {"non_field_errors": data}
        response.data = {"errors": data}
    return response
