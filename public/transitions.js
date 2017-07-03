Transitions.TYPE_PUSH = 1;
Transitions.DIRECTION_LEFT = 1;
Transitions.DIRECTION_RIGHT = 2;
Transitions.isTransitioning = false;

function Transitions(containerDiv, fromDiv, toDiv, type, direction, duration) {

	if (type == undefined || direction == undefined) {
		return;
	}

	if (Transitions.isTransitioning) {
		return;
	}

	Transitions.isTransitioning = true;

	var animationStart = null;

	var $from = $(fromDiv);
	var $to = $(toDiv);

	// Cache the values of the position css rule for both elements
	var fromOriginalPositionRule = $from.css('position');
	var toOriginalPositionRule = $to.css('position');

	// Now we setup the Divs for the transition
	$from.css({
		position: 'absolute',
		top: 0,
		width: containerDiv.clientWidth
	});
	
	$to.addClass('slide-element-active');
	$to.css({
		position: 'absolute',
		top: 0,
		width: containerDiv.clientWidth
	});

	// Now, we do the transition
	switch (type) {
		case Transitions.TYPE_PUSH:
			window.requestAnimationFrame(push);
	}

	function push(timestamp) {

		if (!animationStart) {
			animationStart = timestamp;
		}

		var progress = timestamp - animationStart;

		var currentOffset = -containerDiv.clientWidth * progress / duration;

		switch (direction) {
			case Transitions.DIRECTION_LEFT:
				$from.css('left', currentOffset);
				$to.css('left', containerDiv.clientWidth + currentOffset);
				break;
			case Transitions.DIRECTION_RIGHT:
				$from.css('right', currentOffset);
				$to.css('right', containerDiv.clientWidth + currentOffset);
				break;
		}

		if (progress < duration) {
			window.requestAnimationFrame(push);
		} else {
			cleanUp();
		}

	}

	function cleanUp() {
		$from.removeClass('slide-element-active');
		$from.css({
			position: '',
			left: '',
			right: '',
			width: ''
		});

		$to.css({
			position: '',
			left: '',
			right: '',
			width: ''
		});

		Transitions.isTransitioning = false;
	}

}
