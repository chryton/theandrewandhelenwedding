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
					<form v-if="state == 'start'" @submit="checkApi" id="rsvp_check">
						<label for="user_zip"> Zipcode </label>
						<input name="user_zip" id="user_zip" type="number">
						<label for="user_id"> ID </label>
						<input name="user_id" id="user_id" type="number">
						<input type="submit">
					</form>
					<form v-if="state == 'invited'" @submit="updateStatus" id="rsvp_form">
						<h3>Are you able to attend?</h3>
						<select v-bind:value="attending" class="rsvp--attend" @change="updateAttending">
							<option value="true">Wouldn't miss it for the world</option>
							<option value="false">Will celebrate from afar</option>
						</select>
						<div class="rsvp--attendee_inputs_wrapper" v-for="(attendee, index) in attendees">
							<div class="rsvp--attendee_inputs" v-if="typeof attendee.name !== 'object'" v-bind:data-attendee-index="index">
								<input type="text" placeholder="Name" v-bind:value="attendee.name" @change="updateAttendee" @blur="updateAttendee" @focus="updateAttendee" class="attendee_name">
								<select v-bind:value="attendee.food" @change="updateAttendee" @blur="updateAttendee" @focus="updateAttendee" class="attendee_food">
									<option value="Beef">Beef</option>
									<option value="Chicken">Chicken</option>
									<option value="Vegetarian">Vegetarian</option>
								</select>
							</div>
						</div>
						<textarea class="rsvp--message" v-bind:value="message"@change="updateMessage" @blur="updateMessage" @focus="updateMessage"></textarea>
						<button class="add_attendee" @click="addAttendee">Bring Someone Along</button>

						<button type="submit" class="submit" @click="updateStatus">Submit</button>
					</form>
				</div>
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
							
							WED.data.state = "invited";
							WED.data.id = res.rowId;
							WED.data.message = res.message;
						}

					}).fail(function(res){
						console.error(res);
					});
				},
				updateStatus: function(e) {
					console.log('updating');
					e.preventDefault();
					e.stopImmediatePropagation();

					$.ajax({
						type: 'POST',
						url: '/api/update',
						data: {
							"id": WED.data.id,
							"attending": WED.data.attending,
							"message": WED.data.message,
							"with_child": WED.data.child,
							"attendees": WED.data.attendees
						}
					}).done(function(res){
						console.log(res)
					});
				},
				addAttendee: function(e) {
					e.preventDefault();
					e.stopImmediatePropagation();
					WED.data.attendees.push({attendee: "", food: "Beef"});
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
		});

	}

	return {
		init: init
	};

})(WED, jQuery);