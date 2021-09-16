/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function esriMapScopeWrapper($) {
    require([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/TextSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/tasks/Locator',
        'esri/geometry/support/webMercatorUtils',
        'dojo/domReady!'
    ], function requireCallback(
        Map, MapView, 
        Graphic, Point, TextSymbol,
        PictureMarkerSymbol, Locator, webMercatorUtils
    ) {
        var wrMap = WildRydes.map;

        var map = new Map({ basemap: 'streets-navigation-vector'});//'gray-vector' });

        var view = new MapView({
            center: [-122.31, 47.60],
            container: 'map',
            map: map,
            zoom: 12
        });

        var pinSymbol = new TextSymbol({
            color: '#f50856',
            text: '\ue61d',
            font: {
                size: 20,
                family: 'CalciteWebCoreIcons'
            }
        });

        var unicornSymbol = new PictureMarkerSymbol({
            url: '/images/car.jpg',
            width: '25px',
            height: '25px'
        });

        const locatorTask = new Locator({url:'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'});

        var pinGraphic;
        var unicornGraphic;
        view.popup.autoOpenEnabled = false;

        

        function updateCenter(newValue) {
            wrMap.center = {
                latitude: newValue.latitude,
                longitude: newValue.longitude
            };
        }

        function updateExtent(newValue) {
            var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
            var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
            wrMap.extent = {
                minLng: min[0],
                minLat: min[1],
                maxLng: max[0],
                maxLat: max[1]
            };
        }

        view.watch('extent', updateExtent);
        view.watch('center', updateCenter);
        view.then(function onViewLoad() {
            updateExtent(view.extent);
            updateCenter(view.center);
        });

        
        view.on('click', function handleViewClick(event) {
            wrMap.selectedPoint = event.mapPoint;
            

            /*view.popup.open({
    // Set the popup's title to the coordinates of the clicked location
    title: "Reverse geocode:",
    location: event.mapPoint // Set the location of the popup to the clicked location
  });
            
            const params = {
                        location: event.mapPoint
                };

// Execute a reverse geocode using the clicked location
            locatorTask
                .locationToAddress(event.mapPoint)
                .then(function(response) {
    // If an address is successfully found, show it in the popup's content
            view.popup.content = response.address;
                })
            .catch(function(error){
    // If the promise fails and no result is found, show a generic message
            view.popup.content = "No address was found for this location";
            });

            */


            //view.graphics.remove(pinGraphic);
            pinGraphic = new Graphic({
                symbol: pinSymbol,
                geometry: wrMap.selectedPoint,
                text:"Dest"
            });
            view.graphics.add(pinGraphic);
            $(wrMap).trigger('pickupChange');
        });

        wrMap.animate = function animate(origin, dest, callback) {
            var startTime;
            var step = function animateFrame(timestamp) {
                var progress;
                var progressPct;
                var point;
                var deltaLat;
                var deltaLon;
                if (!startTime) startTime = timestamp;
                progress = timestamp - startTime;
                progressPct = Math.min(progress / 2000, 1);
                deltaLat = (dest.latitude - origin.latitude) * progressPct;
                deltaLon = (dest.longitude - origin.longitude) * progressPct;
                point = new Point({
                    longitude: origin.longitude + deltaLon,
                    latitude: origin.latitude + deltaLat
                });
                view.graphics.remove(unicornGraphic);
                unicornGraphic = new Graphic({
                    geometry: point,
                    symbol: unicornSymbol
                });
                view.graphics.add(unicornGraphic);
                if (progressPct < 1) {
                    requestAnimationFrame(step);
                } else {
                    callback();
                }
            };
            requestAnimationFrame(step);
        };

        wrMap.unsetLocation = function unsetLocation() {
            view.graphics.remove(pinGraphic);
        };
    });
}(jQuery));
