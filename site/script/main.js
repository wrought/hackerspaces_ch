function loadmap(){
    map = new OpenLayers.Map("map");
    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){
        loadMarker(map, data);
        createMenu(data);
        loadByHash(data);
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
    var table = $('<table>');
    div.append(table)
    var title = $('<thead>').text(key)
    table.append(title)

    var logo = data.logo
    if (logo) {
        var logo_line = $('<tr>')
        var logo = $('<img>').attr({'src': data.logo});
        var logo_cell = $('<td>')
        logo_cell.attr({'colspan': 2, 'class': 'logo'});
        logo_cell.append(logo)
        logo_line.append(logo_cell);
        table.append(logo_line)
    }

    $.each(data, function(key, value){
        var line = $('<tr>')

        var label = $('<td>');
        label.attr({'class': 'label'})
        label.text(key);
        line.append(label);

        var v = $('<td>');
        v.attr({'class': 'value'})
        if (typeof value == "string" && value.startsWith("http")) {
            var a = $('<a>')
            a.attr({'href': value})
            a.text(value)
            v.append(a);
        } else {
            v.text(value);
        }
        line.append(v)
        table.append(line)
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
        var li = $('<li>');
        var a = $('<a>');
        a.attr({'href': '#'+k})
        a.click(function(){
            populateData(k, v);
            map.setCenter(getPosition(v), 13);
        });
        a.text(k)
        li.append(a);
        menu.append(li);
    });
}

function loadByHash(data){
    var hash = window.location.hash;
    if(hash){
        var key = hash.split('#')[1];
        populateData(key, data[key]);
        map.setCenter(getPosition(data[key]), 13);
    }
}
