WED.rsvp = (function(WED, $){

	var rsvpForm;
	
	function init() {

		rsvpForm = new Vue({
			el: "#rsvp_flow",
			data() {
				return WED.data;
			},
			template: `
				<div class="rsvp">
					<transition name="fade">
						<component v-bind:is="state"></component>
					</transition>
				</div>
			`,
			components: {
				"start": {
					template: `
						<form @submit="checkApi" id="rsvp_check" class="rsvp--component">
							<span class="input_group">
								<label for="user_zip"> Zipcode </label>
								<input name="user_zip" id="user_zip" type="number" placeholder="Zipcode">
							</span>
							<span class="input_group">
								<label for="user_id"> ID </label>
								<input name="user_id" id="user_id" type="number" placeholder="ID">
							</span>
							<button type="submit" class="submit">Lookup Your RSVP</button>
						</form>
					`,
					methods: {
						checkApi: function(e) {
							e.preventDefault();
							e.stopImmediatePropagation();
		
							$.ajax({
								type: 'GET',
								url: '/api/check',
								data: {
									zipcode: $('#user_zip').val(),
									id: $('#user_id').val()
								}
							}).done(function(res){
								console.log(res);
								if (res.isInvited){
									WED.data.attendees = res.attendees.map(function(a){
										var name = a.attendee,
											food = (typeof a.attendeeFood != 'object') ? a.attendeeFood : "Beef",
											attendee = {
												"name": name,
												"food": food
											};
											
										return attendee;
									}).filter(function(a){
										return typeof a.name == 'string';
									});
									
									console.log(WED.data);
									
									WED.data.id = res.rowId;
									WED.data.message = res.message;
									WED.data.state = "invited";
								} else {
									WED.data.state = "sorry";
								}
		
							}).fail(function(res){
								console.error(res);
								WED.data.state = "sorry";
							});
						}
					}
				},
				"sorry": {
					data() {
						return WED.data;
					},
					template: `
						<div class="rsvp--sorry rsvp--component">
							<h2 class="rsvp--heading">Oops...</h2>
							<p>Looks like we ran into a snag. Please try again. If you hit this a few times, try emailing us at <a href="mailto:showmethemauney@gmail.com">showmethemauney@gmail.com</a></p>
							<a href="#rsvp" class="btn--try_again" @click="state = 'start'">Try Again</a>
						</div>
					`
				},
				"invited": {
					data: function() {
						return WED.data
					},
					template: `
					<form @submit="updateStatus" id="rsvp_form" class="rsvp--component">
						<h3 class="rsvp--heading small">Are you able to attend?</h3>
						
						<span class="select_wrapper">
							<select v-bind:value="attending" class="rsvp--attend" @change="updateAttending">
								<option value="true">Wouldn't miss it for the world</option>
								<option value="false">Will celebrate from afar</option>
							</select>
						</span>
						
						<h3 class="rsvp--heading small">Who is coming?</h3>
						
						<div class="rsvp--attendee_inputs_wrapper input_group" v-for="(attendee, index) in attendees">
							<div class="rsvp--attendee_inputs" v-if="typeof attendee.name !== 'object'" v-bind:data-attendee-index="index">

								<input type="text" placeholder="Name" v-bind:value="attendee.name" @change="updateAttendee" @blur="updateAttendee" @focus="updateAttendee" class="attendee_name">

								<span class="select_wrapper">
									<select v-bind:value="attendee.food" @change="updateAttendee" @blur="updateAttendee" @focus="updateAttendee" class="attendee_food">
										<option value="Beef">Beef</option>
										<option value="Chicken">Chicken</option>
										<option value="Vegetarian">Vegetarian</option>
									</select>
								</span>

							</div>
						</div>
							
						<button class="add_attendee" @click="addAttendee" class="rsvp--add_guest">Bring Someone Along</button>
						
						<h3 class="rsvp--heading small">Have a message for the Helen and Andrew?</h3>
						<div class="input_group">
							<textarea class="rsvp--message" v-bind:value="message"@change="updateMessage" @blur="updateMessage" @focus="updateMessage"></textarea>
						</div>

						<button type="submit" class="submit" @click="updateStatus">RSVP</button>
					</form>
					`,
					methods: {
						updateStatus: function(e) {
							console.log('updating');
							e.preventDefault();
							e.stopImmediatePropagation();
							
							var validAttendees = WED.data.attendees.filter(function(data){
								return data.name;
							});
							
							$.ajax({
								type: 'POST',
								url: '/api/update',
								data: {
									"id": WED.data.id,
									"attending": WED.data.attending,
									"message": WED.data.message,
									"with_child": WED.data.child,
									"attendees": validAttendees
								}
							}).done(function(res){
								console.log(res);
								WED.data.state = "done";
							});
						},
						addAttendee: function(e) {
							e.preventDefault();
							e.stopImmediatePropagation();
							if (WED.data.attendees.length < 5){
								WED.data.attendees.push({attendee: "", food: "Beef"});
								if (WED.data.attendees.length === 5) {
									$('.add_attendee').addClass('disabled');
								}
							}
						},
						updateAttending: function() {
							WED.data.attending = $('.rsvp--attend').val();
						},
						updateMessage: function() {
							WED.data.message = $('.rsvp--message').val();
						},
						updateAttendee: function(e) {
							var attendeeIndex = $(e.target).closest('.rsvp--attendee_inputs').attr('data-attendee-index');
							
							WED.data.attendees[attendeeIndex] = {
								name: $('.rsvp--attendee_inputs[data-attendee-index="' + attendeeIndex + '"] .attendee_name').val(),
								food: $('.rsvp--attendee_inputs[data-attendee-index="' + attendeeIndex + '"] .attendee_food').val()
							}
						}
					}
				},
				"done": {
					data: function() {
						return WED.data
					},
					template: `
						<div class="rsvp--done" class="rsvp--component">
							<h2 class="rsvp--heading">Thanks!</h2>
							<p v-if="attending === true">We're glad you can come and we can't wait to see you!</p>
							<p v-else>We're sorry you can't attend but we feel your love and celebrations from afar. Have a libation on the day!<p>
						</div>
					`
				}
			},
			methods: {
			}
		});

	}

	return {
		init: init
	};

})(WED, jQuery);