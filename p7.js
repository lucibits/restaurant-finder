//STEP 1 
//LOADING GMAPS
var map;
var infowindow;
var initialMapCenter = {lat: 51.508742, lng: -0.120850}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  center: initialMapCenter,
	  zoom: 12
	});
	navigator.geolocation.getCurrentPosition(showPosition);


	map.addListener('dragend', function() {
	    console.log('drag_end ')
	    searchPlaces()
	});

	map.addListener('zoom_changed', function() {
	   console.log('zoom_changed ')
	   searchPlaces()
	});
}

//STEP 3
//SEARCH BAR
function searchPlaces() {

	var input = document.getElementById("searchBar").value;
	if(input.length <= 0) { return }
		//returns clears it 

	var request = {
		location: map.getCenter(),
		radius: 8000,//getZoomRadius(),
		// keyword: "",
		type: ['Restaurants'],
		fields: ['formatted_address', 'name', 'rating']
	}

	if(input.length > 0) {
		request.keyword = input;
	}
	
	infowindow = new google.maps.InfoWindow();
	
	var service = new google.maps.places.PlacesService(map);

	service.textSearch(request, searchPlacesCallback);
}

function searchPlacesCallback(results, status) {
	console.log(status == google.maps.places.PlacesServiceStatus.OK, results.length);
	if(status != google.maps.places.PlacesServiceStatus.OK) {
		return
	}

	jsonData = [];
    clearMarkers();

	for(var i = 0; i < results.length; i++){
		createMarkerFromPlaces(results[i]);
	}
	
	addPlacesToJson(results)

}

function createMarkerFromPlaces(place) {

	if (place.name == undefined || place.formatted_address == undefined ) {
			return
	}

	var placeLoc = place.geometry.location;

	var marker = new google.maps.Marker({
		map: map,
		position: place.geometry.location
	});
	// console.log(placeLoc, map, marker);
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.setContent(place.name);
		infowindow.open(map, this);
	});

	markers.push(marker)
}

function addPlacesToJson(results) {

	for (var i = 0; i < results.length; i++) {
		var place = results[i]

		if (place.name == undefined || place.formatted_address == undefined ) {
			continue
		}

		var newRestaurant = {
			id: place.id,
		    restaurantName: place.name,
	        address: place.formatted_address,
	        icon: place.icon,
	        lat : place.geometry.location.lat(),
	        long : place.geometry.location.lng(),
	        ratings :[]
	    }

	    if (place.rating != undefined) {
	        newRestaurant.googleRating = Math.round(place.rating)
		}

		//push it to my json
		jsonData.unshift(newRestaurant);
	}
	//refresh info
	clearRestaurantColumn();
	//repopulate after clean
	populateList(jsonData);	
	
}


function getZoomRadius() {
    // http://stackoverflow.com/questions/3525670/radius-of-viewable-region-in-google-maps-v3
    // Get Gmap radius / proximity start
    // First, determine the map bounds
    var bounds = map.getBounds();

    // Then the points
    var swPoint = bounds.getSouthWest();
    var nePoint = bounds.getNorthEast();

    var proximitymeter = google.maps.geometry.spherical.computeDistanceBetween(swPoint, nePoint);
    // var proximitymiles = proximitymeter * 0.000621371192;

    console.log("Proxmity " + proximitymeter + " metres");
    return proximitymeter
}

//GEOLOCATION - GETTING POSITION
function showPosition(position) {
	var myCenter = {lat: position.coords.latitude, lng: position.coords.longitude
	}

	var marker = new google.maps.Marker({position: myCenter});
	marker.setMap(map);

}

//CREATE MARKER
function createMarker(lat, long) {	
	var position = new google.maps.LatLng(lat, long)
	var marker = new google.maps.Marker({position: position});
	return marker;
}


//DATA FROM JSON
var jsonData;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       jsonData = JSON.parse(xhttp.responseText);
		populateList(jsonData);		
    }  
     
};


//LET KNOW WHEN LOADING HAS FINISHED
window.onload = function () {
	xhttp.open("GET", "p7.json", true);
	xhttp.send();
	//so it loads first and dont get google undefined
	google.maps.event.addListener(map, 'click', function(event) {
  	placeMarker(map, event.latLng);
  });
}

//GLOBAL
var ratingFilter = [];
var markers = [];
var isReviewEnable = {};

//RESTAURANT LIST FROM JSON
function populateList(json) {
	var response = json;
	if(ratingFilter.length != 0) {
		response = json.filter(filterByAverageRaiting);
	}
	
	for(var i = 0; i < response.length; i++) {

		//CREATE OUTER DIV NODE
		var columnContainer = document.createElement('div');
		columnContainer.setAttribute("id", "columnContainer");
		
		//CREATE DIV NODE
		var container = document.createElement('div');
		container.setAttribute("id", "restaurantList");

		//CREATE NODE AND APPEND TEXT
		var title = document.createElement("p");
		title.setAttribute("id", "titleRestaurant");
		var node = document.createTextNode(response[i].restaurantName);
		title.appendChild(node);

		
		

		//CREATE NODE AND APPEND RAITING
		var raiting = document.createElement("p");
		// var node = document.createTextNode(getAverageStars(response[i].ratings));
		if (response[i].ratings.length > 0) {
			raiting.innerHTML = getAverageStars(response[i].ratings) + " " + '<span class="fa fa-star checked">';
		// raiting.appendChild(node);
		} else if ( response[i].googleRating != undefined ){
			raiting.innerHTML = response[i].googleRating + " " + '<span class="fa fa-star checked">';
		} else {
			raiting.innerHTML = "- " + '<span class="fa fa-star checked">';
		}

		//CREATE NODE AND APPEND TEXT
		var address = document.createElement("p");
		var node = document.createTextNode(response[i].address);
		address.appendChild(node);

		//CREATE IMAGE
		var image = document.createElement("IMG");
		image.setAttribute("src", getStreetViewCoords(response[i].lat, response[i].long));
		image.setAttribute("width", "120");
		image.setAttribute("height", "120");
		image.setAttribute("alt", "Restaurant");


		//MORE REVIEWS BUTTON
		var viewReviewsbutton = document.createElement("BUTTON");
		var viewReviewsbuttonNode = document.createTextNode("Reviews");
		viewReviewsbutton.setAttribute("id", "moreReviews");
		viewReviewsbutton.appendChild(viewReviewsbuttonNode);
		//REVIEWS APPEAR WITH CLICK
		var iRestaurantName = response[i].restaurantName;
		viewReviewsbutton.value = iRestaurantName;
		if (isReviewEnable[iRestaurantName] == undefined) { 
			isReviewEnable[iRestaurantName] = false
		}
		viewReviewsbutton.onclick =  function(btn) {

			isReviewEnable[btn.target.value] = !(isReviewEnable[btn.target.value])
			//refresh info
			clearRestaurantColumn();
			//repopulate after clean
			populateList(jsonData);	
		};

		//ADD REVIEWS BUTTON
		var addReviewButton = document.createElement("BUTTON");
		var addReviewButtonNode = document.createTextNode("Add Review");
		addReviewButton.setAttribute("id", "leaveReviewButton");
		addReviewButton.appendChild(addReviewButtonNode);
		addReviewButton.onclick = reviewButtonClick;
		addReviewButton.value = response[i].restaurantName;

		//BUTTON DIV
		var buttonContainer = document.createElement('div');
		buttonContainer.setAttribute("id", "buttonContainer");		
		buttonContainer.appendChild(viewReviewsbutton);
		buttonContainer.appendChild(addReviewButton);


		//APEND ELEMENTS TO COLUMN CONTAINER
		var columnElement = document.getElementById("column2");
		columnElement.appendChild(columnContainer);
		columnContainer.appendChild(container);
		container.appendChild(image);
		container.appendChild(title);
		container.appendChild(raiting);
		container.appendChild(address);
		container.appendChild(buttonContainer);
		
		
		if(response[i].ratings.length != 0 && isReviewEnable[iRestaurantName]) {
			for(var j = 0; j < response[i].ratings.length; j++) {
				// var j = 0;
				// console.log(response[i].ratings[j]);
				var reviewContainer = document.createElement('div');
				reviewContainer.setAttribute("id", "review");

				var stars = document.createElement("p");
				var starNode = document.createTextNode(response[i].ratings[j].stars);
				stars.appendChild(starNode);
				
				
				var e = document.createElement("SPAN");
	   			e.setAttribute("class","fa fa-star checked");
				// var p = document.createElement("SPAN");
				// p.innerHTML = '<span class="fa fa-star checked">';

				var comment = document.createElement("p");
				var node = document.createTextNode(response[i].ratings[j].comment);
				comment.appendChild(node);

				columnContainer.appendChild(reviewContainer);

				// reviewContainer.appendChild(p);
				reviewContainer.appendChild(stars);
				reviewContainer.appendChild(e);
				reviewContainer.appendChild(comment);
			}
		}

		// console.log(getStreetViewCoords(response[0].lat, response[0].long));
		let marker = createMarker(response[i].lat, response[i].long);
		marker.setMap(map);
		markers.push(marker);
	}

}

//GETTING GOOGLE STREET PHOTO
function getStreetViewCoords(lat, long) {
	return "https://maps.googleapis.com/maps/api/streetview?size=400x400&" + "location=" + lat + "," + long + "&fov=90&heading=235&pitch=10&key=_INSERT_KEY_HERE_";
}

//FILTER TOOL FOR RESTAURANT RATING
function filterByStar() {
	var checkbox1 = document.getElementById("1star");
	var checkbox2 = document.getElementById("2star");
	var checkbox3 = document.getElementById("3star");
	var checkbox4 = document.getElementById("4star");
	var checkbox5 = document.getElementById("5star");


	clearRestaurantColumn();

	clearMarkers();

	var checks = [];
	if(checkbox1.checked == true) {
		// console.log("1 is checked");	
		checks.push(1);
	} 
	if (checkbox2.checked == true) {
		console.log("2 is checked");
		checks.push(2);
	} 
	if (checkbox3.checked == true) {
		console.log("3 is checked");
		checks.push(3);
	} 
	if (checkbox4.checked == true) {
		console.log("4 is checked");
		checks.push(4);
	} 
	if (checkbox5.checked == true) {
		console.log("5 is checked");
		checks.push(5);
	};

	ratingFilter = checks;
	populateList(jsonData);	
}

function clearMarkers() {
		//REMOVE MARKERS
	for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
     }
    markers = [];
}

//CLEAR FUNCTION
function clearRestaurantColumn() {
	//refresh list.
	var column2 = document.getElementById("column2");
	if (column2.hasChildNodes()) {
		let nodesRestaurant = document.querySelectorAll('[id=columnContainer]');
		for (var i = nodesRestaurant.length - 1; i >= 0; i--) {
    		column2.removeChild(nodesRestaurant[i]);
		}
	}
}


//GET AVERAGE STARS FROM RATINGS
function getAverageStars(ratings) {
	if(ratings.length == 0){return 0;}
	var sum = 0;
	for(var i = 0; i < ratings.length; i++) {
		sum += ratings[i].stars;
	}

	return Math.round(sum / ratings.length);
}


function filterByAverageRaiting(item) {
	if (item.googleRating != undefined) {
		if(ratingFilter.includes(item.googleRating)){
  			return true;

  		}
	}
  	let averageRaiting = getAverageStars(item.ratings);
  	if(ratingFilter.includes(averageRaiting)){
  		return true;
  	}
  	return false; 
}


//STEP 2
//ADD REVIEWS TO AN EXISTING RESTAURANT(TO MY JASON)
// When the user clicks the button, open the modal 
function reviewButtonClick(aclick) {
	// console.log(aclick.target)
	document.getElementById("addReviewForm").name = aclick.target.value;
	//get name from clicked restaurant

	// Get the modal
	var modal = document.getElementById('myModal');
    modal.style.display = "block";

    // Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];

	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	    modal.style.display = "none";
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
	}
}

//ADD REVIEW
function addReview(form) {
	console.log(form);
	//get clicked restaurant
	//match JSON data
	let jsonRestaurant = jsonData.find(function(element) {
  				return element.restaurantName == form.name
	})
	// console.log(jsonRestaurant);
	
	var newComment = document.getElementById("addReviewForm").elements[3].value;
	// console.log(document.getElementById("addReviewForm").elements);
	var reviewStars = document.getElementById("addReviewForm").elements[2];
	var stars = reviewStars[reviewStars.selectedIndex].value;
	
	//create new raitings object
	var newRating = {
		stars: parseInt(stars),
        comment:newComment
	};

	//push it to my json
	jsonRestaurant.ratings.unshift(newRating);
	console.log(jsonRestaurant.ratings)
	//refresh info
	clearRestaurantColumn();
	//repopulate after clean
	populateList(jsonData);	

	document.getElementById("myModal").style.display = "none";

}


//ADD RESTAURANT(TO MY JASON)
//SET MARKER BY CLICKING ON MAP
function placeMarker(map, location) {
  var marker = new google.maps.Marker({
    position: location,
    map: map
  });

  var btn = document.createElement("BUTTON");
  var btnTextNode = document.createTextNode("ADD A RESTAURANT");
  btn.appendChild(btnTextNode);
  btn.id = "addRestaurantButton";
  btn.onclick = addRestaurantOnMap;
  btn.value = location.lat() + "," + location.lng();
  
  var infowindow = new google.maps.InfoWindow({
    content: btn

  });
  infowindow.open(map,marker);

   //CLEAR MARKER BY CLICKING ON IT
    google.maps.event.addListener(marker, 'click', function() {
  		console.log(marker)
      marker.setMap(null);
    });
}


//ADD RESTAURANT 
function addRestaurantOnMap(aclick) {
	console.log(typeof aclick.target.value, aclick.target.value.length, aclick.target.value, aclick.target.value.split(","));

	// Get the modal
	var modal = document.getElementById('myrestModal');

    modal.style.display = "block";

    // Get the <span> element that closes the modal
	var spanx = document.getElementsByClassName("close")[1];
	// console.log("span", spanx);

	var locationArray = aclick.target.value.split(",");

	document.getElementById("formLat").value = locationArray[0];
	document.getElementById("formLng").value = locationArray[1];


	// When the user clicks on <span> (x), close the modal
	spanx.onclick = function() {
	    modal.style.display = "none";
	    // console.log("cualquiercosa");
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
	}
}

//ADD RESTAURANT
function addRestaurant(form) {

	var newRestaurantName = document.getElementById("restModal").elements[0].value;
	var newRestaurantAddress = document.getElementById("restModal").elements[1].value;
	var newRestaurantLat = document.getElementById("restModal").elements[2].value;
	var newRestaurantLng = document.getElementById("restModal").elements[3].value;
	// console.log(newComment);

	//create new raitings object
	var newRestaurant = {
		restaurantName:newRestaurantName,
		address:newRestaurantAddress,
		lat:newRestaurantLat,
      	long:newRestaurantLng,
		ratings:[]
	};

	//push it to my json
	jsonData.unshift(newRestaurant);

	//refresh info
	clearRestaurantColumn();
	//repopulate after clean
	populateList(jsonData);	
	document.getElementById("myrestModal").style.display = "none";

}


//STEP 3
//ADD API FOR REAL RESTAURANTS ON THAT LOCATION ALONG WITH YOUR JSON