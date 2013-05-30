function loadmap(){
    map = new OpenLayers.Map("map");
    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){
        loadMarker(map, data);
        createMenu(data);
    });
    if (typeof String.prototype.startsWith != 'function') {
       //see below for better implementation!
        String.prototype.startsWith = function (str){
            return this.indexOf(str) == 0;
        };
    }
}

function createIcon(image_path) {
        var size = new OpenLayers.Size(21,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon(image_path, size, offset);
        return icon;
}

function getPosition(data){
    var position = data.coordinate;
    var lonLat = new OpenLayers.LonLat(position[1],position[0])
        .transform(
           new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
           map.getProjectionObject()); // to Spherical Mercator Projection
    return lonLat;
}

function loadMarker(map, data) {
    var markersLayer = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markersLayer);
    $.each(data, function(key, value) {
        var size = new OpenLayers.Size(25,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
        var icon = new OpenLayers.Icon('images/hs-noinfo-marker.png', size, offset);
        var lonLat = getPosition(value)
        var marker = new OpenLayers.Marker(lonLat, icon);
        markersLayer.addMarker(marker);
        marker.events.register("click", marker, function (e) {
            populateData(key, value);
            });
        //fetch the status of the hackerspace and change the icon
        //accordingly
        var status_url = value.space_url;
        if (status_url) {
            getStatus(status_url, marker);
        }
    });
    map.zoomToExtent(markersLayer.getDataExtent());

    var center = map.getCenter();
    var distance = OpenLayers.Util.distVincenty;
    var min_value = null;
    var min_key = null;
    var min_dist = 100000000;

    //display the nearest hackerspace
    $.each(data, function(key, value){
        var lonLat = getPosition(value);
        var d = distance(lonLat, center);
        if (d < min_dist) {
            console.log(d);
            min_dist = d;
            min_value = value;
            min_key = key;
        }
        });
    populateData(min_key, min_value);
}

function populateData(key, data){
    var div = $('#data');
    div.empty();
    var title = $('<h3>').text(key)
    div.append(title)
    var logo = data.logo
    if (logo) {
        var img = $('<img>').attr({'src': data.logo});
        div.append(img);
        div.append($('<br>'));
    }
    $.each(data, function(key, value){
        var label = $('<label>');
        label.attr({'for': 'data_'+key});
        label.text(key);
        div.append(label);

        var span = $('<span>');
        span.attr({id: 'data_'+key});
        if (typeof value == "string" && value.startsWith("http")) {
            var a = $('<a>')
            a.attr({'href': value})
            a.text(value)
            div.append(a);
        } else {
            span.text(value);
            div.append(span);
        }

        div.append('<br>'); //lame
    });
}

function getStatus(url, marker) {
    $.getJSON(url, function(space_api) {
        //set the icon according to the cursor
        var open = space_api.open;
        if (open === true) {
            marker.setUrl('images/hs-open-marker.png');
        } else if (open === false) {
            marker.setUrl('images/hs-closed-marker.png');
        }
    });
}

function createMenu(data){
    var menu = $('#menu');
    $.each(data, function(k, v){
        var a = $('<a>');
        a.attr({'href': '#'+k})
        a.click(function(){
            populateData(k, v);
            var pos = new OpenLayers.LonLat(v.coordinate[1], v.coordinate[0]).transform(
               new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
            map.setCenter(pos, 16);
        });
        a.text(k)
        menu.append(a);
        menu.append('<br>');
    });
}
