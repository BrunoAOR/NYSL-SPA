var url = "https://api.myjson.com/bins/x3u23";
var nyslData = {};
var $matchInfoDiv;
var teamToShow = '';

// Templates
var scheduleTemplate;
var $scheduleOutlet;
var commentsTemplate;
var $commentsOutlet;

// Used for firebase database value events
var subscribedEvents = [];

const ORIENTATION_NONE = 0;
const ORIENTATION_PORTRAIT = 1;
const ORIENTATION_LANDSCAPE = 2;

var dateInfo = {
	shortDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	longDayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
}

var themes = {
	blue: {
		"--nysl-background": "#033949",
		"--nysl-headings": "#888888",
		"--nysl-detail": "#a3ff15"
	},
	black: {
		"--nysl-background": "#000000",
		"--nysl-headings": "#3e3e3e",
		"--nysl-detail": "#d3ff90"
	},
	red: {
		"--nysl-background": "#490303",
		"--nysl-headings": "#865555",
		"--nysl-detail": "#1554ff"
	}
}

$(function () {
	//initMap(0,0);

	scheduleTemplate = getTemplateContent('schedule-template');
	$scheduleOutlet = $('#schedule-outlet');
	commentsTemplate = getTemplateContent('comments-template');
	$commentsOutlet = $('#comments-outlet');

	$matchInfoDiv = $('#match-info');

	// Setup events
	window.onpopstate = function () {
		checkUrlParams();
	}

	$('.app-theme-btn').on('click', function () {
		changeTheme($(this).attr("data-theme"));
	});

	$matchInfoDiv.find('.app-back-button').on('click', onMatchInfoBackButtonClicked);

	$matchInfoDiv.find('.app-match-team').on('click', function () {
		onTeamClicked($(this).attr('data-team'));
	});

	$matchInfoDiv.find('#post-btn').on('click', onPostCommentClicked);

	$('#teamInfo').find('.app-back-button').on('click', onTeamInfoBackButtonClicked);

	// Firebase Authentication related
	$('#sign-in-form').find('.app-btn-accept').on('click', signIn);
	$('#sign-in-form').find('.app-btn-cancel').on('click', signInCancel);

	firebase.auth().onAuthStateChanged(function (user) {
		if (user != null) {
			// User is signed in.
			onSignIn(user);
		} else {
			// User is signed out.
			onSignOut();
		}
	});

	// Get Data
	$.getJSON(url, function (response) {
		nyslData = response;
		onDataReady();
	});

});

function onDataReady() {
	checkUrlParams()
	updateLayout();
	window.addEventListener('orientationchange', updateLayout);


	// Hide #placeholder and show #content and footer
	$('#placeholder').slideUp(500, function () {
		$('#content').slideDown(500);
		$('footer').slideDown(500);
	});


	// Setup team-filter
	$('#team-selection').on('change', function () {
		filterByTeam(this.value);
	});

	fillInHomeDiv();

	$('#schedule-outlet').find('.panel-collapse').eq(0).collapse('show');
}

function getOrientation() {
	if (window.matchMedia("(orientation: portrait)").matches) {
		return ORIENTATION_PORTRAIT;
	}

	if (window.matchMedia("(orientation: landscape)").matches) {
		return ORIENTATION_LANDSCAPE;
	}

	return ORIENTATION_NONE;
}

function updateContentDivLayout() {
	var windowHeight = document.documentElement.clientHeight;

	var contentHeight = windowHeight - $('header').outerHeight(true) - $('footer').outerHeight(true);

	var contentWidth = $('#content').parent().width();

	var currentOrientation = getOrientation();

	if (currentOrientation == ORIENTATION_PORTRAIT) {
		$('#content-separator').css({
			display: 'none'
		});
	} else if (currentOrientation == ORIENTATION_LANDSCAPE) {
		$('#content-separator').css({
			display: '',
			height: contentHeight
		});
	}
	
	$('#content').css({
		height: contentHeight,
		width: contentWidth
	});
}

function updateLayout() {
	// A delay has to be inserted because of a Bug in Android where the orientationchange event doesn't update the device's orientation until after a certain delay.

	var delay;
	if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
		delay = 0;
	} else {
		$('#content').children().css('display', 'none');
		delay = 175;
	}
	setTimeout(function () {
		$('#content').children().css('display', '');
		updateContentDivLayout();

		var $home = $('#home');
		var currentOrientation = getOrientation();

		console.log(currentOrientation == 1 ? "Entered: Portrait" : "Entered: Landscape");
		// ********************
		// For both orientations:
		// ********************

		// Ensure .slide-container takes all available height of the #content parent
		var slideHeight = $('.slide-container').parent().innerHeight;
		var slideWidth = 0;

		if (currentOrientation == ORIENTATION_PORTRAIT) {

			// ********************
			// For portrait:
			// ********************

			// Put #home as a child to .slide-container
			$('.slide-container').prepend($home);
			// Remove .slide-element from #home
			$home.addClass('slide-element');
			// Ensure #home has no width as element-style
			$home.css('width', '');
			// Ensure #matchInfo->.app-back-button has no display as element-style
			$matchInfoDiv.find('.app-back-button').css('display', '');
			// Ensure .slide-container has its parent.width as width
			slideWidth = $('.slide-container').parent().width();
			// Ensure only #home has .slide-element-active (#home is already inside of .slide-container)
			//			$('.slide-container').children().removeClass('slide-element-active');
			//			$home.addClass('slide-element-active');

			//			// Clean the url
			//			if (getUrlSearchObject()) {
			//				window.history.pushState({}, "Pushed empty", "index.html");
			//			}

		} else if (currentOrientation == ORIENTATION_LANDSCAPE) {

			// ********************
			// For landscape:
			// ********************
			if (!getUrlSearchObject()) {
				onMatchRowClicked(0);
			}

			// Put #home as a child of #content-left (sibling to .slide-container BEFORE .slide-container)
			$('#content-left').prepend($home);
			// ADd .slide-element to #home
			$home.removeClass('slide-element');
			// Ensure #home has a width as element-style of 40% of its container's parent
			$home.css('width', 0.4 * $home.parent().parent().width());
			// Ensure #matchInfo->.app-back-button has display: none as element-style
			$matchInfoDiv.find('.app-back-button').css('display', 'none');
			// Ensure .slide-container has 50% of its parent.width as width (10% will be left empty)
			slideWidth = "50%"; //0.5 * $('.slide-container').parent().width();
			// make #matchInfo visible with .slide-element-active if neither #matchInfo or #teamInfo are visible
			if (!$matchInfoDiv.hasClass('slide-element-active') && !$('#teamInfo').hasClass('slide-element-active')) {
				$matchInfoDiv.addClass('slide-element-active');
			}
		}

		// Apply width/height to .slide-container
		$('.slide-container').css({
			height: slideHeight,
			width: slideWidth
		});

	}, delay);

}

function filterByTeam(teamSelector) {
	if (filterByTeam.isFiltering) {
		return;
	}

	filterByTeam.isFiltering = true;
	$('#team-selection')[0].disabled = true;

	teamToShow = teamSelector;
	var $collapsePanels = $('#schedule-outlet').find('.panel-collapse');

	// Find the index for the panel that is opened
	var shownPanelId = $collapsePanels.filter('.in').attr('id');

	// Setup events
	$collapsePanels.on('hidden.bs.collapse', function () {
		fillInHomeDiv();
		// After the call to fillInHomeDiv, the old $collapsePanels no longer exist in the DOM and have been replaced by a new set with the current filtered content. Therefore, we are searching the new ones before continuing.
		$collapsePanels = $('#schedule-outlet').find('.panel-collapse');

		$panelToOpen = $collapsePanels.filter((i, el) => {
			return ($(el).attr('id') == shownPanelId);
		});
		if ($panelToOpen.length != 0) {
			$panelToOpen.on('shown.bs.collapse', function () {
				$('#team-selection')[0].disabled = false;
				filterByTeam.isFiltering = false;
				$collapsePanels.off('shown.bs.collapse');
			}).collapse('show');
		} else {
			$('#team-selection')[0].disabled = false;
			filterByTeam.isFiltering = false;
		}
	});

	// Hide the collapse panels to trigger events
	if (shownPanelId !== undefined) {
		$collapsePanels.filter('.in').collapse('hide');
	} else {
		//$collapsePanels.off('hidden.bs.collapse');
		fillInHomeDiv();
		$('#team-selection')[0].disabled = false;
		filterByTeam.isFiltering = false;
	}

}

function fillInHomeDiv() {
	$scheduleOutlet.html("");

	var panelNum = -1;
	var currentMonth = "";
	var $currentPanel;
	var $currentTable;

	for (var i = 0; i < nyslData.matches.length; ++i) {
		var matchInfo = nyslData.matches[i];
		var matchMonth = getMonth(matchInfo);

		if (teamToShow != '' && matchInfo.team1 != teamToShow && matchInfo.team2 != teamToShow) {
			continue;
		}

		if (currentMonth != matchMonth) {
			++panelNum;
			currentMonth = matchMonth;

			// Get a copy of the panel and add it to the outlet
			$currentPanel = $(scheduleTemplate.cloneNode(true));
			$scheduleOutlet.append($currentPanel);

			// Modify the accordion href and id
			$currentPanel.find('[data-parent]').attr('href', '#collapse' + panelNum);
			$currentPanel.find('.panel-collapse').attr('id', 'collapse' + panelNum);

			// Update panel title (match month)
			$currentPanel.find('.app-panel-title').text(matchMonth);

			// Get the table body to output rows
			$currentTable = $currentPanel.find('.app-table-outlet');
		}
		var row = getScheduleRow(matchInfo);
		row.setAttribute('data-match-index', i);
		row.onclick = function () {
			onMatchRowClicked(this.getAttribute('data-match-index'));
		};
		$currentTable.append(row);
	}

	$('#schedule-outlet').find('.panel-collapse').collapse({
		'parent': '#schedule-outlet'
	});
}

function checkUrlParams() {
	var urlParams = getUrlSearchObject();

	$('.slide-container').children().removeClass('slide-element-active');

	if (!urlParams) {
		$('#home').addClass('slide-element-active');
		if (getOrientation() == ORIENTATION_LANDSCAPE) {
			onMatchRowClicked(0);
		}
		return;
	}

	$('#home').removeClass('slide-element-active');

	if (urlParams.hasOwnProperty('team-id')) {
		fillInMatchInfoDiv(urlParams['match-id']);
		fillInTeamInfoDiv(urlParams['team-id']);
		$('#teamInfo').addClass('slide-element-active');
	} else if (urlParams.hasOwnProperty('match-id')) {
		fillInMatchInfoDiv(urlParams['match-id']);
		$matchInfoDiv.addClass('slide-element-active');
	}

}

function getUrlSearchObject() {
	var obj = {};

	if (window.location.search == "") {
		return null;
	}

	var terms = window.location.search.substr(1).split('&');
	var kvPair;
	for (var i = 0; i < terms.length; ++i) {
		kvPair = terms[i].split('=');
		obj[kvPair[0]] = kvPair[1];
	}

	return obj;
}

function fillInMatchInfoDiv(matchInfoIndex) {
	var matchInfo = nyslData.matches[matchInfoIndex];

	$matchInfoDiv.find('.app-match-header').html(
		'<span class="app-team-name">' + matchInfo.team1 + '</span> vs <span class="app-team-name">' + matchInfo.team2 + '</span>'
	);
	$matchInfoDiv.find('.app-match-date').text(getLongDate(matchInfo));
	$matchInfoDiv.find('.app-match-time').text(matchInfo.time);
	$matchInfoDiv.find('.app-match-team').eq(0).attr('data-team', matchInfo.team1).text(matchInfo.team1);
	$matchInfoDiv.find('.app-match-team').eq(1).attr('data-team', matchInfo.team2).text(matchInfo.team2);
	$matchInfoDiv.find('.app-match-location').text('@ ' + matchInfo.location + " Elementary");
	$matchInfoDiv.find('.app-match-address').text(
		getLocationInfo(matchInfo.location).address
	);


	var location = getLocationInfo(matchInfo.location);
	centerAtMarker(location.lat, location.lng);

	// Map related
	//	changeIframeSrc(
	//		$matchInfoDiv.find('.app-match-map').find('iframe')[0],
	//		getLocationInfo(matchInfo.location).embedMap
	//	);

	// Now the comments section (firebase)
	// Regardless of whether we are signed in or not, let's store the matchInfoIndex as a data-match-id attribute in the comments-outlet. This can be user by the fillInCommentsDiv if no value is passed

	$commentsOutlet.attr('data-match-id', matchInfoIndex);

	//Get game key for database IF SIGNED IN
	fillInCommentsDiv()

}



function unsubscribeFromFirebase() {
	for (var i = 0; i < subscribedEvents.length; ++i) {
		firebase.database().ref(subscribedEvents[i]).off('value');
	}
}

function fillInCommentsDiv() {
	if (firebase.auth().currentUser) {
		var matchInfoIndex = $commentsOutlet.attr('data-match-id');
		if (!matchInfoIndex) {
			return;
		}
		var key = "game" + (matchInfoIndex < 9999 ? ("000" + matchInfoIndex).slice(-4) : matchInfoIndex.toString());

		//Subscribe to value event on the database node that corresponds to this game
		// IMPORTANT: We must unsubscribe before subscribing (in case of repeat calls)
		unsubscribeFromFirebase()
		subscribedEvents.push('posts/' + key);
		$commentsOutlet.empty();
		firebase.database().ref('posts/' + key).on('value', function (databaseSnapshot) {
			$commentsOutlet.empty();
			var posts = databaseSnapshot.val();
			if (posts) {
				for (var key in posts) {
					var $commentDiv = $(commentsTemplate.cloneNode(true));
					$commentDiv.find('.app-comment-timestamp').text("On, " + new Date(posts[key].timestamp).toLocaleString());
					$commentDiv.find('.app-comment-user').text(posts[key].user);
					$commentDiv.find('.app-comment-comment').text(posts[key].comment);

					$commentsOutlet.append($commentDiv);
				}
			} else {
				$commentsOutlet.html('<div class="text-center"><p>There are no comments for this game.</p></div>');
			}
		});
	}

}

function onPostCommentClicked() {
	var comment = $('#app-comments-add').find('textarea').val();
	if (comment.length == 0) {
		return;
	}
	$('#app-comments-add').find('textarea').val("");
	var user = firebase.auth().currentUser.email;
	user = user.slice(0, user.indexOf('@'));
	var timestamp = new Date().getTime();

	var matchInfoIndex = $commentsOutlet.attr('data-match-id');
	var key = "game" + (matchInfoIndex < 9999 ? ("000" + matchInfoIndex).slice(-4) : matchInfoIndex.toString());

	firebase.database().ref('posts/' + key).push({
		comment: comment,
		user: user,
		timestamp: timestamp,
		uid: firebase.auth().currentUser.uid
	});
}

function onMatchRowClicked(matchInfoIndex) {
	fillInMatchInfoDiv(matchInfoIndex);
	window.history.pushState({}, "Pushed", "?match-id=" + matchInfoIndex);

	var currentOrientation = getOrientation();

	if (currentOrientation == ORIENTATION_PORTRAIT) {
		Transitions($('.slide-container')[0], $('#home')[0], $matchInfoDiv[0], Transitions.TYPE_PUSH, Transitions.DIRECTION_LEFT, 250);
	} else if (currentOrientation == ORIENTATION_LANDSCAPE) {

		if (!$matchInfoDiv.hasClass('slide-element-active')) {
			Transitions($('.slide-container')[0], $('#teamInfo')[0], $matchInfoDiv[0], Transitions.TYPE_PUSH, Transitions.DIRECTION_RIGHT, 250);
		}

	}
}

function onTeamClicked(teamName) {
	for (var i = 0; i < nyslData.teams.length; ++i) {
		if (nyslData.teams[i].name == teamName) {
			// Prepare the Div with the right data
			fillInTeamInfoDiv(i);

			// Push state to history and change the url
			window.history.pushState({}, "Pushed", window.location.search + "&team-id=" + i);

			// Transition to teamInfo div
			Transitions($('.slide-container')[0], $matchInfoDiv[0], $('#teamInfo')[0], Transitions.TYPE_PUSH, Transitions.DIRECTION_LEFT, 250);
			break;
		}
	}
}

function fillInTeamInfoDiv(teamInfoIndex) {
	var teamInfo = nyslData.teams[teamInfoIndex];

	$('#teamInfo').find('.app-team-header').html('<span class="app-team-name">' + teamInfo.name + '</span>');

	var tbody = $('#teamInfo').find('tbody')[0];
	tbody.innerHTML = "";

	var row, th, td;
	for (var i = 0; i < teamInfo.players.length; ++i) {
		row = document.createElement('tr');

		th = document.createElement('th');
		th.textContent = teamInfo.players[i].name;
		row.appendChild(th);

		td = document.createElement('td');
		td.textContent = teamInfo.players[i].position;
		row.appendChild(td);

		tbody.appendChild(row);
	}
}

function onMatchInfoBackButtonClicked() {
	window.history.pushState({}, "Pushed empty", "index.html");
	Transitions($('.slide-container')[0], $matchInfoDiv[0], $('#home')[0], Transitions.TYPE_PUSH, Transitions.DIRECTION_RIGHT, 250);

	var matchInfoIndex = $commentsOutlet.attr('data-match-id');
	var key = "game" + (matchInfoIndex < 9999 ? ("000" + matchInfoIndex).slice(-4) : matchInfoIndex.toString());
	firebase.database().ref('posts/' + key).off('value');
}

function onTeamInfoBackButtonClicked() {
	var newUrlSearch = window.location.search;
	newUrlSearch = newUrlSearch.split('&')[0];
	window.history.pushState({}, "Pushed", newUrlSearch);

	Transitions($('.slide-container')[0], $('#teamInfo')[0], $matchInfoDiv[0], Transitions.TYPE_PUSH, Transitions.DIRECTION_RIGHT, 250);
}

function getTemplateContent(templateID) {
	var tempDiv = document.createElement('div');
	tempDiv.innerHTML = document.getElementById(templateID).innerHTML;
	return (tempDiv.firstChild);
}

function getScheduleRow(matchInfo) {
	var row = document.createElement('tr');

	var th = document.createElement('th');
	th.innerHTML = '<span class="app-team-name">' + matchInfo.team1 + '</span> vs <span class="app-team-name">' + matchInfo.team2 + '</span>';
	row.appendChild(th);

	var td = document.createElement('td');
	td.textContent = getShortDate(matchInfo);
	row.appendChild(td);

	return row;
}

function changeIframeSrc(iFrame, src) {
	var newIframe = iFrame.cloneNode();
	newIframe.setAttribute('src', src);
	iFrame.parentNode.replaceChild(newIframe, iFrame);
}

function getLocationInfo(location) {
	for (var i = 0; i < nyslData.locations.length; ++i) {
		if (nyslData.locations[i].name == location) {
			return nyslData.locations[i];
		}
	}
	return {};
}

function getMonth(matchInfo) {
	return (dateInfo.monthNames[new Date(matchInfo.date).getMonth()]);
}

function getShortDate(matchInfo) {
	return getDate(matchInfo, true);
}

function getLongDate(matchInfo) {
	return getDate(matchInfo, false);
}

function getDate(matchInfo, asShortDate = false) {
	var output = "";
	var date = new Date(matchInfo.date);

	if (asShortDate) {
		output += dateInfo.shortDayNames[date.getDay()] + ", ";
	} else {
		output += dateInfo.longDayNames[date.getDay()] + ", ";
	}
	var dateNumber = date.getDate();
	switch (dateNumber) {
		case 1:
		case 21:
		case 31:
			output += dateNumber + "st";
			break;
		case 2:
		case 22:
			output += dateNumber + "nd";
			break;
		case 3:
		case 23:
			output += dateNumber + "rd";
			break;
		default:
			output += dateNumber + "th";
			break;
	}

	if (!asShortDate) {
		output += " " + getMonth(matchInfo);
	}

	return output;
}

// ******************************
// THEMES
// ******************************

function changeTheme(theme) {
	if (changeTheme.intervalID == undefined) {
		changeTheme.intervalID = 0;
		changeTheme.themeNames = [];
		for (var key in themes) {
			changeTheme.themeNames.push(key);
		}
		changeTheme.currentThemeIndex = 0;
	}
	
	clearInterval(changeTheme.intervalID);
	
	if (theme == "party") {
		changeTheme.intervalID = setInterval(function() {
			changeTheme.currentThemeIndex = (changeTheme.currentThemeIndex + 1) % changeTheme.themeNames.length;
			$('html').css(themes[changeTheme.themeNames[changeTheme.currentThemeIndex]]);
		}, 100);
	} else {
		$('html').css(themes[theme]);
	}
}


// ******************************
// Firebase authentication related
// ******************************

function showSignInScreen(callback) {
	if (callback == undefined || callback == null || !(callback instanceof Function)) {
		$('#sign-in-div').slideDown(250);
	} else {
		$('#sign-in-div').slideDown(250, callback);
	}
}

function hideSignInScreen(callback) {
	if (callback == undefined || callback == null || !(callback instanceof Function)) {
		$('#sign-in-div').slideUp(250);
	} else {
		$('#sign-in-div').slideUp(250, callback);
	}
}

function signInCancel() {
	hideSignInScreen(() => {
		$('#sign-in-info').hide(0);
		$('#sign-in-input').show(0);
	});
}

function signIn() {
	var email = $('#sign-in-form').find('#email').val();
	var password = $('#sign-in-form').find('#password').val();

	$('#sign-in-input').hide(0);
	$('#sign-in-info').text("Signing in...");
	$('#sign-in-info').show(0);

	// delay call to firebase to allow user to see the message
	setTimeout(() => {
		firebase.auth().signInWithEmailAndPassword(email, password).catch(onSignInError);
	}, 500);

}

function signOut() {
	firebase.auth().signOut();
}

function onSignIn(user) {
	// Change #sign-in-btn
	$('#sign-in-btn').text('Sign out');
	$('#sign-in-btn').off('click');
	$('#sign-in-btn').on('click', signOut);

	// Clear the input fields
	$('#sign-in-form').find('#email').val("");
	$('#sign-in-form').find('#password').val("");

	// Show .app-game-comments in #matchInfo
	$matchInfoDiv.find('#app-comments').slideDown(500);
	fillInCommentsDiv();

	$('#sign-in-info').text("Sign in succesful!");

	setTimeout(() => {
		hideSignInScreen(() => {
			$('#sign-in-info').hide(0);
			$('#sign-in-input').show(0);
		});
	}, 1000);
}

function onSignInError(error) {
	// Error handling
	$('#sign-in-input').show(0);
	$('#sign-in-info').html("Something went wrong...<br>" + error.message);
	console.log("Error (" + error.code + "): " + error.message);
}

function onSignOut() {
	$('#sign-in-btn').text('Sign in');
	$('#sign-in-btn').off('click');
	$('#sign-in-btn').on('click', showSignInScreen);

	// Show .app-game-comments in #matchInfo
	$matchInfoDiv.find('#app-comments').slideUp(500);
}
