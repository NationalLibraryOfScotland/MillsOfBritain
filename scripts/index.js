var map;
var overlay; //current historic overlay node
var overlayLayers;
var baseLayer;
var baseLayers; // base layers include Bing and ESRI maps, and OpenStreetMap
var overlaySelected;
var subjectname;
var hover;
selectedFeaturesFromResults = [];
selectedFeatureszoomtoID = [];
DEFAULT_ZOOM = 6;
var DEFAULT_LAT = 54.8;
var DEFAULT_LON = -4.0;
DEFAULT_ID = '0';
var slidervalue;
var zoomvalextent;
var filterinprocess;
var filterstart;
var vectorSource;
var FeaturesFromGeoServer = [];
var watermillsval;
var notincanmoreval;

var countyname;
var countynameold;
var overlaySelectedSixInchLayer;

filterinprocess = false;

filterstart = true;
// console.log("filterstart = true");

// Proj4 definition for British National Grid

proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

ol.proj.proj4.register(proj4);

// necessary for use of Bing layers - generate your own at: https://msdn.microsoft.com/en-us/library/ff428642.aspx

	var BingapiKey = "AgS4SIQqnI-GRV-wKAQLwnRJVcCXvDKiOzf9I1QpUQfFcnuV82wf1Aw6uw5GJPRz";

// a generic attribution variable for LINZ sheet lines
	



function gotoexplore() 
	{
	var zoom = map.getView().getZoom();
	var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	window.open("https://maps.nls.uk/geo/explore/#zoom=" + zoom + "&lat=" + centre[1].toFixed(4) + "&lon=" + centre[0].toFixed(4) + "&layers=6");
	}

function gotosidebyside() 
	{
	var zoom = map.getView().getZoom();
	var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	window.open("https://maps.nls.uk/geo/explore/side-by-side/#zoom=" + zoom + "&lat=" + centre[1].toFixed(4) + "&lon=" + centre[0].toFixed(4) + "&layers=6&right=ESRIWorld");
	}

function get25inch() 
	{
	var zoom = map.getView().getZoom();
	var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	// window.location = "https://maps.nls.uk/geo/find/#zoom=15&lat=" + centre[1].toFixed(4) + "&lon=" + centre[0].toFixed(4) + "&layers=101&b=10&z=0&point=" + centre[1].toFixed(4) + "," + centre[0].toFixed(4);

	window.open("https://maps.nls.uk/geo/find/#zoom=15&lat=" + centre[1].toFixed(4) + "&lon=" + centre[0].toFixed(4) + "&layers=101&b=10&z=0&point=" + centre[1].toFixed(4) + "," + centre[0].toFixed(4));
	}


function get6inch() 
	{
	var zoom = map.getView().getZoom();
	var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	// window.location = "https://maps.nls.uk/geo/find/#zoom=13&lat=" + centre[1].toFixed(4) + "&lon=" + centre[0].toFixed(4) + "&layers=102&b=10&z=0&point=" + centre[1].toFixed(4) + "," + centre[0].toFixed(4);
	window.open("https://maps.nls.uk/geo/find/#zoom=13&lat=" + centre[1].toFixed(4) + "&lon=" + centre[0].toFixed(4) + "&layers=102&b=10&z=0&point=" + centre[1].toFixed(4) + "," + centre[0].toFixed(4)); 
	}

// function to switch to split-screen viewer

function setURL() {
   var a = document.createElement('a');
   a = window.location.hash;
   window.location = "https://maps.nls.uk/projects/mills/sidebyside/" + a ;
}

// function to zoom to filtered features

function zoomtoselected() {

	map.getView().fit(map.getLayers().getArray()[2].getSource().getExtent(), (map.getSize()));
		var mapZoom = map.getView().getZoom();
			if (mapZoom > 15)
			{
			map.getView().setZoom(15);
			}

}

// function to unselect previous features and return the results and resultsheader divs back to original empty state

	function deselect()
		{

		setResults(''); 
		setResultsheader('<p>No mills selected - please click on a <strong>dark blue circle</strong> to view mill records</p>');
		if (map.getLayers().getLength() > 4) 
				{ 
					if (map.getLayers().getArray()[4].get('title') == 'vectors - vectors') map.getLayers().removeAt(4); 
				
				}
			
		if (map.getLayers().getLength() > 3) 
			{
				if (map.getLayers().getArray()[3].get('title') == 'vectors - vectors') map.getLayers().removeAt(3);  
				
			}
	}
	
	
// Conversions between British National Grid and lat / long
// From https://www.movable-type.co.uk/scripts/latlong-gridref.html NT261732

    function gridrefNumToLet(e, n, digits) {
        // get the 100km-grid indices
        var e100k = Math.floor(e / 100000),
        n100k = Math.floor(n / 100000);

        if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12) return '';

        // translate those into numeric equivalents of the grid letters
        var l1 = (19 - n100k) - (19 - n100k) % 5 + Math.floor((e100k + 10) / 5);
        var l2 = (19 - n100k) * 5 % 25 + e100k % 5;

        // compensate for skipped 'I' and build grid letter-pairs
        if (l1 > 7) l1++;
        if (l2 > 7) l2++;
        var letPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0));

        // strip 100km-grid indices from easting & northing, and reduce precision
        e = Math.floor((e % 100000) / Math.pow(10, 5 - digits / 2));
        n = Math.floor((n % 100000) / Math.pow(10, 5 - digits / 2));

        Number.prototype.padLZ = function(w) {
            var n = this.toString();
            while (n.length < w) n = '0' + n;
            return n;
        }

        var gridRef = letPair + e.padLZ(digits / 2) + n.padLZ(digits / 2);

        return gridRef;
    }
	function gridrefLetToNum(gridref) {
	  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
	  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
	  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
	  // shuffle down letters after 'I' since 'I' is not used in grid:
	  if (l1 > 7) l1--;
	  if (l2 > 7) l2--;

	  // convert grid letters into 100km-square indexes from false origin (grid square SV):
	  var e = ((l1-2)%5)*5 + (l2%5);
	  var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);

	  // skip grid letters to get numeric part of ref, stripping any spaces:
	  gridref = gridref.slice(2).replace(/ /g,'');

	  // append numeric part of references to grid index:
	  e += gridref.slice(0, gridref.length/2);
	  n += gridref.slice(gridref.length/2);

	  // normalise to 1m grid, rounding up to centre of grid square:
	  switch (gridref.length) {
		case 2: e += '5000'; n += '5000'; break;
	    case 4: e += '500'; n += '500'; break;
	    case 6: e += '50'; n += '50'; break;
	    case 8: e += '5'; n += '5'; break;
	    // 10-digit refs are already 1m
	  }

	  return [e, n];
	}

// function to set layer visibility for the 1850s and 1900s OS layers at different zoom levels

   function setZoomLayers() {
	   
	  
	countynameold = countyname;	  
	sixinchenglandwalesfirst();

	var mapZoom = map.getView().getZoom();
	var mapZoomNo = parseInt(mapZoom);


	if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1900s (all scales)') && (mapZoomNo < 11 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS 1:1 million, 1905";

		           OS1900sGB.setVisible(true);
                           os25scotland.setVisible(false);
                           os25scotland2.setVisible(false);
		           oneinchscotlandfirstcol.setVisible(false);
                           sixinch.setVisible(false);
 }

	else if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1900s (all scales)') && (mapZoomNo > 10 ) && (mapZoomNo < 13 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS Quarter-Inch, 1900-1906"; 

		           OS1900sGB.setVisible(true);
                           os25scotland.setVisible(false);
                           os25scotland2.setVisible(false);
		           oneinchscotlandfirstcol.setVisible(false);
                           sixinch.setVisible(false);
 }

	else if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1900s (all scales)') && (mapZoomNo > 12 ) && (mapZoomNo < 15 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS One-Inch <strong>2nd edition</strong>, 1896-1911"; 

		           OS1900sGB.setVisible(true);
                           os25scotland.setVisible(false);
                           os25scotland2.setVisible(false);
		           oneinchscotlandfirstcol.setVisible(false);
                           sixinch.setVisible(false);
 }

	else if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1900s (all scales)') && (mapZoomNo > 14 ) && (mapZoomNo < 18 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS six-inch <strong>2nd edition</strong>, 1888-1913"; 

		           OS1900sGB.setVisible(true);
                           os25scotland.setVisible(false);
                           os25scotland2.setVisible(false);
		           oneinchscotlandfirstcol.setVisible(false);
                           sixinch.setVisible(false);
 }

	else if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1900s (all scales)') && (mapZoomNo > 17 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS 25 inch <strong>2nd edition</strong>, 1892-1905";

		           OS1900sGB.setVisible(true);
                           os25scotland.setVisible(true);
                           os25scotland2.setVisible(true);
		           oneinchscotlandfirstcol.setVisible(false);
                           sixinch.setVisible(false);
	 }

/*
	else if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1840s-1880s') && (mapZoomNo < 15 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS One-Inch <strong>1st edition</strong>, 1857-1891. Zoom in to view mills layer.";

		           oneinchscotlandfirstcol.setVisible(true);
                           sixinch.setVisible(false);
		           OS1900sGB.setVisible(false);
                           os25scotland.setVisible(false);
                           os25scotland2.setVisible(false);

	 }

	else if ((map.getLayers().getArray()[0].get('title') == 'Background - OS 1840s-1880s') && (mapZoomNo > 14 ))

	{    document.getElementById('zoom_statement').innerHTML = "Background map: OS Six-Inch <strong>1st edition</strong>, 1843-1882. Mills layer.";

		           oneinchscotlandfirstcol.setVisible(false);
                           sixinch.setVisible(true);
		           OS1900sGB.setVisible(false);
                           os25scotland.setVisible(false);
                           os25scotland2.setVisible(false);

	 }
	 
*/
	else
	{


 	document.getElementById('zoom_statement').innerHTML = "";

	}

	updateUrl();

}

function showinitialmillscount()

	{



	 var initialmills = map.getLayers().getArray()[1].getSource().getFeatures();

	 if (initialmills.length == 1)
		{
 		document.getElementById('filteredFeaturesTotal').innerHTML = '<p style="font-size:1.1em;"><strong>' + initialmills.length + ' mill feature.</strong></p>';
		}


		else if (initialmills.length > 1)
		{

			setTimeout( function(){

		 		document.getElementById('filteredFeaturesTotal').innerHTML = '<p style="font-size:1.1em;"><strong>' + initialmills.length + ' mill features.</strong></p>';

			

			}, 500); // delay 3000 ms
		}
		else
		{
 		document.getElementById('filteredFeaturesTotal').innerHTML = '0 mill features.';
		}

}

// the base map layers


	var osm = new ol.layer.Tile({
	  	title: 'Background - OpenStreetMap',
        	visible: false,
	  	source: new ol.source.OSM()
	});

// ESRI World Layers

	var esri_world_topo = new ol.layer.Tile({
		title: 'Background - ESRI World Topo',
        	visible: false,
		    source: new ol.source.XYZ({
			          attributions: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
			              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
			                  'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
	      	})
	    });

	var esri_world_imagery = new ol.layer.Tile({
		title: 'Background - ESRI World Imagery',
        	visible: false,
		    source: new ol.source.XYZ({
			          attributions:  'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">ArcGIS</a>',
			              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
			                  'World_Imagery/MapServer/tile/{z}/{y}/{x}'
	      	})
	    });


// Bing layers
	
	var BingSatellite =   new ol.layer.Tile({
		title: 'Background - Bing Satellite',
        	visible: false,
	        source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'Aerial'
		    })
	});

	var BingRoad = new ol.layer.Tile({
	        title: 'Background - Bing Road',
        	visible: false,
	        source: new ol.source.BingMaps({
		      key: BingapiKey,
		      imagerySet: 'Road'
		    })
	});

	var BingAerialWithLabels = new ol.layer.Tile({
	        title: 'Background - Bing Hybrid',
        	visible: false,
	        source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'AerialWithLabels'
		})
	});

	var maptiler_basic =  new ol.layer.Tile({
		title: 'Background - MapTiler Streets',
	        mosaic_id: '6',
            	source: new ol.source.TileJSON({
     		url: 'https://api.maptiler.com/maps/streets/256/tiles.json?key=7Y0Q1ck46BnB8cXXXg8X',
	      	attributions: '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/about/" target="_blank">© OpenStreetMap contributors</a>',
			tilePixelRatio: 1,
			tileSize: 256,
              crossOrigin: 'anonymous'
            })
          });

	var maptiler_satellite =  new ol.layer.Tile({
		title: 'Background - MapTiler Satellite Hybrid',
	        mosaic_id: '7',
            	source: new ol.source.TileJSON({
     		url: 'https://api.maptiler.com/maps/hybrid/256/tiles.json?key=7Y0Q1ck46BnB8cXXXg8X',
	      	attributions: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
			tilePixelRatio: 1,
			tileSize: 256,
              crossOrigin: 'anonymous'
            })
          });

	var OS1920s =  	new ol.layer.Tile({
	            title: 'Background - OS 1920s',
	            mosaic_id: '9',
	            type: 'base',
		    source: new ol.source.XYZ({
			          attributions: '<a href=\'https://maps.nls.uk/projects/api/\'>NLS Historic Maps API</a>',
				url: 'https://geo.nls.uk/maps/api/nls/{z}/{x}/{y}.jpg',
				// minZoom: 10,
				maxZoom: 13,
				tilePixelRatio: 1
		})
          });


// OS six-inch 1900s layer

	var OS1900sGB =  new ol.layer.Tile({
  	extent: ol.proj.transformExtent([-8.8, 49.8, 1.8, 60.9], 'EPSG:4326', 'EPSG:3857'),
	            title: 'Background - OS 1900s (all scales)',
	            mosaic_id: '7',
    		    visible: true,	
			source: new ol.source.TileJSON({
			          attributions:  '<a href=\'https://maps.nls.uk/projects/api/\'>NLS Historic Maps API layer</a>',
			        url: 'https://api.maptiler.com/tiles/uk-osgb1888/tiles.json?key=7Y0Q1ck46BnB8cXXXg8X',
			        tileSize: 256,
			        crossOrigin: 'anonymous'
				}),
			        type: 'base'

          });


// OS 25 inch south of scotland layer

	var os25scotland =  new ol.layer.Tile({
		extent: ol.proj.transformExtent([-7.70343904, 54.62907430, -2.00843774, 58.52833119], 'EPSG:4326', 'EPSG:3857'),
		    source: new ol.source.XYZ({
				url: 'https://geo.nls.uk/mapdata2/os/25_inch/scotland_1/{z}/{x}/{y}.png',
				minZoom: 1,
				maxZoom: 18

		}),

          });

// OS 25 inch whole of Scotland - old

	var os25scotland1 =  new ol.layer.Tile({
		extent: ol.proj.transformExtent([-7.70343904,54.62907430,-0.76245137,60.82129362], 'EPSG:4326', 'EPSG:3857'),
		    source: new ol.source.XYZ({
				url: 'https://geo.nls.uk/mapdata2/os/25_inch/scotland_1/{z}/{x}/{y}.png',
				minZoom: 8,
				maxZoom: 18

		}),

          });


// OS 25 inch north of scotland

	var os25scotland2 =  new ol.layer.Tile({
		    extent: ol.proj.transformExtent([-7.70335482, 54.95206041, -0.76245137, 60.82129362], 'EPSG:4326', 'EPSG:3857'),
		    source: new ol.source.XYZ({
				url: 'https://geo.nls.uk/mapdata2/os/25_inch/scotland_2/{z}/{x}/{y}.png',
				minZoom: 1,
				maxZoom: 18

		}),

          });



    var millsboundary = new ol.layer.Tile({
			preload: Infinity,
                        title: "Final Mills Boundary",
			type: 'overlay',
    			visible: true,	
    			source: new ol.source.XYZ({
      				url: "https://geoserver.nls.uk/geoserver/gwc/service/gmaps?layers=nls:final_mills_boundary&zoom={z}&x={x}&y={y}&format=image/png",
			attributions: '' }),
			opacity: 0.4
    });

// Group layer of OS six-inch and 25 inch layers, 1900s


	var OS1900sGBback  = new ol.layer.Group({
  			extent: ol.proj.transformExtent([-8.8, 49.8, 1.8, 60.9], 'EPSG:4326', 'EPSG:3857'),
                        preload: Infinity,
	            	title: "Background - OS 1900s (all scales)",
        		group_no: '34',
        		mosaic_id: '168',
			typename: 'nls:OS_25_Inch_Eng_Wal_Scot_WFS',
	layers: [OS1900sGB, os25scotland, os25scotland2 ],
			type: 'overlay', 
			keytext: 'View the individual sheets of this OS 25 inch mapping by selecting "Find by place" above.',
        		key: 'geo.nls.uk/mapdata2/os/25_inch/key/openlayers.html',
        		attribution: '<a href="https://maps.nls.uk/os/25inch-2nd-and-later/index.html" target="_blank">25 inch, 1892-1949 home page</a>',
			minx: -7.70343904,
			miny: 54.62907430,
			maxx: -0.76245137,
        		maxy: 60.82129362
    });

// OS one-inch first edition, 1850s-1890s

	var oneinchscotlandfirstcol  = new ol.layer.Tile({
  	 	extent: ol.proj.transformExtent([-8.19032986, 54.44456794, -0.63717663, 60.99295342], 'EPSG:4326', 'EPSG:3857'),
                        preload: Infinity,
	            	title: "Background - OS 1857-1891",
        		group_no: '38',
        		mosaic_id: '205',
        		typename: 'nls:OS_Scotland_one-inch_1st_col_WFS',
			source: new ol.source.XYZ({
				url: "https://geo.nls.uk/mapdata3/os/one-inch-first-bart38/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 15
		  	}),
			type: 'overlay', 
			keytext: 'View the individual sheets of this OS one-inch mapping by selecting "Find by place" above',
         		key: 'geo.nls.uk/maps/os/1inch_2nd_ed/key/openlayers.html',
        		attribution: 'Overlay NLS <a href="https://maps.nls.uk/os/one-inch-1st/index.html" target="_blank">Ordnance Survey One Inch, 1856-1891</a> maps', 
		        minx: -8.19032986, 
		        miny: 54.44456794, 
		        maxx: -0.63717663, 
		        maxy: 60.99295342,
			maxZoom: 15
    });

// OS six-inch first edition, 1840s-1880s

	var sixinch  = new ol.layer.Tile({
  	 	extent: ol.proj.transformExtent([-9.4, 54.5, -0.6, 60.9], 'EPSG:4326', 'EPSG:3857'),
                        preload: Infinity,
	            	title: "Background - OS Six Inch, 1843-1882",
        		group_no: '35',
        		mosaic_id: '5',
        		typename: 'nls:WFS',
			source: new ol.source.XYZ({
				url: "https://geo.nls.uk/mapdata3/os/6inchfirst/{z}/{x}/{y}.png",
				minZoom: 1,
				maxZoom: 16
		  	}),
			type: 'overlay', 
			keytext: 'View the individual sheets of this OS six-inch mapping by selecting "Find by place" above',
        		key: 'geo.nls.uk/mapdata3/os/6inchfirst/key/openlayers.html',
        		attribution: 'Overlay NLS <a href="https://maps.nls.uk/os/6inch/index.html" target="_blank">Ordnance Survey Six Inch, 1843-1882</a> maps', 
		        minx: -9.4, 
		        miny: 54.5, 
		        maxx: -0.6, 
		        maxy: 60.9
    });

// Group layer of OS six-inch and one-inch 1st edition, 1840s-1880s maps

	var OS1850sGBback  = new ol.layer.Group({
  			extent: ol.proj.transformExtent([-8.8, 49.8, 1.8, 60.9], 'EPSG:4326', 'EPSG:3857'),
                        preload: Infinity,
	            	title: "Background - OS 1840s-1880s",

			typename: 'nls:OS_25_Inch_Eng_Wal_Scot_WFS',
	layers: [oneinchscotlandfirstcol, sixinch ],
			type: 'overlay', 
			keytext: 'View the individual sheets of this OS 25 inch mapping by selecting "Find by place" above.',
        		key: 'geo.nls.uk/mapdata2/os/25_inch/key/openlayers.html',
        		attribution: '<a href="https://maps.nls.uk/os/25inch-2nd-and-later/index.html" target="_blank">25 inch, 1892-1949 home page</a>',
			minx: -7.70343904,
			miny: 54.62907430,
			maxx: -0.76245137,
        		maxy: 60.82129362
    });

	var stamentoner = new ol.layer.Tile({
		title: 'Background - Stamen Toner',
	        source: new ol.source.Stamen({
				attributions: 'Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="https://www.openstreetmap.org/copyright">ODbL</a>.',
	        		layer: 'toner'
	      })
	    });
		
	var OSMapsAPI = new ol.layer.Tile({
		      preload: Infinity,
	              title: 'Background - OS Maps API',
	              mosaic_id: '8',
	              type: 'base',
    			visible: false,	
		      source: new ol.source.XYZ({
				    attributions: 'Contains OS data © Crown copyright and database right 2022',
				    url: 'https://api.os.uk/maps/raster/v1/zxy/Light_3857/{z}/{x}/{y}.png?key=' + 'Rt69sv62Dv1JNAvlJAcM0upXIaIcpua8',
				    minZoom: 7,
					crossOrigin: 'anonymous'
				  })
	                    });

	var OSMapsLeisure = new ol.layer.Tile({
		title: 'Background - OS Maps Leisure',
		mosaic_id: '10'
			});
	
	const parser = new ol.format.WMTSCapabilities();
	
		fetch('https://api.os.uk/maps/raster/v1/wmts?key=Q9ESJToD1he64kb6Aacq2Wqjy2EMhkUY&service=WMTS&request=GetCapabilities&version=2.0.0')
		  .then(function (response) {
			return response.text();
		  })
		  .then(function (text) {
			const result = parser.read(text);
			const options = ol.source.WMTS.optionsFromCapabilities(result, {
                layer: 'Leisure_27700',
                matrixSet: 'EPSG:27700',
				maxZoom: 9,

			});
			options.crossOrigin = '';
			options.projection = 'EPSG:27700';
			options.attributions = 'Contains OS data © Crown copyright and database right 2024'
			options.wrapX = false;
			OSMapsLeisure.setSource(new ol.source.WMTS(options));
		  });

		const startResolution = ol.extent.getWidth([ -238375.0, 0.0, 900000.0, 1376256.0 ]) / 256;
		const resolutions = new Array(22);
		for (let i = 0, ii = resolutions.length; i < ii; ++i) {
		  resolutions[i] = startResolution / Math.pow(2, i);
		}




	var maptiler_toner =  new ol.layer.Tile({
		title: 'Background - MapTiler Toner',
	        mosaic_id: '10',
            	source: new ol.source.TileJSON({
     		url: 'https://api.maptiler.com/maps/toner-v2/tiles.json?key=7Y0Q1ck46BnB8cXXXg8X',
	      	attributions: '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/about/" target="_blank">© OpenStreetMap contributors</a>',
        tileSize: 512,
        crossOrigin: 'anonymous'

            })
          });



	var ossixinchanglesey =  new ol.layer.Tile({
				preload: Infinity,
				title: "anglesey",
				extent: ol.proj.transformExtent([-4.70822606, 53.10695252, -3.95877750, 53.44307029], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-anglesey/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });	

	var ossixinchbedfordshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "bedfordshire",
				extent: ol.proj.transformExtent([-0.73860654, 51.80177393, -0.07928395, 52.36920579], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-bedfordshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchberkshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "berkshire",
				extent: ol.proj.transformExtent([-1.76448222, 51.33867346, -0.49661743, 51.75420135], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-berkshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchbrecknockshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "brecknockshire",
				extent: ol.proj.transformExtent([-3.83302370, 51.72255696, -2.96463696, 52.31643523], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-brecknockshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchbuckinghamshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "buckinghamshire",
				extent: ol.proj.transformExtent([-1.20609259, 51.45345349, -0.34715650, 52.21354699], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-buckinghamshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchcaernarvonshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "carnarvonshire",
				extent: ol.proj.transformExtent([-4.83772362, 52.72804067, -3.66902968, 53.35824836], 'EPSG:4326', 'EPSG:3857'),  
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-caernarvonshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchcambridgeshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "cambridgeshire",
				extent: ol.proj.transformExtent([-0.30187833, 51.99682034, 0.57644998, 52.76697979], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-cambridgeshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchcardiganshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "cardiganshire",
				extent: ol.proj.transformExtent([-4.74849006, 52.03529431, -3.59629922, 52.57721898], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-cardiganshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchcarmarthenshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "carmarthenshire",
				extent: ol.proj.transformExtent([-4.81319968, 51.63266739, -3.66565276, 52.14330879], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-carmarthenshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchcheshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "cheshire",
				extent: ol.proj.transformExtent([-3.27902276, 52.91838627, -1.66216040, 53.58222096], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-cheshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchcornwall =  new ol.layer.Tile({
				preload: Infinity,
				title: "cornwall",
				extent: ol.proj.transformExtent([-6.46682269, 49.85110618, -2.87995937, 51.27630402], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-cornwall/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchcumberland =  new ol.layer.Tile({
				preload: Infinity,
				title: "cumberland",
				extent: ol.proj.transformExtent([-3.65274760, 54.14598623, -2.28687066, 55.20163183], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-cumberland/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchdenbighshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "denbighshire",
				extent: ol.proj.transformExtent([-3.98553436, 52.78318593, -2.81622748, 53.37273205], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-denbighshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchderbyshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "derbyshire",
				extent: ol.proj.transformExtent([-2.08215431, 52.66707210, -1.18710220, 53.52059220], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-derbyshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchdevonshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "devon",
				extent: ol.proj.transformExtent([-4.73106757, 50.18885425, -2.87995937, 51.27630402], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-devonshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchdorset =  new ol.layer.Tile({
				preload: Infinity,
				title: "dorset",
				extent: ol.proj.transformExtent([-3.08388331, 50.55380924, -1.75945685, 51.08972505], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-dorset/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchdurham =  new ol.layer.Tile({
				preload: Infinity,
				title: "durham",
				extent: ol.proj.transformExtent([-2.35428232, 54.43164746, -1.13594610, 55.01871376], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-durham/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchessex =  new ol.layer.Tile({
				preload: Infinity,
				title: "essex",
				extent: ol.proj.transformExtent([-0.07793774, 51.39216030, 1.35102788, 52.10392090], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-essex/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchflintshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "flintshire",
				extent: ol.proj.transformExtent([-3.55477297, 52.88839407, -2.67269474, 53.37357586], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-flintshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchglamorgan =  new ol.layer.Tile({
				preload: Infinity,
				title: "glamorgan",
				extent: ol.proj.transformExtent([-4.38964158, 51.34647321, -3.10634652, 51.82602336], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-glamorgan/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchgloucestershire =  new ol.layer.Tile({
				preload: Infinity,
				title: "gloucestershire",
				extent: ol.proj.transformExtent([-4.03961209, 51.33968922, -0.90964425, 53.15097261], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-gloucestershire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchhampshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "hampshire",
				extent: ol.proj.transformExtent([-2.02544319, 50.53057919, -0.64068129, 51.40880981], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-hampshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchherefordshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "herefordshire",
				extent: ol.proj.transformExtent([-3.26609347, 51.80490885, -2.25997751, 52.40271057], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-herefordshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchhertfordshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "hertfordshire",
				extent: ol.proj.transformExtent([-0.76004989, 51.65690079, 0.27406867, 52.14164929], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-hertfordshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchhuntingdonshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "huntingdonshire",
				extent: ol.proj.transformExtent([-0.58163674, 52.17015726, 0.00970886, 52.59119801], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-huntingdonshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchisleofman =  new ol.layer.Tile({
				preload: Infinity,
				title: "isle-of-man",
				extent: ol.proj.transformExtent([-4.91410724, 53.99496767, -4.29020577, 54.47599762], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-isle-of-man/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchkent =  new ol.layer.Tile({
				preload: Infinity,
				title: "kent",
				extent: ol.proj.transformExtent([-0.13230712, 50.87696793, 1.55494474, 51.52646281], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-kent/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchlancashire =  new ol.layer.Tile({
				preload: Infinity,
				title: "lancashire",
				extent: ol.proj.transformExtent([-3.34953982, 53.27412979, -2.00245378, 54.43956121], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-lancashire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchleicestershire =  new ol.layer.Tile({
				preload: Infinity,
				title: "leicestershire",
				extent: ol.proj.transformExtent([-1.56809267, 52.37842562, -0.61367410, 52.97169452], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-leicestershire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchlincolnshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "lincolnshire",
				extent: ol.proj.transformExtent([-0.99263845, 52.60340445, 0.40471046, 53.75179568], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-lincolnshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchmerionethshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "merionethshire",
				extent: ol.proj.transformExtent([-4.19546642, 52.53066827, -3.16650414, 53.06922163], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-merionethshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchmiddlesex =  new ol.layer.Tile({
				preload: Infinity,
				title: "middlesex",
				extent: ol.proj.transformExtent([-0.59606089, 51.37107040, 0.12691131, 51.73294955], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-middlesex/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchmonmouthshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "monmouthshire",
				extent: ol.proj.transformExtent([-3.26759704, 51.46071009, -2.54967005, 51.99574592], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-monmouthshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchmontgomeryshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "montgomeryshire",
				extent: ol.proj.transformExtent([-3.90541173, 52.32955888, -2.95586150, 52.89505655], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-montgomeryshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchnorfolk =  new ol.layer.Tile({
				preload: Infinity,
				title: "norfolk",
				extent: ol.proj.transformExtent([0.11971241, 52.34420634, 1.79045025, 53.00032255], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-norfolk/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchnorthamptonshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "northamptonshire",
				extent: ol.proj.transformExtent([-1.35148680, 51.94472910, -0.11672131, 52.67991530], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-northamptonshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchnorthumberland =  new ol.layer.Tile({
				preload: Infinity,
				title: "northumberland",
				extent: ol.proj.transformExtent([-2.78342353, 54.75371509, -1.39774108, 55.80630644], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-northumberland/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchnottinghamshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "nottinghamshire",
				extent: ol.proj.transformExtent([-1.35477585, 52.78362435, -0.68174336, 53.52166829], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-nottinghamshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchoxfordshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "oxfordshire",
				extent: ol.proj.transformExtent([-1.76536786, 51.45586530, -0.91140587, 52.23582116], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-oxfordshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchpembrokeshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "pembrokeshire",
				extent: ol.proj.transformExtent([-5.51250296, 51.58657409, -4.43501788, 52.15161019], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-pembrokeshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchradnorshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "radnorshire",
				extent: ol.proj.transformExtent([-3.69085467, 52.06838778, -2.95840753, 52.43243340], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-radnorshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchrutland =  new ol.layer.Tile({
				preload: Infinity,
				title: "rutland",
				extent: ol.proj.transformExtent([-0.85430408, 52.52179490, -0.40172778, 52.76867135], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-rutland/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchshropshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "shropshire",
				extent: ol.proj.transformExtent([-3.26525491, 52.29681800, -2.16947522, 53.00854230], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-shropshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchstaffordshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "staffordshire",
				extent: ol.proj.transformExtent([-2.57204802, 52.37344222, -1.47397888, 53.23018604], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-staffordshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchsomerset =  new ol.layer.Tile({
				preload: Infinity,
				title: "somerset",
				extent: ol.proj.transformExtent([-3.91639737, 50.78463309, -2.16984416, 51.52456241], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-somerset/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchsuffolk =  new ol.layer.Tile({
				preload: Infinity,
				title: "suffolk",
				extent: ol.proj.transformExtent([0.33816417, 51.91023272, 1.78874454, 52.62004453], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-suffolk/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchsurrey =  new ol.layer.Tile({
				preload: Infinity,
				title: "surrey",
				extent: ol.proj.transformExtent([-0.98366010, 51.05286083, 0.14707134, 51.53026438], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-surrey/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchsussex =  new ol.layer.Tile({
				preload: Infinity,
				title: "sussex",
				extent: ol.proj.transformExtent([-1.00226772, 50.68124861, 0.93989706, 51.15881807], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-sussex/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchwestmorland =  new ol.layer.Tile({
				preload: Infinity,
				title: "westmorland",
				extent: ol.proj.transformExtent([-3.18096083, 54.16634273, -2.12158129, 54.75514155], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-westmorland/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchwarwickshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "warwickshire",
				extent: ol.proj.transformExtent([-1.98780445, 51.94370355, -1.18712985, 52.68189716], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-warwickshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var ossixinchwiltshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "wiltshire",
				extent: ol.proj.transformExtent([-2.38703695, 50.90104518, -1.46114600, 51.66583860], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-wiltshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchworcestershire =  new ol.layer.Tile({
				preload: Infinity,
				title: "worcestershire",
				extent: ol.proj.transformExtent([-2.69647884, 51.93906180, -1.47071029, 52.53481539], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-worcestershire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });

	var ossixinchyorkshire =  new ol.layer.Tile({
				preload: Infinity,
				title: "yorkshire",
				extent: ol.proj.transformExtent([-2.64266454, 53.28575555, 0.17857727, 54.67954709], 'EPSG:4326', 'EPSG:3857'),
				source: new ol.source.XYZ({
					url: "https://geo.nls.uk/mapdata2/os/six-inch-yorkshire/{z}/{x}/{y}.png", 
				tileSize: 256,	
				tilePixelRatio: 1,
				// visible: true,
				crossOrigin: 'anonymous'
		}),
    });
	
	var sixinchscotlayer  = new ol.layer.Tile({
  	 	extent: ol.proj.transformExtent([-9.4, 54.5, -0.6, 60.9], 'EPSG:4326', 'EPSG:3857'),
                        preload: Infinity,
	            	title: "scotland",
				source: new ol.source.XYZ({
				url: "https://geo.nls.uk/mapdata3/os/6inchfirst/{z}/{x}/{y}.png",

				tileSize: 256,
				crossOrigin: 'anonymous'
		  	}),


    });
	
	var ossixinchfirstgreatbritain  = new ol.layer.Group({
            preload: Infinity,
	        title: "Background - OS Six-Inch, 1840s-1880s",
        		group_no: '35',
        		mosaic_id: '257',
			typename: 'nls:6in_Eng_Scot_Wal_1st',
			layers: [ ossixinchanglesey, ossixinchbedfordshire, ossixinchberkshire, ossixinchbrecknockshire, ossixinchbuckinghamshire, ossixinchcaernarvonshire, ossixinchcambridgeshire, ossixinchcardiganshire, ossixinchcarmarthenshire, ossixinchcheshire, ossixinchcornwall, ossixinchcumberland, ossixinchdenbighshire, ossixinchderbyshire, ossixinchdevonshire, ossixinchdorset, ossixinchdurham, ossixinchessex, ossixinchflintshire, ossixinchglamorgan, ossixinchgloucestershire, ossixinchhampshire, ossixinchherefordshire, ossixinchhertfordshire, ossixinchhuntingdonshire, ossixinchisleofman, ossixinchkent, ossixinchlancashire, ossixinchleicestershire, ossixinchlincolnshire, ossixinchmerionethshire, ossixinchmiddlesex, ossixinchmonmouthshire, ossixinchmontgomeryshire, ossixinchnorfolk, ossixinchnorthumberland, ossixinchnottinghamshire, ossixinchnorthamptonshire, ossixinchoxfordshire, ossixinchpembrokeshire, ossixinchradnorshire, ossixinchrutland, ossixinchshropshire, ossixinchstaffordshire, ossixinchsomerset, ossixinchsuffolk, ossixinchsurrey, ossixinchsussex, ossixinchwestmorland, ossixinchwarwickshire, ossixinchwiltshire, ossixinchworcestershire, ossixinchyorkshire, sixinchscotlayer  ],
			tileSize: 256,
			crossOrigin: 'anonymous',
			tilePixelRatio: 1,
			keytext: 'View the individual sheets of this OS 25 inch mapping by selecting "Find by place" above.',
        		key: 'maps.nls.uk/view-sp/74477147',
        		attribution: 'Overlay NLS <a href="/os/6inch-england-and-wales/" target="_blank">Ordnance Survey Six Inch, 1843-1882</a> maps', 
			minx: -12.86, 
			miny: 49.82, 
			maxx: 1.79, 
        	maxy: 60.9,
			maxZ: 16
    });


// an array of the base layers listed above

	var baseLayers = [ OS1900sGBback, ossixinchfirstgreatbritain, esri_world_topo, esri_world_imagery, maptiler_basic, maptiler_satellite, maptiler_toner, osm, OSMapsAPI, OSMapsLeisure  ];

// sets background layer to be visible

	OS1900sGBback.setVisible(true);

// create default text in Results panel with nothing selected

        setResults();

// parse the URL after the # character to obtain URL parameters

	function splitWindowLocationHash()
		{
			args = [];
			var hash = window.location.hash;
			if (hash.length > 0)
			{
				var elements = hash.split('&');
				elements[0] = elements[0].substring(1); /* Remove the # */
		
				for(var i = 0; i < elements.length; i++)
				{
					var pair = elements[i].split('=');
					args[pair[0]] = pair[1];
				}
			}
		}


	splitWindowLocationHash();

		var currentZoom = DEFAULT_ZOOM;
		var currentLat = DEFAULT_LAT;
		var currentLon = DEFAULT_LON;
		var currentID = DEFAULT_ID;
		if (args['zoom'])
		{
			currentZoom = args['zoom'];
		}
		if (args['lat'] && args['lon'])
		{
			currentLat = parseFloat(args['lat']); 
			currentLon = parseFloat(args['lon']);		
		}
		if (args['id'])
		{
			currentID = args['id'];
		}



// updates the URL after the # with the map zoom, lat and lon, and point paremeter

	function updateUrl()
		{

			var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");

			 if (currentID == undefined)
			 {
				currentID == '0';
			 }

			 if (currentID > 0)

			 {

			window.location.hash = "zoom=" + map.getView().getZoom().toFixed(1)  + "&lat=" + centre[1].toFixed(5)  + "&lon=" + centre[0].toFixed(5) + "&id=" + currentID; 
			 }

			else
	
			{
			window.location.hash = "zoom=" + map.getView().getZoom().toFixed(1)  + "&lat=" + centre[1].toFixed(5)  + "&lon=" + centre[0].toFixed(5); 
			}

		updatemillsinview();

	}

// sets up the base layers as a drop-down list

	    var layerSelect = document.getElementById('layerSelect');
	    for (var x = 0; x < baseLayers.length; x++) {
	        // if (!baseLayers[x].displayInLayerSwitcher) continue;
	        var option = document.createElement('option');
		option.appendChild(document.createTextNode(baseLayers[x].get('title')));
	        option.setAttribute('value', x);
	        option.setAttribute('id', 'baseOption' + baseLayers[x].get('title'));
	        layerSelect.appendChild(option);
	    }


// mill type categories for the maps

	all = ({ name: "All Mill Types", searchterm: "" });
	
	engine = ({ name: "Engine", searchterm: "postype:%25engine%25;" });
	forge = ({ name: "Forge", searchterm: "postype:%25forge%25;" });
	furnace = ({ name: "Furnace", searchterm: "postype:%25furnace%25;" });
	horizontal_mill = ({ name: "Horizontal Mill", searchterm: "postype:%25horizontal%20mill%25;" });
	horse_mill = ({ name: "Horse Mill", searchterm: "postype:%25horse%25;" });
	mill = ({ name: "Mill", searchterm: "postype:mill%25;" });
	watermill = ({ name: "Watermill", searchterm: "postype:%25watermill%25;" });
	windmill = ({ name: "Windmill", searchterm: "postype:%25windmill%25;" });


// an array of the mill type categories

	var subjects = [ all, engine, forge, furnace, horizontal_mill, horse_mill, mill, watermill, windmill];

// sets up the mill types as a drop-down list

	    var milltypeSelect = document.getElementById('milltypeselect');
	    for (var x = 0; x < subjects.length; x++) {
	        var option = document.createElement('option');
		option.appendChild(document.createTextNode(subjects[x].name));
	        option.setAttribute('value', x);
	        option.setAttribute('id',  subjects[x].name);
	        milltypeSelect.appendChild(option);
	    }


// mill symbol categories for the maps

	allS = ({ name: "All Mill Symbols", searchterm: "" });
	
	building = ({ name: "Building", searchterm: "possymbol:%25building%25;" });
	circle = ({ name: "Circle", searchterm: "possymbol:%25circle%25;" });
	drainmill = ({ name: "Drainmill", searchterm: "possymbol:%25drainmille%25;" });
	engineS = ({ name: "Engine", searchterm: "possymbol:%25engine%25;" });
	factory = ({ name: "Factory", searchterm: "possymbol:%25factory%25;" });
	forgeS = ({ name: "Forge", searchterm: "possymbol:forge%25;" });
	furnaceS  = ({ name: "Furnace", searchterm: "possymbol:%25furnace%25;" });
	millS = ({ name: "Mill", searchterm: "possymbol:mill%25;" });
	steam_windmill = ({ name: "Steam Windmill", searchterm: "possymbol:%25steam%20windmill%25;" });
	text = ({ name: "Text", searchterm: "possymbol:%25text%25;" });
	waterwheel = ({ name: "Waterwheel", searchterm: "possymbol:%25waterwheel%25;" });
	windmillS = ({ name: "Windmill", searchterm: "possymbol:%25windmill%25;" });
		
// an array of the mill symbol categories

	var symbols = [ allS, building, circle, drainmill, engineS, factory, forgeS, furnaceS, millS, steam_windmill, text, waterwheel, windmillS ];

// sets up the mill symbols as a drop-down list

	    var millsymbolSelect = document.getElementById('millsymbolselect');
	    for (var x = 0; x < symbols.length; x++) {
	        var option = document.createElement('option');
		option.appendChild(document.createTextNode(symbols[x].name));
	        option.setAttribute('value', x);
	        option.setAttribute('id',  symbols[x].name);
	        millsymbolSelect.appendChild(option);
	    }






   var StyleFunction_mills_selected = function(feature, resolution) {

 		 var radius_tour_1 = '7';
                var strokewidth = '3';
                if(resolution>100) {
                    radius_tour_1 = '4';
			   strokewidth = '0.5';
			}
			else if(resolution>200) {
                   radius_tour_1 = '5';
                   strokewidth = '1';
               }

                return [new ol.style.Style({
               image: new ol.style.Circle({
                   radius: radius_tour_1,
                   fill: new ol.style.Fill({
                       color: 'rgba(255, 153, 0,0.9)',
                   }),
                   stroke: new ol.style.Stroke({
                       color: 'rgba(0, 0, 0, 0.9)',
                       width: strokewidth
                   })
               })
           })];
            };



	var invisible = new ol.style.Style({});
	
    var MillLine_peat_moor = new ol.layer.Tile({
			title: "MillLine_peat_moor",
	  		mosaic_id: '0',
			visible: true,
			typename: 'nls:MillLine_peat_moor',
    			source: new ol.source.XYZ({
      				url: "https://geoserver3.nls.uk/geoserver/gwc/service/gmaps?layers=nls:MillLine_peat_moor&zoom={z}&x={x}&y={y}&format=image/png",

  			        attributions: '' })   
    });

    var MillsofBritain_17291836 = new ol.layer.Tile({
			title: "MillsofBritain_17291836",
	  		mosaic_id: '0',
			visible: true,
			typename: 'nls:MillsofBritain_17291836',
    			source: new ol.source.XYZ({
      				url: "https://geoserver3.nls.uk/geoserver/gwc/service/gmaps?layers=nls:MillsofBritain_17291836&zoom={z}&x={x}&y={y}&format=image/png",

  			        attributions: '' })   
    });

	      var attribution = new ol.control.Attribution({
	        collapsible: false
	      });


// maximum geographic extents of the map viewer window

		var maxExtent = [-1135346.8784413887, 6860830.640808259, 36279.89111379313, 8626831.74230897];

// the main OpenLayers map definition, with controls, layers and extents

		var map = new ol.Map({
		  target: document.getElementById('map'),

		  controls: ol.control.defaults({attribution: false}).extend([attribution]),
		  interactions : ol.interaction.defaults({doubleClickZoom :false}),
		  layers: [OS1900sGBback, MillLine_peat_moor, MillsofBritain_17291836],
		  logo: false,
		  view: new ol.View({
		    center: ol.proj.transform([currentLon, currentLat], 'EPSG:4326', 'EPSG:3857'),
		    zoom: currentZoom,
//		    extent: maxExtent,
		    minZoom: 5,
			enableRotation: false
		  })
		});

	      function checkSize() {
	        var small = map.getSize()[0] < 800;
	        attribution.setCollapsible(small);
	        attribution.setCollapsed(small);
	      }checkSize
	
	      window.addEventListener('resize', checkSize);
	      checkSize();

	setZoomLayers();

	map.getLayers().getArray()[1].setVisible(true);


	jQuery('#mapslider').slider({
	  formater: function(value) {
	    opacity = value / 100;
	    map.getLayers().getArray()[1].setOpacity(opacity);
	    // overlay.layer.setOpacity(opacity);
	    return 'Opacity: ' + value + '%';
	  }
	});

	jQuery( "#mapslider" ).slider('setValue',70);

/*
	document.getElementById('peat_moor_checkbox').addEventListener('change', function() {
	
			if (this.checked) 
			{ 
				map.getLayers().getArray()[1].setVisible(true);
			}
			else
			{
				map.getLayers().getArray()[1].setVisible(false);
			}
	});
*/

// Initiate filter function if mill type changed

	var changemilltype = function(index) {
		milltypes = subjects[index].name;

		dates = [];
		dates = $( "#dateslider" ).slider('getValue');
		minyearslider = dates[0];
		maxyearslider = dates[1];
		
//		console.log("dates[0]: " + dates[0] + " dates[1]: " + dates[1]);
		filter(minyearslider, maxyearslider);


	}
	
// Initiate filter function if mill symbol type changed

	var changesymboltype = function(index) {
		symboltypes = symbols[index].name;

		dates = [];
		dates = $( "#dateslider" ).slider('getValue');
		minyearslider = dates[0];
		maxyearslider = dates[1];
		
//		console.log("dates[0]: " + dates[0] + " dates[1]: " + dates[1]);
		filter(minyearslider, maxyearslider);


	}


	document.getElementById('onlyshow275').addEventListener('change', function(){

		dates = [];
		dates = $( "#dateslider" ).slider('getValue');
		minyearslider = dates[0];
		maxyearslider = dates[1];
		
//		console.log("dates[0]: " + dates[0] + " dates[1]: " + dates[1]);
		filter(minyearslider, maxyearslider);
	 	});

	document.getElementById('onlyshow425').addEventListener('change', function(){

		dates = [];
		dates = $( "#dateslider" ).slider('getValue');
		minyearslider = dates[0];
		maxyearslider = dates[1];
		
//		console.log("dates[0]: " + dates[0] + " dates[1]: " + dates[1]);
		filter(minyearslider, maxyearslider);
	 	});

function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}


function sixinchenglandwalesfirst()   {
	
		if (map.getLayers().getArray()[0].get('title') == 'Background - OS Six-Inch, 1840s-1880s')
			

			
			{



/*
					if (map.getLayers().getArray().length > 11)					
					if (map.getLayers().getArray()[11].get('title') == 'vectors - SixInchCount')	

					{ map.getLayers().removeAt(11); }
*/
			if  (map.getView().getZoom() > 12)
				
				{
					


					var point3857 = map.getView().getCenter();
					
					var lat = point3857[1].toFixed(5);
					var lon = point3857[0].toFixed(5);
					var left = (lon - 10);
					var right = (lon + 10);
					var bottom = (lat - 10);
					var top = (lat + 10);
					
					var bboxextent = left +',' + bottom + ',' + right + ',' + top ;
					
					// console.log("bboxextent: " + bboxextent );

					var geojsonFormat = new ol.format.GeoJSON();
					
					var urlgeoserverSixInch =  'https://geoserver2.nls.uk/geoserver/wfs?service=WFS' + 
							'&version=1.1.0&request=GetFeature&typename=nls:england_wales_ireland_counties' +
							'&PropertyName=(the_geom,COUNTY)&outputFormat=text/javascript&format_options=callback:loadFeaturesSixInch' +
							'&srsname=EPSG:900913&bbox=' + bboxextent + ',EPSG:3857&';
					
					// console.log("urlgeoserver:" + urlgeoserverSixInch);
							
					var ajaxgeoserver = $.ajax({url: urlgeoserverSixInch, dataType: 'jsonp', cache: false })

					vectorSourceSixInch = new ol.source.Vector({
					  loader: function(extent, resolution, projection) {
						ajaxgeoserver;
					  },
					  strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
						maxZoom: 19
					  }))
					});
					
					
					window.loadFeaturesSixInch = function(response) {
						 vectorSourceSixInch.addFeatures(geojsonFormat.readFeatures(response));			


					var featuresALL = response.features;
					
					 console.log("featuresALL.length:" + featuresALL.length);
					
					if (featuresALL.length < 1)
								{	    
						
								return;
								}
							
							
							  else  {

								countyname = featuresALL[0].properties.COUNTY;
								const countynameTitle = toTitleCase(countyname);
								console.log(countyname);
								
								
								 map.getLayers().getArray()[0].getLayers().forEach(function(layer) {
									if (layer.get('title') === countyname) {
									  overlaySelectedSixInchLayer = layer;								  
									}								
								});
								

								if (countynameold != countyname)
								
								{
//									ossixinchfirstgreatbritain.getLayers().getArray().remove(overlaySelectedSixInchLayer);
									ossixinchfirstgreatbritain.getLayers().getArray().push(overlaySelectedSixInchLayer);	
									
									$("#showCoordinatesinfo").removeClass("hidden");
									jQuery('#showCoordinatesinfo').show();
				
									$("#showCoordinatesinfo").css({ 'text-align': 'center' });
										$("#showCoordinatesinfo").css({ 'min-width': '250px' });
									document.getElementById('showCoordinatesinfo').innerHTML = 'The current layer on top is <strong>' + countynameTitle + '</strong>';
	
									if (map.getLayers().getArray().length > 5)	{	
										if (map.getLayers().getArray()[5].get('title') == 'vectors - SixInchCount')
										{ map.getLayers().getArray()[5].setStyle(redvector); }
									}
									
										var iconFeature = new ol.Feature();
		
									var iconStyle = new ol.style.Style({
									  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
										anchor: [10, 10],
										anchorXUnits: 'pixels',
										anchorYUnits: 'pixels',
										src: 'https://maps.nls.uk/geo/img/cross.png'
									  }))
									});
									
								
									iconFeature.setStyle(iconStyle);
								
									var vectorSource = new ol.source.Vector({
									  features: [iconFeature]
									});
									
									var vectorLayerMouseCross = new ol.layer.Vector({
									  source: vectorSource,
									  title: 'vectorMouseCross'
									});
									
			/*			
										var maplayerlength = map.getLayers().getLength();
										map.getLayers().insertAt(maplayerlength,vectorLayerMouseCross);
										iconFeature.setGeometry( new ol.geom.Point(point3857) );											
			*/
									

									
									setTimeout( function(){
											document.getElementById('showCoordinatesinfo').innerHTML = '';
			//							iconFeature.setGeometry(null);
										jQuery('#showCoordinatesinfo').hide();

										if (map.getLayers().getArray().length > 5)	{
											if (map.getLayers().getArray()[5].get('title') == 'vectors - SixInchCount')
											{ map.getLayers().getArray()[5].setStyle(invisiblestyle); }
										}
										
									}, 5000); // delay 50 ms
								}
							  }



						var vectorLayerSixInch = new ol.layer.Vector({
						mosaic_id: '200',
						title: "vectors - SixInchCount",
							source: vectorSourceSixInch,
						style: new ol.style.Style({
							fill: new ol.style.Fill({
							  color: 'rgba(0, 0, 0, 0)'
							}),
							stroke: new ol.style.Stroke({
							  color: 'rgba(250, 0, 0, 0.5)',
							  width: 1
								})
							})
						});


					if (map.getLayers().getArray().length > 5)					
					if (map.getLayers().getArray()[5].get('title') !== 'vectors - SixInchCount')	
					
						{
							map.getLayers().insertAt(5,vectorLayerSixInch);
						}
					};
				}

				else
					
					{


					if (map.getLayers().getArray().length > 5)					
					if (map.getLayers().getArray()[5].get('title') == 'vectors - SixInchCount')	

					{ map.getLayers().removeAt(5); }
					}


					return;
			}
	
		else
			
			{
			document.getElementById('showCoordinatesinfo').innerHTML = '';
			return;
			}
}



	
	   jQuery( "#dateslider" ).slider({
	      tooltip: 'always',
	      range: true,
	      min: 1710,
	      max: 1850,
	      values: [ 1720, 1840 ],
	      formater: function(value) {
		return value  }

	    });

	jQuery( "#dateslider" ).slider('setValue',[1720,1840]);




	$( "#dateslider" ).on( "slideStop", function( event, ui ) 

		{ 
		dates = [];
		dates = $( "#dateslider" ).slider('getValue');
		minyearslider = dates[0];
		maxyearslider = dates[1];
		
//		console.log("dates[0]: " + dates[0] + " dates[1]: " + dates[1]);
		filter(minyearslider, maxyearslider);
//		updatedatrange();
		}
	);




// updatedatrange();

// listener on the onlyshowwatermills checkbox


//	document.getElementById('onlyshowwatermills').addEventListener('change', function(){
//			filter();
//	 	});


// listener on the notincanmoremills checkbox

//	document.getElementById('notincanmoremills').addEventListener('change', function(){
//			filter();
// 	});

// filters the Mill GeoJSON features by subject and date

function filter(minyearslider, maxyearslider) {
	
	document.getElementById('filteredFeaturesInMap').innerHTML = '';
	
	if (minyearslider == undefined) { minyearslider = 1720; };
	if (maxyearslider == undefined) { maxyearslider = 1840; };
	
	console.log("minyearslider: " + minyearslider + " maxyearslider: " + maxyearslider);

		FeaturesFromGeoServer = [];
		filteredFeatures = [];
		filteredFeatures2 = [];
		filteredFeatures3 = [];
		filteredFeatures4 = [];
		filteredFeatures5 = [];
		filteredFeaturesFinal = [];

	filterinprocess = true;



// clear the destination layer for the filtered mill records

	deselect();

	if (vectorSource) { vectorSource.clear(); }
	map.getLayers().getArray()[2].getSource().clear();

// makes existing mills layer invisible

	if (map.getLayers().getLength() > 3) map.getLayers().removeAt(3);
        map.getLayers().removeAt(2);


document.getElementById('filteredFeaturesTotal').innerHTML = '<strong><img src=\"/img/loading-247px.gif\" width=\"20\"  style=\"vertical-align: middle\" alt=\"Loading gif\" />  Updating... please wait...</strong><br/>';


		if ($('#onlyshow275').is(":checked"))  { onlyshowparams275 = "onlyshow275:Y;"; }
			else { onlyshowparams275 = ''; }

		if ($('#onlyshow425').is(":checked"))  { onlyshowparams425 = "onlyshow425:Y;"; }
			else { onlyshowparams425 = ''; }
			


		subjectselectval = document.getElementById('milltypeselect').value;
		subjectsearchstring = subjects[subjectselectval].searchterm;

		symbolselectval = document.getElementById('millsymbolselect').value;
		symbolsearchstring = symbols[symbolselectval].searchterm;

//		newparams =  subjectsearchstring + watermillparams  + notincanmoreparams  + dateval;

		newparams = symbolsearchstring + subjectsearchstring + onlyshowparams275 + onlyshowparams425 + "minyear:" + minyearslider + ";maxyear:" + maxyearslider;

 		var urlgeoserver =  'https://geoserver2.nls.uk/geoserver/wfs?service=WFS' + 
				'&version=1.1.0&request=GetFeature&typename=nls:millsofbritainquery' +
			        '&PropertyName=the_geom' +
				'&viewparams=' + newparams + '&outputFormat=text/javascript&format_options=callback:handleJson3857' +
				'&srsname=EPSG:900913';

// format used to parse WFS GetFeature responses
		
		var geojsonFormat = new ol.format.GeoJSON();

		var vectorSource = new ol.source.Vector({
		  loader: function(extent, resolution, projection) {
			var url = urlgeoserver
	    	$.ajax({url: url, cache: false, dataType: 'jsonp', jsonp: false, jsonpCallback: 'handleJson3857', contentType: 'application/json', success: handleJson3857})
		  },
		  strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
		    maxZoom: 19
		  }))
		});

		window.handleJson3857 = function(response) {
		  vectorSource.addFeatures(geojsonFormat.readFeatures(response));


				FeaturesFromGeoServer = response.features;
		

		
			        if (FeaturesFromGeoServer.length == 1)
				{
		 		document.getElementById('filteredFeaturesTotal').innerHTML = '<p style="font-size:1.1em;"><strong>' + FeaturesFromGeoServer.length + ' mill feature.</strong>&nbsp;' +
						'<a href="javascript:zoomtoselected();">Zoom to this feature</a></p>';
				}
		
		
				else if (FeaturesFromGeoServer.length > 1)
				{
		
				 		document.getElementById('filteredFeaturesTotal').innerHTML = '<p style="font-size:1.1em;"><strong>' + FeaturesFromGeoServer.length + ' mill features.</strong>&nbsp;' + '<a href="javascript:zoomtoselected();">Zoom to these features</a></p>';

					
				}
				else
				{
		 		document.getElementById('filteredFeaturesTotal').innerHTML = '<p style="font-size:1.1em;"><strong>0 mill features.</strong</p>';
				}

//			const geojson = await response;

			if (response.features)

				{
				updatemillsinview();
				}



		};


	            var vectorLayer = new ol.layer.Vector({
			mosaic_id: '200',
	  		title: "Mills from GeoServer",
	                source: vectorSource,
	                style: invisible,
    			visible: true,	
	            });




		 map.getLayers().insertAt(2,vectorLayer);


		 var mills_postgres  = new ol.layer.Tile({
					preload: Infinity,
			            	title: "Mills from GeoServer SQL View",
					typename: 'nls:millsofbritainquery',
		    			visible: true,	
		    			source: new ol.source.TileWMS({
		      				url: 'https://geoserver2.nls.uk/geoserver/nls/wms',
		    			params: {'LAYERS': 'nls:millsofbritainquery', 'TILED': true  },    // 'viewparams': 'minyear:1840;maxyear:1860'
		  			attributions: '' })   
		
		    });


		 map.getLayers().insertAt(3,mills_postgres);


		var mapsource = map.getLayers().getArray()[3].getSource();
	
		var newparams2 = newparams.replace(/%25/g, "%");
		mapsource.updateParams({  'viewparams': newparams2 }); 
		mapsource.refresh();



	jQuery("#showmaplocationinfo").show();

 	var overlaySelected = map.getLayers().getArray()[3];

	 var source = overlaySelected.getSource();
	
	      source.on('tileloadstart', function() {
		document.getElementById('showmaplocationinfo').innerHTML = "<strong><img src=\"/img/loading-247px.gif\" width=\"20\"  style=\"vertical-align: middle\" alt=\"Loading gif\" /> Refreshing layer... please wait</strong>";
		setTimeout( function(){
			document.getElementById("showmaplocationinfo").innerHTML = "";
			jQuery("#showmaplocationinfo").hide();

		}, 4500); // delay 1000 ms
	      });




	}



function updatemillstotal() {

	if (map.getLayers().getArray()[2].get("title") == "MillsofBritain_17291836") 
		{
		 	document.getElementById('filteredFeaturesTotal').innerHTML = '<p style="font-size:1.1em;"><strong>23,559 mill features</strong></p>';
		}

}

updatemillstotal();


function updatemillsinview() {


	if (map.getLayers().getLength() > 2)
	if (map.getLayers().getArray()[2].get("title") == 'Mills from GeoServer')
	if (map.getLayers().getArray()[2].getSource().getFeatures().length > 1)


		{
//		map.getLayers().getArray()[2].getSource().clear();
		
		vectorSourceFeatures = map.getLayers().getArray()[2].getSource().getFeatures();


			setTimeout( function(){
				var mapextent = map.getView().calculateExtent(map.getSize());


						vsfeatures = [];
						for (var i = 0; i < vectorSourceFeatures.length; i++) {
							var vsfeat = vectorSourceFeatures[i].getGeometry().getCoordinates();
							if (ol.extent.containsCoordinate(mapextent, vsfeat))   { vsfeatures.push(vectorSourceFeatures[i]); }
						}


						document.getElementById('filteredFeaturesInMap').innerHTML = '<p style="font-size:1.1em;"><strong>' + vsfeatures.length + '</strong> mill features in this map extent</p>';

			}, 500); // delay 1000 ms
		}

	else

		{
		return;
		}

}


    function onMoveEnd(evt) {

        evt.preventDefault();

		countynameold = countyname;	  
		sixinchenglandwalesfirst();	

		updateUrl();
		
	}


// event listener to update the URL when the map is moved

         map.on('moveend', onMoveEnd);


// event listener to update background layer visibility at different zoom levels


         map.getView().on('change:resolution', setZoomLayers);




// Change base layer

	var changemap = function(index) {
	  map.getLayers().getArray()[0].setVisible(false);
	  map.getLayers().removeAt(0);
	  map.getLayers().insertAt(0,baseLayers[index]);
	  map.getLayers().getArray()[0].setVisible(true);
	  setZoomLayers();
	  
	  if (map.getLayers().getArray()[0].get('title') == 'Background - OS Maps API')
		  
		  { 
			jQuery("#map").css({ 'background-color': '#d7e0e5' });
		  }
	  else if (map.getLayers().getArray()[0].get('title') == 'Background - OS Maps Leisure (1:50,000/1:25,000)')
		  
		  { 
			jQuery("#map").css({ 'background-color': '#c7eafc' });
		  }		  
		else
		  { 
			jQuery("#map").css({ 'background-color': '#ded8c2' });
		  }		 		  
		  
		  
	}



// add the OL ZoomSlider and ScaleLine controls

//    map.addControl(new ol.control.ZoomSlider());
    map.addControl(new ol.control.ScaleLine({ units:'metric' }));

    map.removeInteraction(new ol.interaction.DoubleClickZoom({
		duration: 1000
		})
   	);	

// custom mouseposition with British National Grid and lat/lon

    var mouseposition = new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
	    // BNG: ol.extent.applyTransform([x, y], ol.proj.getTransform("EPSG:4326", "EPSG:27700"), 
		var coord27700 = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:27700');
		var templatex = '{x}';
		var outx = ol.coordinate.format(coord27700, templatex, 0);
		var templatey = '{y}';
		var outy = ol.coordinate.format(coord27700, templatey, 0);
		NGR = gridrefNumToLet(outx, outy, 6);
		var hdms = ol.coordinate.toStringHDMS(coordinate);
		if ((outx  < 0) || (outx > 700000 ) || (outy < 0) || (outy > 1300000 )) {
	        return '<strong>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 
		}
		else 
                { return '<strong>' + NGR + '</strong>&nbsp; <br/>' + ol.coordinate.format(coord27700, '{x}, {y}', 0) + 
			'&nbsp; <br/>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; }
            	}
    });

    map.addControl(mouseposition);


// populates the resultsheader div on the right with default text 

	function setResultsheader(str) {
	//    if (!str) str = '<p>No mills selected - please click on a <strong>dark blue circle</strong> to view mill records</p>';
	    document.getElementById('resultsheader').innerHTML = str;
	}

// resultsheader += '<p>No mills selected - please click on a <strong>dark blue circle</strong> to view mill records</p>';

	setResultsheader('<p>No mills selected - please click on a <strong>dark blue circle</strong> to view mill records</p>');

	function setResults(str) {
	    if (!str) str = "";
	    document.getElementById('results').innerHTML = str;
	}

// the featureOverlay for the selected vector features

            var selectedFeatures = [];

// function to unselect previous selected features

            function unselectPreviousFeatures() {

                var i;
                for(i=0; i< selectedFeatures.length; i++) {
                    selectedFeatures[i].setStyle(null);
                }
                selectedFeatures = [];


            }




// the function executed on a single map click event

	        map.on('singleclick', function(evt) {
				
			checkWidth();

// alter headers
			setResultsheader('<p>Selecting records... please wait</p>');

		if (map.getLayers().getLength() > 4) 
				{ 
					if (map.getLayers().getArray()[4].get('title') == 'vectors - vectors') map.getLayers().removeAt(4); 
				
				}
			
		if (map.getLayers().getLength() > 3) 
			{
				if (map.getLayers().getArray()[3].get('title') == 'vectors - vectors') map.getLayers().removeAt(3);  
				
			}
			setResults(''); 

			pixel = evt.pixel;


		var coord = evt.coordinate;
		var transformed_coordinate = ol.proj.transform(coord,"EPSG:3857", "EPSG:4326");
		var transformed_coordinate27700 = ol.proj.transform(coord,"EPSG:3857", "EPSG:27700");
		



		var lat = transformed_coordinate27700[1];
		var lon = transformed_coordinate27700[0];
		
		if (map.getView().getZoom() > 14)
	
	{
		var left = (Math.round(lon) - 50);
		var right = (Math.round(lon) + 50);
		var bottom = (Math.round(lat) - 50);
		var top = (Math.round(lat) + 50);
	}
	else
	{
		var left = (Math.round(lon) - 150);
		var right = (Math.round(lon) + 150);
		var bottom = (Math.round(lat) - 150);
		var top = (Math.round(lat) + 150);
	}		


		// console.log(left +',' + bottom + ',' + right + ',' + top );

		var bboxextent = left +',' + bottom + ',' + right + ',' + top ;

//		var bboxextent4326 = left4326 +',' + bottom4326 + ',' + right4326 + ',' + top4326 ;


		var urlgeoserver =  'https://geoserver3.nls.uk/geoserver/wfs?service=WFS' + 
				'&version=1.1.0&request=GetFeature&typename=nls:MillsofBritain_17291836&PropertyName=(pOSID,pOSName,pOSType,pOSSym,Nation,County,Year,YearRange,pOSMap,RoyRef,RoyName,W425,W275,MapLink,Source,the_geom)' +
				'&srsName=EPSG:3857&outputFormat=text/javascript&format_options=callback:handleJson3857_new' +
				'&bbox=' + bboxextent + ',urn:ogc:def:crs:EPSG::27700&';


//		console.log("urlgeoserver: " + urlgeoserver);


		var geojsonFormat = new ol.format.GeoJSON();

		var vectorSource = new ol.source.Vector({
		  loader: function(extent, resolution, projection) {
			var url = urlgeoserver
	    	$.ajax({url: url, cache: false, dataType: 'jsonp', jsonp: false, jsonpCallback: 'handleJson3857', contentType: 'application/json', success: handleJson3857_new})
		  },
		  strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
		    maxZoom: 19
		  }))
		});


		window.handleJson3857_new = function(response) {
		  vectorSource.addFeatures(geojsonFormat.readFeatures(response));


		featuresALL = response.features;

//		console.log("featuresALL: " + featuresALL);

		var results = "";


		var resultsheader = "";
	
			if (featuresALL.length < 1)
				resultsheader += '';
	
			else if (featuresALL.length == 1)
		            resultsheader += '<div id="deselect"><a href="javascript:deselect();">Deselect this record</a></div><br/><p><strong>Results - 1 record:</strong></p>';
			else if (featuresALL.length > 1)
	
		        resultsheader += '<div id="deselect"><a href="javascript:deselect();">Deselect these records</a></div><br/><p><strong>Results - ' + featuresALL.length + ' records:</strong></p>';
	
// set results from featuresALL - display fields if they have content and provide a heading for each field

		        setResultsheader(resultsheader);

				  if (featuresALL.length > 0) {
					var results = "";
			                var k;
			                for(k=0; k< featuresALL.length; k++) {
								

						results += '<div id="' + featuresALL[k].properties.pOSID + '" class="resultslist" data-layerid="' + featuresALL[k].properties.pOSID + '" >';

						if (featuresALL[k].properties.pOSName && (featuresALL.length > 0))
							results += '<p><strong>pOSName: </strong>' + featuresALL[k].properties.pOSName + '</p>';
						if (featuresALL[k].properties.pOSType && (featuresALL.length > 0))
							results += '<p><strong>pOSType: </strong>' + featuresALL[k].properties.pOSType + '</p>';


						if (featuresALL[k].properties.pOSSym && (featuresALL.length > 0))
							results += '<p><strong>pOSSym: </strong>' + featuresALL[k].properties.pOSSym + '</p>';
						if (featuresALL[k].properties.Nation && (featuresALL.length > 0))
							results += '<p><strong>Nation: </strong>' + featuresALL[k].properties.Nation + '</p>';
						if (featuresALL[k].properties.Year && (featuresALL.length > 0))
							results += '<p><strong>Year: </strong>' + featuresALL[k].properties.Year + '</p>';

						if (featuresALL[k].properties.YearRange && (featuresALL.length > 0))
							results += '<p><strong>YearRange: </strong>' + featuresALL[k].properties.YearRange + '</p>';

						if (featuresALL[k].properties.pOSMap && (featuresALL.length > 0))
							results += '<p><strong>pOSMap: </strong>' + featuresALL[k].properties.pOSMap + '</p>';

						if (featuresALL[k].properties.RoyRef && (featuresALL.length > 0))
							results += '<p><strong>RoyRef: </strong>' + featuresALL[k].properties.RoyRef + '</p>';

						if (featuresALL[k].properties.RoyName && (featuresALL.length > 0))
							results += '<p><strong>RoyName: </strong>' + featuresALL[k].properties.RoyName + '</p>';

						if (featuresALL[k].properties.W425 && (featuresALL.length > 0))
							results += '<p><strong>W425?: </strong>' + featuresALL[k].properties.W425 + '</p>';

						if (featuresALL[k].properties.W275 && (featuresALL.length > 0))
							results += '<p><strong>W275?: </strong>' + featuresALL[k].properties.W275 + '</p>';
						
						if (featuresALL[k].properties.MapLink && (featuresALL.length > 0))
							results += '<p style="text-wrap: wrap;"><strong>Map Hyperlink: </strong><a href="' + featuresALL[k].properties.MapLink +  '" target="_blank" >' + featuresALL[k].properties.MapLink + '</a></p>';

						if (featuresALL[k].properties.Source && (featuresALL.length > 0))
							results += '<p><strong>Source: </strong>' + featuresALL[k].properties.Source + '</p>';

						results += '<p><a href="https://maps.nls.uk/geo/find/#zoom=15&lat=' + transformed_coordinate[1].toFixed(5) + '&lon=' 
							+ transformed_coordinate[0].toFixed(5) + '&layers=101&b=10&z=0&point=' + transformed_coordinate[1].toFixed(5) + "," 
							+ transformed_coordinate[0].toFixed(5) + '" target="remotes">Link to 25 inch sheets covering this mill</a></p>';

						results += '<p><a href="https://maps.nls.uk/geo/find/#zoom=15&lat=' + transformed_coordinate[1].toFixed(5) + '&lon=' 
							+ transformed_coordinate[0].toFixed(5) + '&layers=102&b=10&z=0&point=' + transformed_coordinate[1].toFixed(5) + "," 
							+ transformed_coordinate[0].toFixed(5) + '" target="remotes">Link to 6 inch sheets covering this mill</a></p>';



						results += '</div><hr2></hr2>'; 
			                }

					setResults(results);
				
				  } else {

				        {setResults('No mills selected - please click on a <strong>dark blue circle</strong> to view mill records');}
				  }

		};


	            var vectorLayerSelected = new ol.layer.Vector({
					title: "vectors - vectors",
	                source: vectorSource,
	                style: StyleFunction_mills_selected
	            });



			    map.getLayers().insertAt(4,vectorLayerSelected);
			
	



		});


// zooms the map to specified point - this command is initiated in the gazetteers div

	function zoomMap(x,y,z)  {


		 map.getView().setZoom(z); 
	
		
		map.getView().setCenter(ol.proj.transform([x,y],'EPSG:27700', 'EPSG:3857'));
	
	}
	
	
	
 function checkWidth() {
    var windowWidth = $(window).width();
	var windowHeight = $(window).height();



		 	const headerHeight = jQuery("#header").css( "height" );
			const headerHeightPx = headerHeight.substring(0, 2);	
	
			console.log("headerHeightPx: " + headerHeightPx);
	
			const wh = (window.innerHeight - headerHeightPx);

			
			console.log("wh: " + wh);
			
			const whx = (wh - 88) + 'px';
			const why = (wh - 188) + 'px';
			
			console.log("why: " + why);
			
			jQuery("#resultsSideBar").css({ 'max-height': whx });
			jQuery("#results").css({ 'max-height': why });
			
			
 }
 
  
$(document).ready(function() {


	checkWidth();
	

			$(window).resize(function() 
			{
					checkWidth();

			});

});
