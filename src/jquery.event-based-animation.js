/*
 *  Event Based Animation v1.0 - jQuery plugin
 *
 *  Copyright (c) 2012 Deux Huit Huit (http://www.deuxhuithuit.com/)
 *  Licensed under the MIT (https://raw.github.com/DeuxHuitHuit/jQuery-event-based-animation/master/LICENSE.txt)
 */
(function ($, undefined) {
	
	"use strict";
	
	if (!$.isFunction($.isString)) {
		$.isString = function (object) {
			return $.type(object) === 'string';
		};
	}
	
	$.fn.eventAnimate = function (options) {
		
		var
		
		// the target DOMElement
		t = $(this),
		
		// Window object
		win = $(window),
		
		// Quick timestamp
		now = $.now,
		
		// Safe division
		sdiv = function (n, d) {
			if (!n || !d) {
				return 0;
			}
			return n/d;
		},
		
		// Quick iterator
		_forEach = function (o, iterator) {
			$.each(o.properties, function _each(index, key) {
				iterator(key);
			});
		},
		
		// Quick setter
		_setEach = function (o, object, values) {
			_forEach(o, function (key) {
				object[key] = $.isFunction(values) ? 
								values(key) : 
								($.isArray(values) ? values[key] : values);
			});
		},
		
		// Quick validator
		_validateEach = function (o, validator, operation) {
			// Fix arguments
			if ($.isFunction(operation)) {
				var oldVal = validator;
				validator = operation;
				operation = oldVal;
			} else if (operation !== '||') {
				operation = '&&';
			}
			
			var 
			isAnd = operation === '&&',
			and = function (a,b) { return a && b; },
			or = function (a,b) { return a && b; },
			fx = isAnd ? and : or,
			result = isAnd; // add true if and, false if or
			
			_forEach(o, function (key) {
				result = fx(result, validator(key));
				if ((isAnd && result) || (!isAnd && !result)) {
					return false; // exit
				}
			});
			
			return result;
		},
		
		// Last event triggered
		eventTimeStamp = now(),
		
		// Last animation frame
		lastAnimatedTimeStamp = eventTimeStamp,
		
		// Current running animation duration
		currentAnimationDuration = {},
		
		// Current animation start values
		currentStartAnimationPosition = {},
		
		// Save the target position (updated by the event)
		targetPosition = {},
		
		// Save the distance between current position and the target (Refreshed at every tick)
		targetDistance = {},

		// Save the current ghost position (Refreshed when tick apply animation)
		currentPosition = {},
		
		_initVariables = function (o) {
			_setEach(o, currentAnimationDuration, 0);
			_setEach(o, currentStartAnimationPosition, 0);
			_setEach(o, targetPosition, 0);
			_setEach(o, targetDistance, 0);
			_setEach(o, currentPosition, 0);
		},
		
		_setTimeout = function (fx, delay) {
			var w = window,
				frm = w.requestAnimationFrame || w.mozRequestAnimationFrame ||  
					w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
					w.oRequestAnimationFrame || w.setTimeout;
		
			return frm(fx, frm === w.setTimeout ? delay : o.container.get(0));
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
		
		// Event Strategies implementation
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
		
		// Defaults Event Strategies
		_eventStrategies = {
			scroll: _handleScroll,
			click: _handleMouse,
			mouseover: _handleMouse,
			mousemove: _handleMouse,
			touchmove: _handleTouch
		},
		
		// Handle the container event
		_handleEvent = function (e) {
			var 
			eventName = e.type || o.event,
			strategy = _eventStrategies[eventName];
			
			if ($.isFunction(strategy)) {
				// Call the strategy 
				strategy.call(t, e, o, targetPosition);
				
				// Update the event time
				if (!isMoving || !!o.restartOnEvent) {
					eventTimeStamp = now()-1; // make it in the past
				}
				
				//  Schedule frame if not moving
				if (!isMoving) {
					
					// Only schedule for frame
					if (!!o.delayStart) {
						startTimer();
					}
					// Start the animation right now
					else {
						_nextFrame(); 
					}
				}
				
			} else if (!!window.console) {
				console.err('No strategy found for event "' + eventName + '"');
			}
		},
		
		// Start a new timer
		startTimer = function () {
			if (!_checkStop(o)) {
				timer = _setTimeout(_nextFrame, o.tick);
			} 
			// animation stopped, so no timer is allowed
			else {
				_clearTimeout(timer);
				timer = null;
			}
			return timer;
		},
	
		// Parses the duration options
		_getDuration = function(o, targetDistance, startValues, targetValues) {
			var r = {};
			if ($.isFunction(o.duration)) {
				var result = o.duration.call(t, o, targetDistance);
				_setEach(o, r, function (key) {
					return Math.abs(result[key] || result || targetDistance[key]) * o.durationRatio;
				});
			} else {
				_setEach(o, r, function (key) {
					return Math.abs(o.duration[key] || o.duration || targetDistance[key]) * o.durationRatio;
				});
			}
			return r;
		},
		
		// parses the startValue options
		_getStartValues = function (o) {
			var startValues = null;
			if ($.isFunction(o.startValues)) {
				startValues = o.startValues(o);
			}
			if (!startValues) {
				startValues = currentPosition;
			}
			return startValues;
		},
		
		// Calculate the first "legacy" easing parameter
		_getLegacyEasingValue = function (o, currentAnimationTime) {
			var e = {};
			_setEach(o, e, function (key) {
				return currentStartAnimationPosition[key] + (Math.min(1, sdiv(currentAnimationTime, currentAnimationDuration[key])) * (targetPosition[key] - currentStartAnimationPosition[key]));
			});
			return e;
		},
		
		_debugOutput = function (o, linearPosition, easingCurPosition, currentAnimationTime) {
			if (!!window.console && console.log && !!o.debug) {
				_forEach(o, function (key) {
					if (o.debug === true || o.debug[key] === true) {
						console.log(lastAnimatedTimeStamp +
								' Target ' + key + ' ' + parseInt(targetPosition[key],10) + 
								' - Start ' + parseInt(currentStartAnimationPosition[key],10) + 
								' - Linear ' + parseInt(linearPosition[key],10) + 
								' - Eased ' + parseInt(easingCurPosition[key],10) + 
								' - Time ' + Math.min(currentAnimationTime, currentAnimationDuration[key]) + 
								' - Duration ' + currentAnimationDuration[key]);
					}
				});
			}
		},
		
		// Allow to stop the animation
		_checkStop = function (o) {
			if (!$.isFunction(o.stop)) {
				return false;
			}
			return o.stop(o);
		},
		
		// Called at every tick
		_nextFrame = function () {
			
			if(!_checkStop(o)) {
				
				// save travel distance needed
				_setEach(o, targetDistance, function (key) {
					return targetPosition[key] - currentPosition[key];
				});
				
				// animation : Do we have something to travel
				if (targetDistance.x !== 0 || targetDistance.y !== 0) {
					
					// if the value changed since lass pass,
					// i.e. an event occur between two frames
					// or before the current one
					if (eventTimeStamp > lastAnimatedTimeStamp) {
					
						// Save the start point of the animation
						var startValues = _getStartValues(o);
						
						// Update target distances
						targetDistance.x = targetPosition.x - startValues.x;
						targetDistance.y = targetPosition.y - startValues.y;
						
						// Update current duration
						currentAnimationDuration = _getDuration(o, targetDistance, startValues, targetPosition);
						
						// Set start as current
						currentStartAnimationPosition = startValues;
						
						// Set Last Animated Time Stamp to the new scroll Event Time Stamp
						// This acts as the new animation start
						if (!isMoving || !!o.restartOnEvent) {
							lastAnimatedTimeStamp = now();
						}
					} // if scrolled
					
					// Begin Var
					var 
					
					// Current animation time (where are we rith now)
					currentAnimationTime = now() - lastAnimatedTimeStamp,
					
					// Linear/swing algorigthm
					linearPosition = _getLegacyEasingValue(o, currentAnimationTime),
					easingFx = o.easing || $.easing.def || 'linear',
					easingCurPosition = {
						// We documented the parameter names and logic, since there is an error on
						// the main doc: http://gsgd.co.uk/sandbox/jquery/easing/. end_value is actually a diff.
						//                    old_fx,           current_time,                                               start_value,                     end_value-start_value,                             duration
						x: $.easing[easingFx](linearPosition.x, Math.min(currentAnimationTime, currentAnimationDuration.x), currentStartAnimationPosition.x, targetPosition.x-currentStartAnimationPosition.x, currentAnimationDuration.x),
						y: $.easing[easingFx](linearPosition.y, Math.min(currentAnimationTime, currentAnimationDuration.y), currentStartAnimationPosition.y, targetPosition.y-currentStartAnimationPosition.y, currentAnimationDuration.y)
					};
					
					// end var
					
					// DEBUG
					_debugOutput(o, linearPosition, easingCurPosition, currentAnimationTime);
					
					if ($.isNumeric(easingCurPosition.x) && $.isNumeric(easingCurPosition.y)) {
						// update currentPosition state
						currentPosition = easingCurPosition;
					}
					
					// Start Callback
					if (!isMoving && $.isFunction(o.start)) {
						o.start.call(t, currentAnimationTime, currentPosition);
					}
					
					// Assure moving flag is on
					isMoving = true;
					
					// if we still have time left on the animation
					if (currentAnimationTime < currentAnimationDuration.x || 
						currentAnimationTime < currentAnimationDuration.y) {
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
					if (timer === null) {
						if ($.isFunction(o.complete)) {
							o.complete.call(t, currentAnimationTime, currentPosition);
						}
						// reset if we have to
						currentPosition = _getStartValues(o);
					}
					
				} 
				// no distance found
				else {
					// animation won't run
					timer = null;
					isMoving = false;
				}
			} 
			// animation stopped
			else {
				// we stop, no timer is needed
				timer = null;
				isMoving = false;
			}
		},
		
		// assure minimal option object
		o = $.extend({
			container: null, // The DOMElement where to listen the event. Target if omitted.
			tick: 16, // Default timeout when requestAnimationFrame is not available. In ms.
			event: 'scroll', // The event(s) to listen for changes
			properties: 'x y', // The properties that we are animating (array or string)
			delayStart: false, // Make the event schedule next frame instead of calling it
			duration: 0, // Both axis animation duration. Numeric, object (x:1,y:1} or function
			durationRatio: 1, // Duration modifier. Particularly usefull when duration depends on distance
			restartOnEvent: false, // creates an absolute start time instead of relative to the last event
			stop: null, // A stop function to stop the animation. Your logic, your rules.
			step: null, // A function to call at each step of the animation.
			complete: null, // A callback function called when the animation ends.
			start: null, // A callback function called when the animation begins.
			easing: null, // A easing function to use. $.easing.def or linear if omitted.
			strategy: null, // A strategy function for your custom event.
			startValues: null, // A function that permits override of the stating values
			debug: false // Set to true to get extra data in the console. Can be set per axis {x:false, y:true}
		}, options);
		
		// If not container is set, use the target
		o.container = $(o.container || t);
		
		// Add the new strategy if needed
		if ($.isFunction(o.strategy)) {
			_eventStrategies[o.event] = o.strategy;
		}
		// If strategy is a string, try code re-use
		else if ($.isString(o.strategy)) {
			_eventStrategies[o.event] = _eventStrategies[o.strategy];
		}
		// If strategy is an object, add multiple events
		else if ($.isPlainObject(o.strategy)) {
			$.each(o.strategy, function _importStrategy(key, s) {
				_eventStrategies[key] = s;
			});
		}
		
		// Split into array if it is a string
		if ($.isString(o.properties)) {
			o.properties = o.properties.split(' ');
		}
		
		// If no animatable properties have been found
		if (!$.isArray(o.properties) || o.properties.length < 1) {
			// Cannot continue
			return t;
		}
		
		// Init "globals"
		_initVariables(o);
		
		// Hook up on event
		o.container.on(o.event, _handleEvent);
		
		// Always return jQuery object
		return t;
		
	}; // end $.fn.extend
})(jQuery);
