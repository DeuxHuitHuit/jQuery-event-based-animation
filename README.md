# jQuery Event Based Animation

#### Version 1.2

jQuery plugin that offers a different way to do animations. jQuery animations are time based,
i.e. total duration AND end values must be known from the start.
This project aims to break this barrier by allowing
you to change end (or target) values during the animation, based on multiples events. If you try
to do something like this with `$.fn.animate` and `$.fn.stop`, you will see that the effect is
jerky and that real control is pretty impossible to achieve. 

The two main goals of this project is to avoid having the same *RAF* loop copied all over
the place and to provide a flexible approach to event based animation yet maintaining a
simple ways to customize the behavior, mostly via callbacks functions.

## Usage

````javascript
$('#target').eventAnimate({
	// event: 'scroll', // is the default
	duration: 1000,
	easing: 'swing', // or whatever!
	step: function (time, position) {
		this.find('.anim').css({
			left: position.x + 'px',
			top: position.y + 'px'
		});
	}
});
````

Now, if the scroll values changes during the animation, even if the scroll
changes direction, the animation will continue towards the new value, starting
from where it is currently.

The plugin does not actually touch the DOM. It is your responsibility to implement
a proper `step` function for the animation you want to do. This makes animation on multiple elements
much faster to process.

See the tests for more examples.

### Options

These are all the supported options and their default values.

````javascript
{
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
	// function (currentAnimationTime, currentPosition, currentStartAnimationPosition, targetPosition, o)
	step: null,
	
	// A callback function called when the animation ends.
	// function (currentAnimationTime, currentPosition)
	complete: null,
	
	// The number of ms to wait after the last step before
	// calling the complete callback
	completeDelay: 16,
	
	// A callback function called when the animation begins.
	// function (currentAnimationTime, currentPosition)
	start: null, 
	
	// A easing function to use. $.easing.def or linear if omitted.
	easing: null,
	
	// A strategy function for your custom event.
	// This parameters accepts function (e, o, targetPosition, ...),
	// string (containing the name of the function) or and
	// object that contains multiple strategy ({scroll:..., click:...}.
	// Note that this function will receive all arguments you would
	// expect from that event, after the targetPosition parameter.
	// scroll, click, mouseover, mousemove and touchmove are already
	// implemented but easily overridable.
	strategy: null,
	
	// A function that permits override of the stating values
	// function (options, currentPosition)
	// Can be a plain object too
	startValues: null, 
	
	// Set to true to get extra data in the console.
	// Can be set per property, i.e. {x:false, y:true}
	debug: false
}
````

There is nothing like reading the source if you really want to know how each option is used.
As always, feel free to fork and pull some love.

## Changelog

- Version 1.1 - 2013-01-xx
	- Added mutiple properties support
	- Revisited the event loop

- Version 1.0 - 2012-12-21
	- Initial version
	
## License

MIT Licensed. See LICENSE.txt    
(c) [Deux Huit Huit](http://www.deuxhuithuit.com/?ref=github)