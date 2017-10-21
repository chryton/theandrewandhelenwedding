WED.router = (function(WED, $){

	function init() {

		// Rotating Hero
		if ($('.hero.rotating').length){
			WED.hero.init();
		}

		WED.rsvp.init();

	}

	return {
		init: init
	};

})(WED, jQuery);

WED.router.init();