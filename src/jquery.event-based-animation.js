/*
 *  Event Based Animation v1.0 - jQuery plugin
 *
 *  Copyright (c) 2012 Deux Huit Huit (http://www.deuxhuithuit.com/)
 *  Licensed under the MIT (https://raw.github.com/DeuxHuitHuit/jQuery-event-based-animation/master/LICENSE.txt)
 */
(function ($, undefined) {
	
	"use strict";
	
	$.fn.eventAnimate = function (options) {
		
		var
		
		// the target DOMElement
		t = $(this),
		
		// Window object
		win = $(window),
		
		// Quik timestamp
		now = function () {
			return (new Date()).getTime();
		},
		
		//Last scroll event trigered
		eventTimeStamp = now(),
		lastAnimatedTimeStamp = eventTimeStamp,
		
		//Save the currentStepAnimation based on the last trigered scrollEvent
		//Will be refreshed every time the eventTimeStamp is different than the lastAnimatedTimeStamp
		/*currentStepAnimation = {
			x: 0,
			y: 0
		},*/
		
		//Save the last direction (Refreshed at every tick)
		/*currentAnimationDirection = {
			x: 0,
			y: 0
		},*/
		
		currentAnimationDuration = {
			x: 0,
			y: 0
		},
		
		currentStartAnimationPosition = {
			x: 0,
			y: 0
		},
		
		//Save the target position (updated by the scroll event)
		targetPosition = {
			x: 0,
			y: 0
		},
		
		//Save the distance between current position and the target (Refreshed at every tick)
		targetDistance = {
			x: 0,
			y: 0
		},

		//Save the current ghost position (Refreshed when tick apply animation)
		currentPosition = {
			x: 0,
			y: 0
		},
		
		_setTimeout = function (fx, delay) {
			var w = window,
				frm = w.requestAnimationFrame || w.mozRequestAnimationFrame ||  
					w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
					w.oRequestAnimationFrame || w.setTimeout;
		
			return frm(fx, delay);
		},
		
		_clearTimeout = function (timeout) {
			var w = window,
				frm = w.cancelAnimationFrame || w.webkitCancelRequestAnimationFrame ||
					w.mozCancelRequestAnimationFrame || w.oCancelRequestAnimationFrame ||
					w.msCancelRequestAnimationFrame  || w.clearTimeout;
					
			return frm(timeout);
		},
		
		//Reference the current timer
		timer = null,
		
		defaultOffset = {left:0,top:0},
		
		_handleScroll = function (e, o, targetPosition) {
			var offset = o.container.offset() || defaultOffset;
			targetPosition.x = o.container.scrollLeft() - offset.left;
			targetPosition.y = o.container.scrollTop() - offset.top;
		},
		
		_handleMouse = function (e, o, targetPosition) {
			var offset = o.container.offset() || defaultOffset;
			targetPosition.x = e.pageX - offset.left;
			targetPosition.y = e.pageY - offset.top;
		},
		
		_handleTouch = function (e, o, targetPosition) {
			var offset = o.container.offset() || defaultOffset,
				touch = e.originalEvent.touches[0];
			targetPosition.x = touch.pageX - offset.left;
			targetPosition.y = touch.pageY - offset.top;
		},
		
		// Event Strategies
		_eventStrategies = {
			scroll: _handleScroll,
			click: _handleMouse,
			mouseover: _handleMouse,
			touchmove: _handleTouch
		},
		
		// Handle the container event
		_handleEvent = function (e) {
			// Call the strategy 
			_eventStrategies[o.event].call(t, e, o, targetPosition);
			
			// Update the event time
			eventTimeStamp = now()-1; // make it in the pass
			
			//console.log('New target ' + targetPosition.y);
			
			// Start the animation right now
			_nextFrame();
		},
		
		//Start a new timer
		startTimer = function () {
			if(!_checkStop(0)) {
				timer = _setTimeout(_nextFrame, o.tick);
			} else {
				_clearTimeout(timer);
				timer = null;
			}
			return timer;
		},
	
		// parses the duration options
		getDuration = function(o, targetDistance) {
			if(!$.isFunction(o.duration)) {
				return {
					x: o.durationX || o.duration,
					y: o.durationY || o.duration
				};
			} else {
				var result = o.duration.call(t, o, targetDistance);
				//console.log('y speed : ' + result.y);
				return {
					x: Math.abs(result.x),
					y: Math.abs(result.y)
				};
			}
		},
		
		// allow to calculate the first easing parameter
		getLegacyEasingValue = function (currentAnimationTime) {
			return {
				x: currentStartAnimationPosition.x + (Math.min(1, $.sdiv(currentAnimationTime, currentAnimationDuration.x)) * (targetPosition.x-currentStartAnimationPosition.x)),
				y: currentStartAnimationPosition.y + (Math.min(1, $.sdiv(currentAnimationTime, currentAnimationDuration.y)) * (targetPosition.y-currentStartAnimationPosition.y))
			};
		},
		
		//Allow to stop the animation
		_checkStop = function (o) {
			if (!$.isFunction(o.stop)) {
				return !!o;
			}
			return o.stop();
		},
		
		//Called at every tick
		_nextFrame = function () {
			
			if(!_checkStop(0)) {
				
				// save travel distance needed
				targetDistance.x = targetPosition.x - currentPosition.x;
				targetDistance.y = targetPosition.y - currentPosition.y;
				
				// animation : Do we have something to travel
				if (targetDistance.x !== 0 || targetDistance.y !== 0) {
					
					// if the value changed since lass pass
					if (eventTimeStamp > lastAnimatedTimeStamp) {
						
						// Update current duration
						currentAnimationDuration = getDuration(o, targetDistance);
						
						//Save the start point of the animation
						currentStartAnimationPosition.x = currentPosition.x;
						currentStartAnimationPosition.y = currentPosition.y;
						
						// save the new directions
						//currentAnimationDirection.x = targetDistance.x < 0 ? -1 : targetDistance.x > 0 ? 1 : 0;
						//currentAnimationDirection.y = targetDistance.y < 0 ? -1 : targetDistance.y > 0 ? 1 : 0;
						
						// Set Last Animated Time Stamp to the new scroll Event Time Stamp
						// This acts as the new animation start
						lastAnimatedTimeStamp = now();
					} // if scrolled
					
					//Begin Var
					var 
					
					// current animation time (where are we rith now)
					currentAnimationTime = now() - lastAnimatedTimeStamp,
					
					// Linear/swing algorigthm
					linearPosition = getLegacyEasingValue(currentAnimationTime),
					easingFx = o.easing || $.easing.def || 'linear',
					easingCurPosition = {
						// we documented the parameter names and logic, since there is an error on
						// the main doc: http://gsgd.co.uk/sandbox/jquery/easing/. end_value is actually a diff.
						//                    old_fx,           current_time,                                               start_value,                     end_value-start_value,                             duration
						x: $.easing[easingFx](linearPosition.x, Math.min(currentAnimationTime, currentAnimationDuration.x), currentStartAnimationPosition.x, targetPosition.x-currentStartAnimationPosition.x, currentAnimationDuration.x),
						y: $.easing[easingFx](linearPosition.y, Math.min(currentAnimationTime, currentAnimationDuration.y), currentStartAnimationPosition.y, targetPosition.y-currentStartAnimationPosition.y, currentAnimationDuration.y)
					};
					
					// end var
					
					//console.log(targetPosition.x + ' ' + targetPosition.y + ' - ' + easingCurPosition.x + ' ' + easingCurPosition.y);
					if (!!o.debug && !!window.console) {
						console.log(lastAnimatedTimeStamp +
								' Target ' + targetPosition.y + 
								' - Start ' + parseInt(currentStartAnimationPosition.y,10) + 
								' - Linear ' + parseInt(linearPosition.y,10) + 
								' - Eased ' + parseInt(easingCurPosition.y,10) + 
								' - Time ' + Math.min(currentAnimationTime, currentAnimationDuration.y) + 
								' - Duration ' + currentAnimationDuration.y);
					}
					
					// update currentPosition state
					currentPosition.y = easingCurPosition.y;
					
					// if we still have time left on the animation
					if (currentAnimationTime < currentAnimationDuration.x || currentAnimationTime < currentAnimationDuration.y) {
						// queue next frame
						startTimer();
					} else {
						// animation stopped
						timer = null;
					}
					
					// call callback with new ghost position
					if ($.isFunction(o.tickCallback)) {
						o.tickCallback.call(t, currentAnimationTime, currentPosition);
					}
				} 
			} else {
				// we stop, no timer are needed
				timer = null;
			}
		},
		
		// assure minimal option object
		o = $.extend({
			container: null, // The DOMElement where to listen the event. Target if omitted.
			tick: 16, // Default timeout when requestAnimationFrame is not available. In ms.
			event: 'scroll', // The event to listen to
			durationX: null, // X axis animation duration. Numeric. duration if omitted.
			durationY: null, // Y axis animation duration. Numeric. duration if omitted.
			duration: 0, // Both axis animation duration. Numeric or function
			stop: null, // A stop function to stop the animation. Your logic, your rules.
			step: null, // A function to call at each step of the animation.
			easing: null, // A easing function to use. $.easing.def or linear if omitted.
			debug: false // set to true to get extra data in the console.
		}, options);
		
		// assure container
		// if not container is set, use the target
		o.container = $(o.container || t);
		
		// hook up on event
		o.container.on(_handleEvent);
		
		// start timer
		startTimer();
	}; // end $.fn.extend
})(jQuery);
