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
		scrollEventTimeStamp = now(),
		lastAnimatedTimeStamp = scrollEventTimeStamp,
		
		//Save the currentStepAnimation based on the last trigered scrollEvent
		//Will be refreshed every time the scrollEventTimeStamp is different than the lastAnimatedTimeStamp
		currentStepAnimation = {
			x: 0,
			y: 0
		},
		
		//Save the last direction (Refreshed at every tick)
		currentAnimationDirection = {
			x: 0,
			y: 0
		},
		
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
		
		//Handle the container scroll event
		_scroll = function (e) {
			targetPosition.x = t.scrollLeft();
			targetPosition.y = t.scrollTop();
			
			scrollEventTimeStamp = now()-1; // make it in the pass
			
			console.log('New target ' + targetPosition.y);
			
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
	
		getDuration = function(o, targetDistance) {
			if(!$.isFunction(o.durationCallback)) {
				return {
					x: o.durationX,
					y: o.durationY
				};
			} else {
				var result = o.durationCallback(targetDistance);
				//console.log('y speed : ' + result.y);
				return {
					x: Math.abs(result.x),
					y: Math.abs(result.y)
				};
			}
		},
		
		// allow to calculate the first easing parameter
		getLegacyEasingValue = function () {
			var temp = {
				x: currentPosition.x + (currentAnimationDirection.x * currentStepAnimation.x),
				y: currentPosition.y + (currentAnimationDirection.y * currentStepAnimation.y)
			};

			// assure we do not go further than the target
			if (Math.abs(temp.x - targetPosition.x) < currentStepAnimation.x) {
				temp.x = targetPosition.x;
			}
			if (Math.abs(temp.y - targetPosition.y) < currentStepAnimation.y) {
				temp.y = targetPosition.y;
			}
			return temp;
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
					if (scrollEventTimeStamp > lastAnimatedTimeStamp) {
						
						currentAnimationDuration = getDuration(o, targetDistance);
						
						var
						
						//Define nb of cycle for the duration asked (duration / tick = nb cycle)
						cycleCountX = Math.ceil($.sdiv(currentAnimationDuration.x, o.tick)),
						cycleCountY = Math.ceil($.sdiv(currentAnimationDuration.y, o.tick));
						
						//Define the new step needed
						currentStepAnimation.x = Math.abs($.sdiv(targetDistance.x, cycleCountX));
						currentStepAnimation.y = Math.abs($.sdiv(targetDistance.y, cycleCountY));
						
						//Save the start point of the animation
						currentStartAnimationPosition.x = currentPosition.x;
						currentStartAnimationPosition.y = currentPosition.y;
						
						// save the new directions
						currentAnimationDirection.x = targetDistance.x < 0 ? -1 : targetDistance.x > 0 ? 1 : 0;
						currentAnimationDirection.y = targetDistance.y < 0 ? -1 : targetDistance.y > 0 ? 1 : 0;
						
						// Set Last Animated Time Stamp to the new scroll Event Time Stamp
						// This acts as the new animation start
						lastAnimatedTimeStamp = now();
					} // if scrolled
					
					//Begin Var
					var 
					
					// current animation time (where are we rith now)
					currentAnimationTime = now() - lastAnimatedTimeStamp,
					
					// Linear/swing algorigthm
					linearPosition = getLegacyEasingValue(),
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
					console.log(lastAnimatedTimeStamp +
								' Target ' + targetPosition.y + 
								' - Start ' + parseInt(currentStartAnimationPosition.y,10) + 
								' - Eased ' + parseInt(easingCurPosition.y,10) + 
								' - Time ' + Math.min(currentAnimationTime, currentAnimationDuration.y) + 
								' - Duration ' + currentAnimationDuration.y);
					
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
			container: $(window),
			tick: 16,
			durationX: 500,
			durationY: 500,
			durationCallback: null,
			stop: null,
			tickCallback: null,
			easing: null
		}, options);
		
		// assure container
		o.container = $(o.container);
		
		// hook up on mouse move event
		o.container.scroll(_scroll);
		
		// start timer
		startTimer();
	}; // end $.fn.extend
})(jQuery);
