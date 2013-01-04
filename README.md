# jQuery Event Based Animation

#### Version 1.1

jQuery plugin that offers a different way to do animations. jQuery animations are time based,
i.e. total duration us know from the start. This project aims to break thir barrier by allowing
you to change end (or target) values during the animation, based on multiples events.

The two main goals of this project is to avoid having the same *raf* loop copied all over
the place and to provide a flexible approach to event based animation yet maintaining a
simple ways to customize the behavior, mostly via callbacks functions.

## Usage

````javascript
$('#target').eventAnimate({
	// event: 'scroll', // is the default
	durationRatio: 1,
	step: function (time, position) {
		this.find('.anim').css({
			left: position.x + 'px',
			top: position.y + 'px'
		});
	}
});
````

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
	stop: null,
	
	// A function to call at each step of the animation.
	step: null,
	
	// A callback function called when the animation ends.
	complete: null,
	
	// A callback function called when the animation begins.
	start: null, 
	
	// A easing function to use. $.easing.def or linear if omitted.
	easing: null,
	
	// A strategy function for your custom event.
	strategy: null,
	
	// A function that permits override of the stating values
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

- Version 1.0 - 2012-12-21
	- Initial version
	
## License

MIT Licensed. See LICENSE.txt    
(c) [Deux Huit Huit](http://www.deuxhuithuit.com/?ref=github)