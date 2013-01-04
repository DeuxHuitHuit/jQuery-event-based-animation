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