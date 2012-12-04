/**
 * Implements the byCycle Map interface for a Google Map.
 */


// Register this map type in the byCycle Map namespace
byCycle.Map.google = {
  description: 'Google Map',

  apiKey: 'AIzaSyD0zDsPxMHaxNgZVNnWmxxDomPT039GJoM',

  /**
   * Do map initialization that needs to happen before page is done loading.
   * For example, for Google Maps, the API init script needs to be loaded
   * inline because it does a document.write to load the actual API.
   */
  beforeLoad: function() {
    byCycle.util.writeScript(
      'http://maps.google.com/maps?file=api&amp;v=2&amp;key=' +
      byCycle.Map.google.apiKey);
  },

  isLoadable: function() {
    return GBrowserIsCompatible();
  }
};


/**
 * byCycle Google Map
 */
byCycle.Map.google.Map = Class.create();
byCycle.Map.google.Map.prototype = Object.extend(new byCycle.Map.base.Map(), {
  default_zoom: 14,

  initialize: function(ui, container) {
    this.superclass = byCycle.Map.base.Map.prototype;
    this.superclass.initialize.apply(this, arguments);
    this.createIcons();
    this.createListeners();
  },

  createMap: function(container) {
    var map = new GMap2(container);
    map.setCenter(new GLatLng(0, 0), 7);
    map.addControl(new GLargeMapControl());
    map.addControl(new GMapTypeControl());
    map.addControl(new GScaleControl());
    map.addControl(new GOverviewMapControl());
    map.enableContinuousZoom();
    map.enableScrollWheelZoom();
    new GKeyboardHandler(map);
    this.map = map;
  },

  createIcons: function() {
    // Base icon for start and end of route icons
    var base_icon = new GIcon();
    base_icon.shadow = byCycle.staticPrefix + 'images/shadow50.png';
    base_icon.iconSize = new GSize(20, 34);
    base_icon.shadowSize = new GSize(37, 34);
    base_icon.iconAnchor = new GPoint(9, 34);
    base_icon.infoWindowAnchor = new GPoint(9, 2);
    base_icon.infoShadowAnchor = new GPoint(18, 25);
    // Start icon
    var start_icon = new GIcon(base_icon);
    start_icon.image = byCycle.staticPrefix + 'images/dd-start.png';
    // End icon
    var end_icon = new GIcon(base_icon);
    end_icon.image = byCycle.staticPrefix + 'images/dd-end.png';
    // Assign icons to self
    this.start_icon = start_icon;
    this.end_icon = end_icon;
  },

  createListeners: function() {
    var self = this;
    GEvent.addListener(self.map, 'click', function (overlay, point) {
      self.map.closeInfoWindow();
    });
  },

  /* Events */

  addListener: function(obj, signal, func) {
    GEvent.addListener(obj, signal, func);
  },

  onUnload: function() {
    GUnload();
  },

  /* Size/Dimensions */

  setSize: function(dims) {
    this.superclass.setSize.call(this, dims);
    this.map.checkResize();
    this.map.setCenter(this.map.getCenter());
  },

  setHeight: function(height) {
    this.setSize({w: undefined, h: height});
  },

  getCenter: function() {
    var c = this.map.getCenter();
    return {x: c.lng(), y: c.lat()};
  },

  getCenterString: function() {
    var c = this.map.getCenter();
    var x = Math.round(c.lng() * 1000000) / 1000000;
    var y = Math.round(c.lat() * 1000000) / 1000000;
    return "longitude=" + x + ", " + "latitude=" + y;
  },

  setCenter: function(center, zoom) {
    if (typeof(zoom) == 'undefined') {
      this.map.setCenter(new GLatLng(center.y, center.x));
    } else {
      this.map.setCenter(new GLatLng(center.y, center.x), zoom);
    }
  },

  getZoom: function() {
    return this.map.getZoom();
  },

  setZoom: function(zoom) {
    this.map.setZoom(zoom);
  },


  /* Overlays */

  addOverlay: function(overlay) {
    this.map.addOverlay(overlay);
  },

  removeOverlay: function(overlay) {
    this.map.removeOverlay(overlay);
  },

  drawPolyLine: function(points, color, weight, opacity) {
    var line = new GPolyline(points, color, weight, opacity);
    this.map.addOverlay(line);
    return line;
  },

  drawPolyLineFromEncodedPoints: function (points, levels, color, weight,
                                           opacity) {
    var line = new GPolyline.fromEncoded({
      points: points,
      levels: levels,
      color: color,
      weight: weight,
      opacity: opacity,
      zoomFactor: 32,
      numLevels: 4
    });
    this.map.addOverlay(line);
    return line;
  },

  placeMarker: function(point, icon) {
    var marker = new GMarker(new GLatLng(point.y, point.x), icon);
    this.map.addOverlay(marker);
    return marker;
  },

  placeGeocodeMarker: function(point, node, zoom, icon) {
    zoom = (typeof(zoom) != 'undefined' ? zoom : this.map.getZoom());
    this.setCenter(point, zoom);
    var marker = this.placeMarker(point, icon);
    var g_lat_lng = new GLatLng(point.y, point.x);
    var self = this;
    GEvent.addListener(marker, "click", function() {
      self.map.openInfoWindow(g_lat_lng, node);
    });
    return marker;
  },

  placeMarkers: function(points, icons) {
    var markers = [];
    var len = points.length;
    if (icons) {
      for (var i = 0; i < len; ++i) {
        var p = points[i];
        var ll = new GLatLng(p.y, p.x);
        var marker = new GMarker(ll, {icon: icons[i]});
        markers.push(marker);
        this.map.addOverlay(marker);
      }
    } else {
      for (var i = 0; i < len; ++i) {
        var p = points[i];
        var ll = new GLatLng(p.y, p.x);
        var marker = new GMarker(ll);
        markers.push(marker);
        this.map.addOverlay(marker);
      }
    }
    return markers;
  },

  makeRegionMarker: function(region) {
    var icon = new GIcon();
    icon.image = byCycle.staticPrefix + 'images/x.png';
    icon.iconSize = new GSize(17, 19);
    icon.iconAnchor = new GPoint(9, 10);
    icon.infoWindowAnchor = new GPoint(9, 10);
    icon.infoShadowAnchor = new GPoint(9, 10);
    var marker = this.placeMarker(region.center, icon);
    var self = this;
    GEvent.addListener(marker, 'click', function() {
      var params = byCycle.request_params.toQueryString();
      var location = [byCycle.prefix, 'regions/', region.key];
      if (params) { location.push('?', params); }
      window.location = location.join('');
    });
    return marker;
  },

  clear: function() {
    this.map.clearOverlays();
    this.initListeners();
  },

  /* Bounds */

  centerAndZoomToBounds: function(bounds, center) {
    center = center || this.getCenterOfBounds(bounds);
    center = new GLatLng(center.y, center.x);
    var sw = bounds.sw;
    var ne = bounds.ne;
    var gbounds = new GLatLngBounds(new GLatLng(sw.y, sw.x),
                                    new GLatLng(ne.y, ne.x));
    this.map.setCenter(center, this.map.getBoundsZoomLevel(gbounds));
  },

  /* Info Window */

  openInfoWindowHtml: function(point, html) {
    this.map.openInfoWindowHtml(new GLatLng(point.y, point.x), html);
  },

  closeInfoWindow: function() {
    this.map.closeInfoWindow();
  },

  showMapBlowup: function(point) {
    this.map.showMapBlowup(new GLatLng(point.y, point.x));
  },

  showGeocode: function(geocode) {
    var self = this;
    var point = new GLatLng(geocode.y, geocode.x);
    var html = geocode.html;
    if (!geocode.marker) {
      geocode.marker = this.placeMarker(point);
      GEvent.addListener(geocode.marker, 'click', function() {
    self.map.openInfoWindowHtml(point, html);
    this.ui.setResult(html);
      });
    }
    this.map.setCenter(new GLatLng(geocode.y, geocode.x), 14);
    self.map.openInfoWindowHtml(point, html);
  },

  makeBikeTileOverlay: function (zoom_levels) {
    var domain = 'zircon.oregonmetro.gov';
    var transparent_png = ['http://', domain,
                           '/bycycle/images/transparent.png'].join('');
    var c = '&copy; <a href="http://www.oregonmetro.gov/">Metro</a>';
    var copyrights = new GCopyrightCollection(c);
    var wms_url = ['http://', domain, '/cgi-bin/mapserv-postgis',
                   '?map=/var/www/html/bycycle/bycycle.map&'].join('');
    var layers = 'bike_rte,county_lines';
    var tile_size = 256;
    var tile_size_less_one = tile_size - 1;
    var img_format = 'image/png';
    var srs = "EPSG:4326";
    var min_zoom = 9;
    var url = [wms_url,
               "SERVICE=WMS",
               "&VERSION=1.1.1",
               "&REQUEST=GetMap",
               "&LAYERS=", layers,
               "&STYLES=",
               "&FORMAT=", img_format,
               "&BGCOLOR=0xFFFFFF",
               "&TRANSPARENT=TRUE",
               "&SRS=", srs,
               "&WIDTH=", tile_size,
               "&HEIGHT=", tile_size].join('');
    var sw, ne;

    var pdx_bounds = byCycle.regions.regions.get('portlandor').bounds;
    var pdx_sw = pdx_bounds.sw;
    var pdx_ne = pdx_bounds.ne;
    var bounds = new GLatLngBounds(new GLatLng(pdx_sw.lat, pdx_sw.lng),
                                   new GLatLng(pdx_ne.lat, pdx_ne.lng));

    var projection = new GMercatorProjection(zoom_levels);
    projection.tileCheckRange = function(tile,  zoom,  tile_size) {
      var x = tile.x * tile_size;
      var y = tile.y * tile_size;
      var sw_point = new GPoint(x, y + tile_size_less_one);
      var ne_point = new GPoint(x + tile_size_less_one, y);
      sw = this.fromPixelToLatLng(sw_point, zoom);
      ne = this.fromPixelToLatLng(ne_point, zoom );
      var tile_bounds = new GLatLngBounds(sw, ne);
      if (tile_bounds.intersects(bounds)) {
        return true;
      } else {
        return false;
      }
    };

    var layer = new GTileLayer(copyrights, 0, zoom_levels - 1);
    layer.getTileUrl = function(tile, zoom) {
      projection.tileCheckRange(tile, zoom, tile_size);
      if (zoom < min_zoom) {
        var tile_url = transparent_png;
      } else {
        var bbox = [sw.lng(), sw.lat(), ne.lng(), ne.lat()].join(',');
        var tile_url = [url, "&BBOX=", bbox].join('');
      }
      return tile_url;
    };
    layer.isPng = function() { return true; };
    layer.getOpacity = function() { return 0.625; };

    return new GTileLayerOverlay(layer);
  }
});
