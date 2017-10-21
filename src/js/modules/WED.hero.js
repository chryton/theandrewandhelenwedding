WED.hero = (function(WED, $){

	var numberOfSlides = $('.rotating .hero--image').length,
		nextIndex = 2;

	function startTimer(index){
		window.setTimeout(function(){
			$('.rotating .hero--image.active').removeClass('active');
			$('.rotating .hero--image:nth-child(' + index + ')').addClass('active');

			nextIndex++;

			if (nextIndex > numberOfSlides){
				nextIndex = 1;
			}
			
			startTimer(nextIndex);
			
		}, 6000);
	}
	
	function init() {

		startTimer(nextIndex);

	}

	return {
		init: init
	};

})(WED, jQuery);