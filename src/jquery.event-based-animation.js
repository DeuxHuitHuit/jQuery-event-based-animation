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
		
		// Safe division
		sdiv = function (n, d) {
			if (!n || !d) {
				return 0;
			}
			return n/d;
		},
		
		// Last event trigered
		eventTimeStamp = now(),
		
		// Last animation frame
		lastAnimatedTimeStamp = eventTimeStamp,
		
		// Current running animation duration
		currentAnimationDuration = {
			x: 0,
			y: 0
		},
		
		// Current animation start values
		currentStartAnimationPosition = {
			x: 0,
			y: 0
		},
		
		//Save the target position (updated by the event)
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
		
		isMoving = false,
		
		defaultOffset = {left:0,top:0},
		
		_handleScroll = function (e, o, targetPosition) {
			targetPosition.x = o.container.scrollLeft();
			targetPosition.y = o.container.scrollTop();
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
			mousemove: _handleMouse,
			touchmove: _handleTouch,
			mousedrag: _handleMouse,
		},
		
		// Handle the container event
		_handleEvent = function (e) {
			var strategy = _eventStrategies[o.event];
			
			if ($.isFunction(strategy)) {
				// Call the strategy 
				strategy.call(t, e, o, targetPosition);
				
				// Update the event time
				eventTimeStamp = now()-1; // make it in the pass
				
				// Start the animation right now
				_nextFrame();
				
			} else if (!!window.console) {
				console.err('No strategy found for event "' + o.event + '"');
			}
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
					x: o.duration.x || o.duration,
					y: o.duration.y || o.duration
				};
			} else {
				var result = o.duration.call(t, o, targetDistance);
				return {
					x: Math.abs(result.x || result),
					y: Math.abs(result.y || result)
				};
			}
		},
		
		// allow to calculate the first easing parameter
		getLegacyEasingValue = function (currentAnimationTime) {
			return {
				x: currentStartAnimationPosition.x + (Math.min(1, sdiv(currentAnimationTime, currentAnimationDuration.x)) * (targetPosition.x-currentStartAnimationPosition.x)),
				y: currentStartAnimationPosition.y + (Math.min(1, sdiv(currentAnimationTime, currentAnimationDuration.y)) * (targetPosition.y-currentStartAnimationPosition.y))
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
					
					if (!!o.debug && !!window.console) {
						console.log(lastAnimatedTimeStamp +
								' Target ' + targetPosition.y + 
								' - Start ' + parseInt(currentStartAnimationPosition.y,10) + 
								' - Linear ' + parseInt(linearPosition.y,10) + 
								' - Eased ' + parseInt(easingCurPosition.y,10) + 
								' - Time ' + Math.min(currentAnimationTime, currentAnimationDuration.y) + 
								' - Duration ' + currentAnimationDuration.y);
					}
					
					// Start Callback
					if (!isMoving && $.isFunction(o.start)) {
						o.start.call(t);
					}
					isMoving = true;
					
					// update currentPosition state
					currentPosition = easingCurPosition;
					
					// if we still have time left on the animation
					if (currentAnimationTime < currentAnimationDuration.x || currentAnimationTime < currentAnimationDuration.y) {
						// queue next frame
						startTimer();
					} else {
						// animation stopped
						timer = null;
						isMoving = false;
					}
					
					// call callback with new ghost position
					if ($.isFunction(o.step)) {
						o.step.call(t, currentAnimationTime, currentPosition);
					}
					
					// End Callback
					if (timer === null && $.isFunction(o.complete)) {
						o.complete.call(t);
					}
				} 
			} else {
				// we stop, no timer are needed
				timer = null;
				isMoving = false;
			}
		},
		
		// assure minimal option object
		o = $.extend({
			container: null, // The DOMElement where to listen the event. Target if omitted.
			tick: 16, // Default timeout when requestAnimationFrame is not available. In ms.
			event: 'scroll', // The event to listen to
			duration: 0, // Both axis animation duration. Numeric, object (x:1,y:1} or function
			stop: null, // A stop function to stop the animation. Your logic, your rules.
			step: null, // A function to call at each step of the animation.
			complete: null, // A callback function called when the animation ends.
			start: null, // A callback function called when the animation begins.
			easing: null, // A easing function to use. $.easing.def or linear if omitted.
			strategy: null, // A strategy function for your custom event.
			debug: false // set to true to get extra data in the console.
		}, options);
		
		// assure container
		// if not container is set, use the target
		o.container = $(o.container || t);
		
		// Add the new strategy if needed
		if ($.isFunction(o.strategy)) {
			_eventStrategies[o.event] = o.strategy;
		}
		
		// hook up on event
		o.container.on(o.event, _handleEvent);
		
		// start timer
		startTimer();
		
	}; // end $.fn.extend
})(jQuery);
