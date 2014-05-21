from bycycle.tripplanner.tests.functional import BaseTestCase


class TestLookup(BaseTestCase):

    def test_query(self):
        self.app.get(
            '/lookup/find',
            params={
                'q': '633 n alberta',
            }
        )

    def test_query_json(self):
        self.app.get(
            '/lookup/find',
            headers={
                'accept': 'application/json',
            },
            params={
                'q': '633 n alberta',
            }
        )

    def test_query_300(self):
        self.app.get(
            '/lookup/find',
            params={
                'q': '633 alberta',
            }
        )

    def test_query_404(self):
        self.app.get(
            '/lookup/find',
            params={
                'q': '100 N Fake St',
            },
            status=404)

    def test_query_missing_q(self):
        self.app.get('/lookup/find', status=400)