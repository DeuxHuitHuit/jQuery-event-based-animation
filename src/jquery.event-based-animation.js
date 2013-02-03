/*
 *  Event Based Animation v1.0 - jQuery plugin
 *
 *  Copyright (c) 2012-2013 Deux Huit Huit (http://www.deuxhuithuit.com/)
 *  Licensed under the MIT LICENSE
 *  (https://raw.github.com/DeuxHuitHuit/jQuery-event-based-animation/master/LICENSE.txt)
 */
(function ($, undefined) {
	
	"use strict";
	
	// Utilities
	var
	
	// Window object
	win = $(window),
	
	// Safe division
	sdiv = function (n, d) {
		// This function will be compiled as a one liner
		// So we can leave this code, which is way more readable then
		// return (!n || !d) ? 0 : n/d;
		if (!n || !d) {
			return 0;
		}
		return n/d;
	},
	
	// Assure we are dealing with numbers
	int = function (i) {
		return parseInt(i, 10);
	},
	float = function (i) {
		return parseFloat(i);
	},
	
	// Console shim
	_error = function (msg) {
		if (!!window.console) {
			console[!!console.error ? 'error' : 'log']('[eventAnimate] ' + msg);
		}
	},
	
	// Quick iterator
	_forEach = function (o, iterator) {
		$.each(o.properties, function _each(index, key) {
			return iterator(key);
		});
	},
	
	// Quick setter
	_setEach = function (o, object, values) {
		_forEach(o, function _setOne(key) {
			object[key] = $.isFunction(values) ? 
							values(key) : 
							($.isArray(values) || $.isPlainObject(values) ? values[key] : values);
		});
		return object;
	},
	
	// Quick validator
	_and = function (a,b) { return a && b; },
	_or = function (a,b) { return a || b; },
	_validateEach = function (o, validator, isOr) {
		var 
		isAnd = !isOr,
		fx = isAnd ? _and : _or,
		result = isAnd; // add true if and, false if or
		
		_forEach(o, function _validateOne(key) {
			result = fx(result, validator(key));
			if ((isAnd && !result) || (!isAnd && result)) {
				return false; // early exit
			}
		});
		
		return result;
	},
	
	// Raf...
	_setTimeout = function (fx, o) {
		var w = window,
			frm = w.requestAnimationFrame || w.mozRequestAnimationFrame ||  
				w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
				w.oRequestAnimationFrame || w.setTimeout;
	
		return frm(fx, frm === w.setTimeout ? o.tick : o.container.get(0));
	},
	
	// cRaf...
	_clearTimeout = function (timeout) {
		var w = window,
			frm = w.cancelAnimationFrame || w.webkitCancelRequestAnimationFrame ||
				w.mozCancelRequestAnimationFrame || w.oCancelRequestAnimationFrame ||
				w.msCancelRequestAnimationFrame  || w.clearTimeout;
				
		return frm(timeout);
	},
	
	// Parses the duration options
	_getDuration = function(o, targetDistance, startValues, targetValues) {
		var 
		// The result
		r = {},
		// Get ratio object
		durationRatio = ($.isFunction(o.durationRatio) && o.durationRatio.call(t, o, targetDistance, startValues, targetValues)) ||
						o.durationRatio || {},
						
		// Get duration object
		duration = ($.isFunction(o.duration) && o.duration.call(t, o, targetDistance, startValues, targetValues)) ||
						o.duration || {},
		
		// Get a single int value
		getInt = function (object, key) {
			return int(object[key]) || int(object);
		},
		
		// Get a single float value
		getFloat = function (object, key) {
			return float(object[key]) || float(object);
		},
		
		// Parse one duration ratio
		getDurationRatio = function (key) {
			return getFloat(durationRatio, key);
		},
		
		// Parse one duration
		getDuration = function (key) {
			return getInt(duration, key);
		},
		
		// Parse the distance
		getDistance = function (key) {
			return Math.abs(int(targetDistance[key]));
		};
		
		// For each property
		return _setEach(o, r, function _setOneDuration(key) {
			var
			ratio = getDurationRatio(key),
			dur = getDuration(key);
			return !!ratio ? ratio * getDistance(key) : dur;
		});
	};
	
	// isString support
	if (!$.isFunction($.isString)) {
		$.isString = function (object) {
			return $.type(object) === 'string';
		};
	}
	
	// jQuery plugin
	$.fn.eventAnimate = function (options) {
		
		var
		
		// the target DOMElement
		t = $(this),
		
		// Quick timestamp
		now = $.now,
		
		// Last event triggered
		eventTimeStamp = 0,
		
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
			_setEach(o, targetPosition, 0); // Assure members
			_setEach(o, targetPosition, _getStartValues(o)); // Set start
			_setEach(o, targetDistance, 0);
			_setEach(o, currentPosition, 0);
		},
		
		// Reference the current timer
		timer = null,
		
		// Animating flag
		isMoving = false,
		
		// Path for items without an offset
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
			args = [e,o,targetPosition],
			eventName = e.type || o.event,
			strategy = _eventStrategies[eventName];
			
			if ($.isFunction(strategy)) {
				$.each(arguments, function _eachArg(index, arg) {
					if (index > 0) {
						args.push(arg);
					}
				});
				
				// Call the strategy with all the
				// original args
				strategy.apply(t, args);
				
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
				
			} else {
				_error('No strategy found for event "' + eventName + '"');
			}
		},
		
		// Start a new timer
		startTimer = function () {
			if (!_checkStop(o)) {
				timer = _setTimeout(_nextFrame, o);
			} 
			// animation stopped, so no timer is allowed
			else {
				_clearTimeout(timer);
				timer = null;
			}
			return timer;
		},
		
		// parses the startValue options
		_getStartValues = function (o) {
			var startValues = null;
			if ($.isFunction(o.startValues)) {
				startValues = o.startValues(o);
			} else if ($.isPlainObject(o.startValues)) {
				startValues = {};
				_setEach(o, startValues, function _setEachStartValue(key) {
					return o.startValues[key] || currentPosition[key];
				});
			}
			// use start values if nothing is found
			if (!startValues) {
				startValues = currentPosition;
			}
			return startValues;
		},
		
		// Calculate the first "legacy" easing parameter
		_getLegacyEasingValue = function (o, currentAnimationTime) {
			var e = {};
			_setEach(o, e, function _computeLegacyEasingValue(key) {
				var
				dist = targetPosition[key] - currentStartAnimationPosition[key],
				timeRatio = Math.min(1, sdiv(currentAnimationTime, currentAnimationDuration[key]));
				return currentStartAnimationPosition[key] + (timeRatio * dist);
			});
			return e;
		},
		
		// Ouputs one line per property
		_debugOutput = function (o, linearPosition, easingCurPosition, currentAnimationTime) {
			if (!!window.console && console.log && !!o.debug) {
				_forEach(o, function _debugOutputOneProp(key) {
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
		
		// Distance checking
		_distanceIsNotZero = function (key) { 
			return targetDistance[key] !== 0; 
		},
		
		// Called at every tick
		_nextFrame = function () {
			
			if(!_checkStop(o)) {
				
				// save travel distance needed
				_setEach(o, targetDistance, function _setTargetDistance(key) {
					return targetPosition[key] - currentPosition[key];
				});
				
				// Animation : Do we have something to travel?
				if (_validateEach(o, _distanceIsNotZero, true)) {
					
					// if the value changed since lass pass,
					// i.e. an event occur between two frames
					// or before the current one
					if (eventTimeStamp > lastAnimatedTimeStamp) {
					
						// Save the start point of the animation
						var startValues = _getStartValues(o);
						
						// If we should restart anim on event
						if (!!o.restartOnEvent) {
							// Update target distances
							_setEach(o, targetDistance, function _updateTargetDistance(key) {
								return targetPosition[key] - startValues[key];
							});
						}
						
						// Update current duration
						currentAnimationDuration = _getDuration(o, targetDistance, startValues, targetPosition);
						
						// Set start as current
						currentStartAnimationPosition = startValues;
						
						// Set Last Animated Time Stamp to the new scroll Event Time Stamp
						// This acts as the new animation start
						if (!isMoving || !!o.restartOnEvent) {
							lastAnimatedTimeStamp = eventTimeStamp-1;
						}
					} // if changed
					// continue where we are at 
					else {
						
					}
					
					// Begin Var
					var 
					
					// Current animation time (where are we rith now)
					currentAnimationTime = now() - lastAnimatedTimeStamp,
					hasTimeLeft = function (key) {
						return currentAnimationTime < currentAnimationDuration[key];
					},
					// Linear/swing algorithm
					linearPosition = _getLegacyEasingValue(o, currentAnimationTime),
					easingCurPosition = {},
					easingIsNumeric = function (key) {
						return $.isNumeric(easingCurPosition[key]);
					},
					easignIsObject = $.isPlainObject(o.easing);
					// end var
					
					// calculate easing
					_setEach(o, easingCurPosition, function _setEasing(key) {
						var 
						keyEasign = easignIsObject && o.easing[key],
						stringEasing = !easignIsObject && o.easing,
						easingFx = keyEasign || stringEasing || $.easing.def || 'linear',
						time = Math.min(currentAnimationTime, currentAnimationDuration[key]),
						dist = targetPosition[key] - currentStartAnimationPosition[key];
						
						// never call easing fx without a duration
						return !currentAnimationDuration[key] ? targetPosition[key] :
						// We documented the parameter names and logic, since there is an error on
						// the main doc: http://gsgd.co.uk/sandbox/jquery/easing/.
						// `end_value` is actually a delta of the values.
								$.easing[easingFx](
									// old_fx
									linearPosition[key], 
									// current_time
									time,
									// start_value
									currentStartAnimationPosition[key],
									// end_value-start_value (dist)
									dist,
									// duration
									currentAnimationDuration[key]
								);
					});
					
					// DEBUG
					_debugOutput(o, linearPosition, easingCurPosition, currentAnimationTime);
					
					if (_validateEach(o, easingIsNumeric, true)) {
						// update currentPosition state
						currentPosition = easingCurPosition;
					}
					
					// start Callback
					if (!isMoving && $.isFunction(o.start)) {
						o.start.call(t, currentAnimationTime, currentPosition);
					}
					
					// assure moving flag is on
					isMoving = true;
					
					// if we still have time left on the animation
					if (_validateEach(o, hasTimeLeft, true)) {
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
					
					// end Callback
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
		
		// assure default options values
		o = $.extend({
			// The DOMElement where to listen the event. Target if omitted.
			container: null,
			
			// Default timeout when requestAnimationFrame is not available. In ms.
			tick: 16,
			
			// The event(s) to listen for changes
			event: 'scroll', 
			
			// The properties that we are animating (array or string)
			properties: 'x y',
			
			// Make the event schedule next frame instead of calling it
			delayStart: false,
			
			// Both axis animation duration.
			// Numeric, object (x:1,y:1} or function (o, targetDistance, startValues, targetValues)
			duration: 0, 
			
			// Duration modifier. Particularly usefull when duration depends on distance.
			// Numeric, object (x:1,y:1} or function (o, targetDistance, startValues, targetValues)
			durationRatio: 1, 
			
			// Creates an absolute start time instead of relative to the last event
			restartOnEvent: false,
			
			// A stop function to stop the animation. Your logic, your rules.
			// function (options) { return true||false; }
			stop: null,
			
			// A function to call at each step of the animation.
			// function (currentAnimationTime, currentPosition)
			step: null,
			
			// A callback function called when the animation ends.
			// function (currentAnimationTime, currentPosition)
			complete: null,
			
			// A callback function called when the animation begins.
			// function (currentAnimationTime, currentPosition)
			start: null, 
			
			// A easing function to use. $.easing.def or linear if omitted.
			easing: null,
			
			// A strategy function for your custom event.
			// This parameters accepts function (e, o, targetPosition, ...),
			// string (containing the name of the function) or and
			// object that contains mutiple stategy ({scroll:..., click:...}.
			// Note that this function will receive all arguments you would
			// expect from that event, after the targetPosition parameter.
			// scroll, click, mouseover, mousemove and touchmove are already
			// implemented but easily overridable.
			strategy: null,
			
			// A function that permits override of the stating values
			startValues: null, 
			
			// Set to true to get extra data in the console.
			// Can be set per property, i.e. {x:false, y:true}
			debug: false
		}, options),
		
		// The actual jquery plugin function
		_init = function (o) {
		
			// If no container is set, use the target
			o.container = $(o.container || t);
			if (!o.container.length) {
				// No container found, exit
				_error('No container found');
				return t;
			}
			
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
					if ($.isString(s)) {
						_eventStrategies[key] = _eventStrategies[s];
					} else {
						_eventStrategies[key] = s;
					}
				});
			}
			
			// Split into array if it is a string
			if ($.isString(o.properties)) {
				o.properties = o.properties.split(' ');
			}
			
			// If no animate-able properties have been found
			if (!$.isArray(o.properties) || o.properties.length < 1) {
				// Cannot continue
				_error('No animatable properties have been set.');
				return t;
			}
			
			// Init "globals"
			_initVariables(o);
			
			// Hook up on event
			o.container.on(o.event, _handleEvent);
			
			// Always return jQuery object
			return t;
		};
		
		// Init and return
		return _init(o);
		
	}; // end $.fn.extend
	
	// Attach to public object for tests
	$.eventAnimate = {
		_validateEach: _validateEach,
		_getDuration: _getDuration
	};
	
})(jQuery);
