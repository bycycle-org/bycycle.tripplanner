import logging
import re

from pyramid.decorator import reify
from pyramid.httpexceptions import exception_response

from bycycle.core.exc import ByCycleError, InputError, NotFoundError
from bycycle.core.model import Entity


log = logging.getLogger(__name__)


DIRECTIONS_RE = re.compile(r'.+\s+to\s+.+')


class ServiceView:

    def __init__(self, request):
        self.request = request

    def get(self):
        req = self.request
        params = req.params

        if not params:
            return {}

        term = params.get('term', '').strip()
        from_ = params.get('from', '').strip()
        to = params.get('to', '').strip()

        if term:
            if DIRECTIONS_RE.match(term):
                view_class = self.DirectionsView
            else:
                view_class = self.LookupView
        elif from_ or to:
            view_class = self.DirectionsView
        else:
            raise exception_response(400)

        view = view_class(self.request)
        return view.get()

    @reify
    def LookupView(self):
        from .lookup import LookupView
        return LookupView

    @reify
    def DirectionsView(self):
        from .directions import DirectionsView
        return DirectionsView

    def _get(self):
        """Query service and return data."""
        data = {
            'service': self.service_class.name,
        }
        service = self.service_class(self.request.dbsession)
        try:
            query = self._get_query()
            options = self._get_options()
            result = service.query(query, **options)
        except InputError as exc:
            self.request.response.status_int = 400
            data['error'] = self._exc_as_dict(exc)
        except NotFoundError as exc:
            self.request.response.status_int = 404
            data['error'] = self._exc_as_dict(exc)
        except ByCycleError as exc:
            extra_data = self._exc_handler(exc)
            if extra_data is exc:
                raise exc
            data['error'] = self._exc_as_dict(exc)
            data.update(extra_data)
        else:
            data['term'] = query
            data['results'] = [result] if isinstance(result, Entity) else result
        return data

    def _get_query(self):
        """Return a query the relevant back end service understands.

        Parse request data for query. If bad or missing data is found,
        an InputError may be raised.

        The `term` query param is used as-is by default.

        """
        return self.request.params.get('term', '').strip()

    def _get_options(self):
        """Return keyword args for service.

        Extract service options from query params and return a dict of
        service-specific options (i.e., the **kwargs for the service).
        Like `_get_query()`, this may raise an `InputError`.

        """
        return {}

    def _exc_as_dict(self, exc):
        """Given the `ByCycleError` ``exc``, return a dict w/ its attrs.

        The resulting dict is used in both templates and JSON responses.

        """
        return {
            'title': exc.title,
            'explanation': exc.explanation,
            'detail': exc.detail,
        }

    def _exc_handler(self, exc):
        """Exception used by `find()` for unhandled `ByCycleError`s.

        The `GET` method handles `InputError`s and `NotFoundError`s
        raised by the back end, converting them to 400 and 404
        responses, respectively.

        This method can be defined to handle *other* subclasses of
        `ByCycleError`. It can return a dict, which will update the dict
        that will be passed to the renderer. It can instead return the
        original exception to signal that it couldn't be handled.

        In particular, the handler will probably want to include
        `results`. It may also set properties on `self.request.response`
        (e.g., its status code).

        """
        return exc