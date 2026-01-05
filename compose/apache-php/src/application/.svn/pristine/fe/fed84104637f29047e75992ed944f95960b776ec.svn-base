class PeopleViewer {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "PeopleViewer";
		this.version = 1.0;
		this.author = "Steve Schmuland";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "People Viewer";
		this.tabContentFile = "application/plugins/PeopleViewer/tab-content.html";
		this.resultsTreeData = [];
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.addPlugin();
		this.peopleData = [];
		this.officeLocationList = [];
		this.workunitsList = [];
		this.currentUser = {};
		this.peopleFilterList = [];
		this.peopleSkillList = [];
		this.skillList = [];

	// Define and add the route path points hover layer
	this.cityLayer = new ol.layer.Vector({
		source: new ol.source.Vector({}),
		style: new ol.style.Style({
			image: new ol.style.Icon({
				scale: .06,
				src: "application/plugins/PeopleViewer/img/city.png"
			})
		})
	});
	this.cityLayer.setZIndex(608);
	this.cityLayer.set('title', 'City Layer')
	app.map.addLayer(this.cityLayer);

	// Define and add the route path points hover layer
	this.officeLayer = new ol.layer.Vector({
		source: new ol.source.Vector({}),
		style: new ol.style.Style({
			image: new ol.style.Icon({
				scale: .06,
				src: "application/plugins/PeopleViewer/img/building.png"
			})
		})
	});
	this.officeLayer.setZIndex(600);
	this.officeLayer.set('title', 'Office Layer')
	app.map.addLayer(this.officeLayer);


	}


	/**
 	* Function: getData
 	* @param (string) 
 	* @returns () nothing
 	* Function gets data from json file
 	*/
	
	 getData() {

		//Clear contents of people container
		$('#person-list').empty();
		
		//clear global lists
		this.peopleData = [];
		this.skillList = [];
	
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.PeopleViewer.tabContent)[0]);
		
		//Ajax Call to get a list of skills
		var getSkills = $.ajax({
			type: "GET",
			url: "api/peopleportal/skills",
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(data) {
			app.plugins.PeopleViewer.skillList = data
		
		})
		.fail(function(jqxhr, settings, exception) {
			var error = jqxhr.responseText;
			logger("ERROR", error);
			//spinner.stop();
			showModalDialog("ERROR", error);
		});
		
		
		//Ajax Call to get a list of people
		var getPeople = $.ajax({
			type: "GET",
			url: "api/peopleportal/people",
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(data) {
			app.plugins.PeopleViewer.peopleData = data
		})
		.fail(function(jqxhr, settings, exception) {
			var error = jqxhr.responseText;
			logger("ERROR", error);
			//spinner.stop();
			showModalDialog("ERROR", error);
		});

		var getCurrentUser = $.ajax({
			type: "GET",
				//url: "/api/peopleportal/currentuser",
				url: "api/peopleportal/currentuser",
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
		})
		.done(function(data) {
			app.plugins.PeopleViewer.currentUser = data})

		$.when(getSkills, getPeople, getCurrentUser).done(function () {
			app.plugins.PeopleViewer.buildCards();
			app.plugins.PeopleViewer.buildLocations();
			app.plugins.PeopleViewer.buildSkillFilter();
			app.plugins.PeopleViewer.getJobTitleList();
			//If IMB Staff Manager is Open,refresh
			if ( $("#mfw-IMB-staff-manager").is(":visible") ) {
				app.plugins.PeopleViewer.openStaffManager();
			}
			spinner.stop(); // Stop the spinner 
			
		})
		.fail(function(jqxhr, textStatus, errorThrown) {
			var error = jqxhr ? jqxhr.responseText : "An unknown error occurred";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
			spinner.stop(); // Stop the spinner in case of failure
		});


	}

	/**
 	* Function: takeWebcamCapture
 	* @param (string) 
 	* @returns () nothing
 	* Function that takes a image with the users webcam
 	*/
	 takeWebcamCapture() {
		const imagePreview = document.getElementById('imagePreview');
		$('#imagePreview').hide();
		const takeScreenshotButton = document.getElementById('takeScreenshot');
		const countdownElement = document.getElementById('countdown');
		const videoElement = document.getElementById('videoPreview');
		let videoStream;

		// Function to handle video stream and countdown
			navigator.mediaDevices.getUserMedia({ video: true })
			.then((stream) => {
				videoStream = stream;
				videoElement.srcObject = stream;
				videoElement.style.display = 'block'; // Show the video element
				let countdown = 5;
				countdownElement.textContent = countdown;
				// Start the countdown
				const countdownInterval = setInterval(() => {
					countdown--;
					countdownElement.textContent = countdown;
					if (countdown === 0) {
						clearInterval(countdownInterval);
						captureScreenshot(videoElement);
						countdownElement.textContent = '';  // Clear countdown after capture
						videoStream.getTracks().forEach(track => track.stop()); // Stop the webcam stream
						videoElement.style.display = 'none'; // Hide the video element after capture
					}
				}, 1000);
			})
			.catch((error) => {
				console.error('Error accessing the webcam', error);
			});
		
		// Function to capture the screenshot and update imagePreview
		function captureScreenshot(videoElement) {
			const canvas = document.createElement('canvas');
			canvas.width = 600;
			canvas.height = 400;
			const context = canvas.getContext('2d');
			context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
			// Set the captured frame as the src for the imagePreview with compression (quality: 0 to 1)
			const quality = 0.8; // Adjust this value to control compression (0 = lowest quality, 1 = highest quality)
			imagePreview.src = canvas.toDataURL('image/jpeg', quality);
			$('#imagePreview').show();
		}
	}

	/**
 	* Function: getCurrentTimestamp
 	* @param (string) 
 	* @returns () nothing
 	* Function that gets the current timestamp
 	*/
	getCurrentTimestamp() {
		const now = new Date();
		return now.toISOString();
	}


	/**
 	* Function: uploadImage
 	* @param (string) 
 	* @returns () nothing
 	* Function that uploads the users image file and uses it in the imagePreview
 	*/
	 uploadImageFile() {
		document.getElementById('fileInput').click();
		document.getElementById('fileInput').addEventListener('change', function(event) {
			const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = function() {
                    // Create a canvas to compress the image
                    const canvas = document.createElement('canvas');
                    const maxWidth = 800; // Set a max width for the compressed image
                    const maxHeight = 800; // Set a max height for the compressed image
                    let width = img.width;
                    let height = img.height;

                    // Resize if the image is larger than the max dimensions
                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        } else {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress the image by setting the quality parameter
                    const quality = 0.7; // Adjust this value between 0 and 1
                    document.getElementById('imagePreview').src = canvas.toDataURL('image/jpeg', quality);
                };
            };
            reader.readAsDataURL(file);
        }
    });
}

	/**
	* Function: getJobTitleList
	* @param (string) 
	* @returns () nothing
	* Function that builds job title list  
	*/
	getJobTitleList(){
		$('#pp-title-filter').empty();
		var titleList = []
		$.each(this.peopleData, function (index, people) {
			if (people.JOB_TITLE && people.JOB_TITLE.length > 0) {
				if (!titleList.includes(people.JOB_TITLE)) {
					titleList.push(people.JOB_TITLE);
				}
			}
		})
		//Sort Job List
		titleList.sort();
		$.each(titleList, function (index, job) {
			var jobDiv = $('<div class="form-check"><input class="form-check-input" type="checkbox" value="" id="title-flexCheck'+index+'"><label class="form-check-label" for="title-flexCheck'+index+'">'+job+'</label></div>')
			$(jobDiv).click(function(){
				app.plugins.PeopleViewer.filterCards(null)
				app.plugins.PeopleViewer.filterCharts();
			})
			$('#pp-title-filter').append(jobDiv)
		})
	}

	/**
 	* Function: Create New Person	
 	* @param (string) 
 	* @returns () nothing
 	* Function that creates new person and saves object to database
 	*/
	 createNewPerson(personObject) {
		$.ajax({
			type: "POST",
			url: "api/peopleportal/people",
			data: JSON.stringify(personObject),
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(response) {
			console.log("Person updated successfully:", response);
			app.plugins.PeopleViewer.getData();
			
			
		})
		.fail(function(jqxhr, settings, exception) {
			var error = jqxhr.responseText;
			console.error("Error updating person:", error);
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});		
	}

	/**
 	* Function: deletePerson	
 	* @param (string) 
 	* @returns () nothing
 	* Function that deletes a person by their ID in the database
 	*/
	 deletePerson(data) {
		bootbox.confirm({
			title: "Delete Person?",
			message: "Do you want to delete "+data.FNAME+" "+data.LNAME+"?",
			buttons: {
				cancel: {
					label: "Cancel"
				},
				confirm: {
					label: "Delete",
					className: "btn-danger"
				}
			},
			callback: function (result) {
				if (result === true) {
					$.ajax({
						type: "DELETE",
						url: "api/peopleportal/person/" + data.PERSON_ID, // Assuming 'idir' is the unique identifier
						xhrFields: {
							withCredentials: true
						}
					})
					.done(function(response) {
						console.log("Person successfully Removed:", response);
						app.plugins.PeopleViewer.getData();
						
						
					})
					.fail(function(jqxhr, settings, exception) {
						var error = jqxhr.responseText;
						console.error("Error removing person:", error);
						logger("ERROR", error);
						showModalDialog("ERROR", error);
					});	
				}
			}
		})
	
	}

	/**
 	* Function: Update Person	
 	* @param (string) 
 	* @returns () nothing
 	* Function that updates a person to the database
 	*/
	 updatePerson(personObject,personID) {
		//Make sure user has at least 1 about me topic for their profile
		var updatePerson = $.ajax({
				url: "api/peopleportal/person/" + personID, // Assuming 'idir' is the unique identifier
				type: "PUT",
				contentType: "application/json",
				data: JSON.stringify(personObject),
				xhrFields: {
					withCredentials: true
				},
				success: function(response) {
					console.log("Person updated successfully:", response);
					// Optionally, you can add code here to handle the successful update, such as refreshing the UI
				},
				error: function(jqxhr, status, error) {
					console.error("Error updating person:", error);
					// Optionally, you can add code here to handle the error, such as showing an error message to the user
				}
			});

		$.when(updatePerson).done(function () {
			app.plugins.PeopleViewer.getData()
			
		})
		.fail(function(jqxhr, textStatus, errorThrown) {
			var error = jqxhr ? jqxhr.responseText : "An unknown error occurred";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});
	}
	
	/**
	* Function: buildSkillFilter
	* @param (string) 
	* @returns () nothing
	* Function that builds skill list  
	*/
	buildSkillFilter(){
		$.each(app.plugins.PeopleViewer.skillList, function (index, skill) {
			var count = skill.FREQUENCY;
			if(count >= 1 && count <= 2){var skillDiv = $('<button class="btn btn-light badge-small" value="'+skill.SKILL+'">'+skill.SKILL+'</button>')}
			if(count >= 3 && count <= 6){var skillDiv = $('<button class="btn btn-light badge-medium" value="'+skill.SKILL+'">'+skill.SKILL+'</button>')}
			if(count >= 7 && count <= 10){var skillDiv = $('<button class="btn btn-light badge-xlarge" value="'+skill.SKILL+'">'+skill.SKILL+'</button>')}
			
			$(skillDiv).click(function(){
				$(skillDiv).toggleClass("active");
				

				app.plugins.PeopleViewer.filterCards(null)
				app.plugins.PeopleViewer.filterCharts();
			})
			$('#skillFilters').append(skillDiv)
		}) 
	}

		/**
 	* Function: Create New skill	
 	* @param (string) 
 	* @returns () nothing
 	* Function that creates new skill and saves object to database
 	*/
	 createNewSkill(skillObject) {
		$.ajax({
			type: "POST",
			url: "api/peopleportal/skills",
			data: JSON.stringify(skillObject),
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(response) {
			app.plugins.PeopleViewer.getData()
			
		})
		.fail(function(jqxhr, settings, exception) {
			var error = jqxhr.responseText;
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});		
	}


	/**
	* Function: calculateYearsAndMonths
	* @param (string) 
	* @returns () nothing
	* Function calculates the difference between a given date and the current date
	*/
	calculateYearsAndMonths(dateString){
		if(!dateString ){
			return "N/A";
			
		}else{

		
			const startDate = new Date(dateString);
			const today = new Date();

			let years = today.getFullYear() - startDate.getFullYear();
			let months = today.getMonth() - startDate.getMonth();

			// Adjust if the month difference is negative
			if (months < 0) {
				years--;
				months += 12;
			}

			return `${years} years ${months} months`;
		}
		
	}


	/**
	* Function: setCSSOnResize
	* @param (string) 
	* @returns () nothing
	* Function that sets css on elements when window is resized
	*/
	setCSSOnResize() {
		const width = window.innerWidth;
		const contentDiv = $("#content");
		const mapDiv = $("#map");
		  if (width >= 1040) {
			contentDiv.css({"display": "flex","flex-direction": "row-reverse"});
			mapDiv.css({"width": "50%","height": "100%"});
		
		} else {
			contentDiv.css({"display": "flex","flex-direction": "column"});
			mapDiv.css({"width": "100%","height": "100%"});
		}
		
	}



	/**
	* Function: getPersonOffice
	* @param (string) 
	* @returns () nothing
	* Function takes the id of a person and matches to a list of objects and gets office name
	*/
	getPersonOffice(officeID){
		const office = this.officeLocationList.find(item => item.OFFICE_ID === officeID);
		if (office) {
			return office.OFFICE;
		}
		
	}

	/**
	* Function: getfficeID
	* @param (string) 
	* @returns () nothing
	* Function takes the id of a person and matches to a list of objects and gets office name
	*/
	getofficeID(officeName) {
		const office = this.officeLocationList.find(item => item.OFFICE === officeName);
		if (office) {
			return office.OFFICE_ID;
		}
	}


	/**
	* Function: getWorkUnits
	* @param (string) 
	* @returns () nothing
	* Function takes the id of a workunit and matches to a list of workunit objects
	*/
	getPersonWorkunit(workunitID){
		const workunit = this.workunitsList.find(item => item.WORKUNIT_ID === workunitID);
		return workunit ? workunit.WORKUNIT : null; // Return null if OFFICE_ID is not found
		
	}

	/**
	* Function: getWorkUnitID	
	* @param (string) 
	* @returns () nothing
	* Function takes the name of a workunit and matches to a list of workunit objects
	*/
	getWorkUnitID(workunitName){
		const workunit = this.workunitsList.find(item => item.WORKUNIT === workunitName);
		return workunit ? workunit.WORKUNIT_ID : null; // Return null if OFFICE_ID is not found
		
	}


	/**
	* Function: getskillIds	
	* @param (array) 
	* @returns () nothing
	* Function takes the skill array and returns an array of skill ids
	*/
	getskillIds(skillArray){
		var skillIdList = [];
		$.each(skillArray, function (index, skill) {
			const skillRecord = app.plugins.PeopleViewer.skillList.find(item => item.SKILL === skill);
			skillIdList.push(skillRecord.SKILL_ID);
			

		})
		return skillIdList;
		
		
	}

	/**
	* Function: getSkillList
	* @param (string) 
	* @returns () nothing
	* Function takes the id of a skill and returns the name of the skill
	*/
	getSkillList(personID){
		const person = this.peopleData.find(item => item.PERSON_ID === personID);
		var skillIdList = person.SKILLS
		const skillMap = this.skillList.reduce((map, skill) => {
			map[skill.SKILL_ID] = skill.SKILL;
			return map;
		}, {});
	
		// Map each ID to its corresponding skill name
		const skills = skillIdList.map(id => skillMap[id] || `Unknown Skill (ID: ${id})`);
		
		return skills;
	}

	/**
	* Function: extractSkillsByPersonId
	* @param (string) 
	* @returns () nothing
	* Function that extracts all unique skills associated with a given PERSON_ID
	*/
	extractSkillsByPersonId(personId, data){
		
		
		// Filter the data to include only records with the specified PERSON_ID
		const filteredData = data.filter(record => record.PERSON_ID === personId);
		

		// Extract the SKILL field and remove duplicates using a Set
		const uniqueSkills = [...new Set(filteredData.map(record => record.SKILL))];
	
		return uniqueSkills;
	
	}

	/**
	* Function: filterCharts
	* @param (string) 
	* @returns () nothing
	* Function calculates filters charts based on the filter selection
	*/
	filterCharts(){
		
		if ( $(".mfw-title.ui-draggable-handle").is(":visible") ) {
			var chartTitle = $(".mfw-title.ui-draggable-handle").text()
			var data = app.plugins.PeopleViewer.peopleData
			if(app.plugins.PeopleViewer.peopleFilterList.length>0){
				var data = []
				$.each(app.plugins.PeopleViewer.peopleData, function (index, people) {
					if (app.plugins.PeopleViewer.peopleFilterList.includes(people.USERNAME)) {
						data.push(people)
					}
				})
			}
			if (chartTitle =="IMB Staff Locations by City"){
				$("#chart-canvas-1").remove();
				app.plugins.PeopleViewer.buildChartByCity(data);}

			if (chartTitle =="IMB Staff Locations by Office"){
				$("#chart-canvas-1").remove();
				app.plugins.PeopleViewer.buildChartByOffice(data);}

			if (chartTitle =="IMB Staff by Work Unit"){
				$("#chart-canvas-1").remove();
				app.plugins.PeopleViewer.buildChartByWorkUnit(data);}
				

			if (chartTitle =="IMB Staff By Start Date in IMB"){
				$("#chart-canvas-1").remove();
				app.plugins.PeopleViewer.buildChartByIMBStart(data);}
				

			if (chartTitle =="IMB Staff By Start Date in Public Service"){
				$("#chart-canvas-1").remove();
				app.plugins.PeopleViewer.buildChartByPSAStart(data);}			

			}
	}
	
	/**
	* Function: buildProfilOfTheDay
	* @param (string) 
	* @returns () nothing
	* Function builds builds the profile of the day section
	*/
	buildProfilOfTheDay(person){

		var personName = person.FNAME + " " + person.LNAME;
		var personID = person.PERSON_ID;
		var pronouns = person.PRONOUNS;
		var city= person.LOCATION;
		var skills = person.SKILLS;
		var skillList = app.plugins.PeopleViewer.getSkillList(personID);
		var idir = person.USERNAME;
		var aboutme = person.aboutme;
		var office = app.plugins.PeopleViewer.getPersonOffice(person.OFFICE_ID);
		var location = person.LOCATION;
		var email = person.EMAIL;
		var title = person.JOB_TITLE;
		var publicservicedate;
		var psaDateTime;
		if(person.PSA_START_DATE == null){
			publicservicedate = "N/A";
			psaDateTime = "N/A";
		}else{
			publicservicedate = person.PSA_START_DATE.date;
			psaDateTime = app.plugins.PeopleViewer.calculateYearsAndMonths(publicservicedate)
		}
		var imbdate;
		var IMBDateTime;
		if(person.IMB_START_DATE == null){
			imbdate = "N/A";
			IMBDateTime = "N/A";
		}else{
			imbdate = person.IMB_START_DATE.date;
			IMBDateTime = app.plugins.PeopleViewer.calculateYearsAndMonths(imbdate);}
		var workUnit = app.plugins.PeopleViewer.getPersonWorkunit(person.WORKUNIT_ID);
		var timeeStamp = app.plugins.PeopleViewer.getCurrentTimestamp();
		const base64String ="api//peopleportal/person/"+personID+"/image?v="+timeeStamp;
		
				
		var staffDetailsForm = $("<div id='pp-create-new-form'></div>");
			loadTemplate("application/plugins/PeopleViewer/staffdetailform.html", function(success, staffContent) {
				if (success) staffDetailsForm.append(staffContent)
					var newImg = $('<img id="imagePreview" src="'+base64String+'" alt="Contact Image"></img>')
					staffDetailsForm.find('#work-unit-value').text(workUnit ? workUnit : "");
					staffDetailsForm.find('#staff-name').text(personName ? personName : "");
					staffDetailsForm.find('#staff-pronouns').text(pronouns ? pronouns : "");
					staffDetailsForm.find('#staff-title').text(title ? title + " | " + (workUnit ? workUnit : "") : "");
					staffDetailsForm.find('#city-location-value').text(location ? location : "");
					staffDetailsForm.find('#city-location').text(location ? location : "");
					staffDetailsForm.find('#office-location-value').text(office ? office : "");
					staffDetailsForm.find('#PSA-date-total').text(psaDateTime ? psaDateTime : "");
					staffDetailsForm.find('#IMB-date-total').text(IMBDateTime ? IMBDateTime : "");
					staffDetailsForm.find('#imagePreview').replaceWith(newImg)
					var skillContainer = staffDetailsForm.find('#skillcontainer')
					var aboutMe = staffDetailsForm.find('#aboutme')
					var editProfileButton = staffDetailsForm.find('#pp-staff-edit-profile-btn')
					
					//Show edit profile button if IDIR is same as current user
					var profileIDIR = idir.toUpperCase()

					if(profileIDIR ==app.plugins.PeopleViewer.currentUser.idir){
						$(editProfileButton).show();
						
					}else{
						$(editProfileButton).hide();
					}
					
					//Add click function to edit profile button
					var closeButton = staffDetailsForm.find('#pp-staff-edit-profile-btn')
					$(editProfileButton).click(function(){
						//Close window
						const closeButton = document.querySelector('.bootbox-close-button');
						
						$(closeButton).click(); 
						
						app.plugins.PeopleViewer.editCreateProfile("Edit-Profile","None");
					})

					//Add teams and outlook icons
					var teamsChatButton = staffDetailsForm.find('#staff-teams')
					var emailbutton = staffDetailsForm.find('#staff-email')
					$(teamsChatButton).click(function(){
						window.open("https://teams.microsoft.com/l/chat/0/0?users="+email+"")
					})
					$(emailbutton).click(function(){
						window.location.href = 'mailto:'+email;
					})

					//Add About me information
						//Ajax Call to get a list of answers by user
						$.ajax({
							type: "GET",
							url: "api/peopleportal/answers?filter=PERSON_ID="+person.PERSON_ID,
							dataType: "json",
							xhrFields: {
								withCredentials: true
							}
						})
						.done(function(data) {
							if(data.length>0){
								$.each(data, function (index, entry) {
									var aboutmeEntry = entry.QUESTION;
									var aboutmeAnswer = entry.ANSWER;
									var count = $('#aboutme-container .aboutme').length;
									var removeDivCountID = count+1
									$(aboutMe).append('<div class="aboutme">\
														<p style="font-weight: 500;color: #212529cf;">'+aboutmeEntry+'</p>\
														<div class="answer">\
														<p style="font-style: italic;">'+aboutmeAnswer+'</p>\
														</div>\
														</div>');
									//Remove div when remove button is clicked
									$(document).on('click', '.btn-close', function() {
										const divLink = $(this).attr('divlink'); // Get the div ID from the button attribute
										$('#' + divLink).remove(); // Select and remove the div by its ID
									});
											
								})
							}else{
								aboutMe.hide()
							}
						
						})
						.fail(function(jqxhr, settings, exception) {
							var error = jqxhr.responseText;
							logger("ERROR", error);
							//spinner.stop();
							showModalDialog("ERROR", error);
						});
			
					var skillList = app.plugins.PeopleViewer.getSkillList(personID)
					// Collect the selected 'skill' values
					var skills = [];
					$.each(skillList, function (index, skill) {
						skills.push(skill)

					})
						
					if(skills.length>0){
						//Add skills to skill sections
						var profileSkillList = staffDetailsForm.find('#profile-skill-list')
						$.each(skills, function(index, skill) {
						
							$(profileSkillList).append('<span id="skill-pill" class="badge rounded-pill text-bg-secondary mx-1 p-2">'+skill+'</span>')	
					})

					}else{
						skillContainer.hide()

					}
					showModalDialog("",staffDetailsForm,"lg");})
	}

	/**
	* Function: buildCards
	* @param (string) 
	* @returns () nothing
	* Function builds cards of the people
	*/
	buildCards(){
		$.each(this.peopleData, function (index, person) {
			var profileOfTheDay = false;
			var personName = person.FNAME + " " + person.LNAME;
			var personID = person.PERSON_ID;
			var pronouns = person.PRONOUNS;
			var city= person.LOCATION;
			var skills = person.SKILLS;
			var skillList = app.plugins.PeopleViewer.getSkillList(personID);
			var idir = person.USERNAME;
			var aboutme = person.aboutme;
			var office = app.plugins.PeopleViewer.getPersonOffice(person.OFFICE_ID);
			var location = person.LOCATION;
			var email = person.EMAIL;
			var title = person.JOB_TITLE;
			var publicservicedate;
			var psaDateTime;
			if(person.PSA_START_DATE == null){
				publicservicedate = "N/A";
				psaDateTime = "N/A";
			}else{
				publicservicedate = person.PSA_START_DATE.date;
				psaDateTime = app.plugins.PeopleViewer.calculateYearsAndMonths(publicservicedate)
			}
			var imbdate;
			var IMBDateTime;
			if(person.IMB_START_DATE == null){
				imbdate = "N/A";
				IMBDateTime = "N/A";
			}else{
				imbdate = person.IMB_START_DATE.date;
				IMBDateTime = app.plugins.PeopleViewer.calculateYearsAndMonths(imbdate);}
			var workUnit = app.plugins.PeopleViewer.getPersonWorkunit(person.WORKUNIT_ID);
			var timeeStamp = app.plugins.PeopleViewer.getCurrentTimestamp();
			const base64String ="api//peopleportal/person/"+personID+"/image?v="+timeeStamp;	
				
			var personCardElement = $('\
			<div class="card m-2 float-start twm-app-card" id="person-card" city="'+city+'" idir="'+idir+'" skills="'+skillList+'" workunit="'+workUnit+'" title="'+title+'" office="'+office+'">\
				<img class="card-img-top" src="'+base64String+'" alt="'+personName+'" style="width: 100%; height: 150px;">\
				<div class="card-body font-weight-bold text-center p-1" id="card-name">\
				'+person.FNAME + "<br>" + person.LNAME+'\
			</div>');
			
			
			//Add Profile of the day
			if (person.PERSON_OF_THE_DAY_DISPLAYED != null) {
				const currentDate = new Date().toISOString().split('T')[0]; //Current Date
				const displayedDate = person.PERSON_OF_THE_DAY_DISPLAYED.date.split(' ')[0]; //displayed date for profile of the day
				if (displayedDate === currentDate) {
					profileOfTheDay = true;
					loadTemplate("application/plugins/PeopleViewer/profileoftheday.html", function(success, profileofthedayContent) {
						if (success) $('#profile-of-the-day').html(profileofthedayContent);
						$('#potd-staff-name').text(personName ? personName : "");
						$('#potd-staff-title').text(title ? title : "");
						$('#potd-work-unit').text(workUnit ? workUnit : "");
						$('#potd-city-location').text(location ? location : "");
						$('#potd-office-location-value').text(office ? office : "");
						$('#potd-PSA-date-total').text(psaDateTime ? psaDateTime : "");
						$('#potd-IMB-date-total').text(IMBDateTime ? IMBDateTime : "");
						var newImg = $('<img id="potd-imagePreview" src="'+base64String+'" alt="Contact Image"></img>')
						$('#potd-imagePreview').replaceWith(newImg)
						var aboutMe = $('#potd-aboutme')


						//Add open profile button
						var profileofthedayButton = $('<button class="btn btn-primary btn-sm">View Profile</button>')
						$(profileofthedayButton).click(function(){
							app.plugins.PeopleViewer.buildProfilOfTheDay(person)

						})
						$(".profile-of-the-day-footer").append(profileofthedayButton)
						
						//Add About me information
							//Ajax Call to get a list of answers by user
							$.ajax({
								type: "GET",
								url: "api/peopleportal/answers?filter=PERSON_ID="+person.PERSON_ID,
								dataType: "json",
								xhrFields: {
									withCredentials: true
								}
							})
							.done(function(data) {
								if(data.length>0){
									$.each(data, function (index, entry) {
										var aboutmeEntry = entry.QUESTION;
										var aboutmeAnswer = entry.ANSWER;
										var count = $('#aboutme-container .aboutme').length;
										var removeDivCountID = count+1
										$(aboutMe).append('<div class="potd-aboutme">\
															<p style="font-weight: 500;color: #212529cf;">'+aboutmeEntry+'</p>\
															<div class="potd-answer">\
															<p style="font-style: italic;">'+aboutmeAnswer+'</p>\
															</div>\
															</div>');
										//Remove div when remove button is clicked
										$(document).on('click', '.btn-close', function() {
											const divLink = $(this).attr('divlink'); // Get the div ID from the button attribute
											$('#' + divLink).remove(); // Select and remove the div by its ID
										});
												
									})
								}else{
									aboutMe.hide()
								}
							
							})
							.fail(function(jqxhr, settings, exception) {
								var error = jqxhr.responseText;
								logger("ERROR", error);
								//spinner.stop();
								showModalDialog("ERROR", error);
							});
					})
				}
			}

			$(personCardElement).click(function(){
				app.plugins.PeopleViewer.buildProfilOfTheDay(person)
			})
			
		personCardElement.hover(function(){
			app.map.getLayers().getArray().forEach(function(layer){
				if (layer.getSource().getFeatures) {
				var features = layer.getSource().getFeatures();
				$.each(features, function (index, feature) {
					var featureCity = feature.get("City");
					if(featureCity==city){
						highlightFeature(feature);
						//zoomToFeature(feature);
						
						}
						
					})
				}
			});	
			
		})
		
		
		$("#person-list").append(personCardElement)
			
		})
	}

	/**
	 * Function: filterCards
	 * @param (object) event
	 * @returns () nothing
	 * Function that filters the cards based on the location you clicked
	 */
	filterCards(event) {
		//clear filter list
		app.plugins.PeopleViewer.peopleFilterList = [];

		//Unhide all cards
		$('#person-list .card').each(function() {
			$(this).show();
		})
		//Filter card based on filtered list items that are checked
		if(event == null){
			var checkedWorkUnits = [];
			var checkedTitles = [];
			var checkedSkills = [];

			// Collect the selected 'workunit' values
			$('.work-unit-filter input[type="checkbox"]:checked').each(function() {
				var label = $(this).next('label').text().trim();
				checkedWorkUnits.push(label);
			});

			// Collect the selected 'title' values
			$('#pp-title-filter input[type="checkbox"]:checked').each(function() {
				var label = $(this).next('label').text().trim();
				checkedTitles.push(label);
			});

			// Collect the selected 'skill' values
			$('#skillFilters button').each(function() {
				if ($(this).hasClass('active')) {
					checkedSkills.push($(this).val());
				}
			});

			// Loop through all cards in #person-list
			$('#person-list .card').each(function() {
				var workunit = $(this).attr('workunit');
				var title = $(this).attr('title');
				var idir = $(this).attr('idir');
				var skills = $(this).attr('skills').split(",");
				// Check if any checked skill skills match the card's skills
				const hasAllRequiredSkills = checkedSkills.every(skill => skills.includes(skill));

				// Show/hide cards based on checked checkboxes
				if (
				  (checkedWorkUnits.length === 0 || checkedWorkUnits.includes(workunit)) &&
				  (checkedTitles.length === 0 || checkedTitles.includes(title)) &&
				  (checkedSkills.length === 0 || hasAllRequiredSkills ==true)
				) {
				  $(this).show(); // Show card if it matches
				  app.plugins.PeopleViewer.peopleFilterList.push(idir)
				  
				} else {
				  $(this).hide(); // Hide card if it doesn't match
				}
			  });
		//If click event, filter cards based on map click
		}else{
			// Get all features close to click
			var pixel = app.map.getEventPixel(event.originalEvent);
			var featureLayer;
			var cityList = []
			var officeList = []
			var feature = app.map.forEachFeatureAtPixel(pixel,
				function(feature, layer) {
					featureLayer = layer;
					var featureName = featureLayer.get('title');
					if(featureName =="City Layer"){
						cityList.push(feature.get("City"))
						}
					if(featureName =="Office Layer"){
						officeList.push(feature.get("Office"))
						}
			});
				
			if(cityList.length>0){
				$('#person-list .card').each(function() {
					// Check if the city attribute is in the list
					if (!cityList.includes($(this).attr('city'))) {
						// Hide the card if the city is not in the list
						$(this).hide();
					}else{
						$(this).show();
					}
				});
			}
			if(officeList.length>0){
				$('#person-list .card').each(function() {
					// Check if the city attribute is in the list
					if (!officeList.includes($(this).attr('office'))) {
						// Hide the card if the city is not in the list
						$(this).hide();
					}else{
						$(this).show();
					}
				});
			}
		}
	}

	/**
	* Function: editCreateProfile
	* @param (string) 
	* @returns () nothing
	* Function that builds the profile editor and profile creator screen
	*/
	editCreateProfile(functionType, selectedUser) {
		var peopleForm = $("<div id='pp-create-new-form'></div>");
		loadTemplate("application/plugins/PeopleViewer/staffform.html", function(success, ppContent) {
			if (success) peopleForm.append(ppContent);
			var savePersonButton = peopleForm.find('#save-person-button');
			var addSkillButton = peopleForm.find('#addskillbutton');
			var takeScreenShotbutton = peopleForm.find('#takeScreenshot');
			var uploadImage = peopleForm.find('#uploadimage');
			var createNewPersonButton = peopleForm.find('#create-person-button');
			var deletePersonButton = peopleForm.find('#delete-person-button');
			var addCityForm = peopleForm.find('#location');
			var $skillInput = peopleForm.find('#skillInput');
			var $suggestions = peopleForm.find('#skill-suggestions');
			var addAboutMe = peopleForm.find('#add-about-me-button');
			
			if (functionType == "Edit" || functionType == "Edit-Profile") {
				var data = {};
				peopleForm.find('#pp-IDIR-group').hide();
				peopleForm.find('#delete-person-button').hide();
				peopleForm.find('#create-person-button').hide();
				peopleForm.find('#superuser-container').hide();
				var formTitle = "Edit Staff";
				if (selectedUser == "None") {
					formTitle = "Profile Editor";
					selectedUser = app.plugins.PeopleViewer.currentUser.PERSON_ID;
				}else{
					peopleForm.find('#pp-IDIR-group').show();
				}

				if (functionType == "Edit-Profile") {
					$.each(app.plugins.PeopleViewer.peopleData, function(index, person) {
						if (person.PERSON_ID == selectedUser) {
							data = person;
						}
					});
				}
				if (functionType == "Edit") {
					deletePersonButton.show();
					peopleForm.find('#superuser-container').show();
					$.each(app.plugins.PeopleViewer.peopleData, function(index, person) {
						
						if (person.USERNAME == selectedUser) {
							data = person;
						}
					});
				}
				
				var currentConcurrencyControlNumber = data.CONCURRENCY_CONTROL_NUMBER // Retrieve the current value 
				// Set the form values based on the selected user
				var timeeStamp = app.plugins.PeopleViewer.getCurrentTimestamp();
				const base64String = "api//peopleportal/person/"+data.PERSON_ID+"/image?v="+timeeStamp;
				var newImg = $('<img id="imagePreview" src="' + base64String + '" alt="Contact Image"></img>');
				peopleForm.find('#fName').val(data.FNAME);
				peopleForm.find('#lName').val(data.LNAME);
				peopleForm.find('#IDIR').val(data.USERNAME)
				peopleForm.find('#pronouns').val(data.PRONOUNS);
				peopleForm.find('#email').val(data.EMAIL);
				peopleForm.find('#Title').val(data.JOB_TITLE);
				peopleForm.find('#workunit').val(app.plugins.PeopleViewer.getPersonWorkunit(data.WORKUNIT_ID));
				peopleForm.find('#location').val(data.LOCATION);
				var officeName = app.plugins.PeopleViewer.getPersonOffice(data.OFFICE_ID);
				var officeSelect = peopleForm.find('#office');
				// Set the selected option based on the office name
				officeSelect.find('option').each(function() {
					if ($(this).text() === officeName) {
						$(this).prop('selected', true);
					}
				});
				if(data.PSA_START_DATE!=null){
					peopleForm.find('#publicservicedate').val(new Date(data.PSA_START_DATE.date).toISOString().split('T')[0]);
				}
				if(data.IMB_START_DATE!=null){
					peopleForm.find('#IMBdate').val(new Date(data.IMB_START_DATE.date).toISOString().split('T')[0]);
				}

				//if SuperUser, toggle superuser toggle on
				if(data.IS_SUPERUSER >0){
					peopleForm.find('#isSuperuser').prop('checked', true);
				}

				peopleForm.find('#imagePreview').replaceWith(newImg);
				//peopleForm.find('#skillsList').hide();
	
				// Ajax Call to get a list of answers by user
				$.ajax({
					type: "GET",
					url: "api/peopleportal/answers?filter=PERSON_ID=" + data.PERSON_ID,
					dataType: "json",
					xhrFields: { withCredentials: true }
				})
				.done(function(data) {
					if (data.length > 0) {
						$.each(data, function(index, entry) {
							var aboutmeEntry = entry.QUESTION;
							var aboutmeAnswer = entry.ANSWER;
							var count = $('#aboutme-container .aboutme').length;
							var removeDivCountID = count + 1;
							$(peopleForm.find('#aboutme-container')).append(
								'<div class="aboutme" id="aboutme-' + removeDivCountID + '">\
									<button type="button" id="remove-aboutme" divlink="aboutme-' + removeDivCountID + '" class="btn-close" aria-label="Close"></button>\
									<div id="aboutme-entry" answer-id ='+entry.ANSWER_ID+'>' + aboutmeEntry + '</div>\
									<div id="answerBox" class="answer-box">\
										<label for="answerInput-label" class="form-label">Your Answer</label>\
										<textarea class="form-control" id="answerInput-' + removeDivCountID + '" rows="3">' + aboutmeAnswer + '</textarea>\
									</div>\
								</div>'
							);
						});
					}
				})
				.fail(function(jqxhr, settings, exception) {
					var error = jqxhr.responseText;
					logger("ERROR", error);
					showModalDialog("ERROR", error);
				});
	
				// Add skills if available
				var skillList = app.plugins.PeopleViewer.getSkillList(data.PERSON_ID);
				if (skillList.length > 0) {
					peopleForm.find('#skillsList').show();
					$.each(skillList, function(index, skill) {
						peopleForm.find('#skillsList').append('<li>' + skill + '<span class="remove-skill"> x</span></li>');
					});
				
					// Use event delegation to handle click events on dynamically added .remove-skill elements
					peopleForm.find('#skillsList').on('click', '.remove-skill', function() {
						$(this).parent().remove();
						var skillName = $(this).parent().text().replace(' x', '').trim();
						let index = skillList.indexOf(skillName);
						if (index !== -1) {
							skillList.splice(index, 1);
						}
					});
				}
			}
	
			if (functionType == "Create") {
				var formTitle = "Create New Staff";
				peopleForm.find('#delete-person-button').hide();
				peopleForm.find('#save-person-button').hide();
			}
	
			var skills = [];
			$.each(app.plugins.PeopleViewer.skillList, function(index, skill) {
				skills.push(skill.SKILL);
			});
	
			function createSuggestionItem(skill) {
				return $("<div>")
					.addClass("dropdown-item")
					.text(skill)
					.on("click", function() {
						if(!skillList.includes(skill)){
							skillList.push(skill)
							peopleForm.find('#skillsList').append('<li>' + skill + '<span class="remove-skill"> x</span></li>');
							$skillInput.val(''); // Clear the input field
							$suggestions.hide();


						}else{
							showModalDialog("ERROR", "Duplicate skill found.");
							
						}
						
					});
			}
	
			function updateSuggestions(query) {
				$suggestions.empty();
				peopleForm.find('#addskillbutton').hide();
				if (query) {
					const filteredSkills = skills.filter(skill => skill.toLowerCase().includes(query.toLowerCase()));
					if (filteredSkills.length > 0) {
						$suggestions.show();
						filteredSkills.forEach(skill => {
							const $item = createSuggestionItem(skill);
							$suggestions.append($item);
						});
					} else {
						peopleForm.find('#addskillbutton').show();
						$suggestions.hide();
					}
				} else {
					$suggestions.hide();
				}
			}
	
			$skillInput.on("input", function() {
				const query = $(this).val();
				updateSuggestions(query);
			});
	
			addAboutMe.click(function() {
				var count = $('#aboutme-container .aboutme').length;
				var removeDivCountID = count + 1;
				var aboutMeEntry = peopleForm.find('#aboutme');
				var aboutMeVal = aboutMeEntry.val();
				if (aboutMeVal.length > 0) {
					$(peopleForm.find('#aboutme-container')).append(
						'<div class="aboutme" id="aboutme-' + removeDivCountID + '">\
							<button type="button" id="remove-aboutme" divlink="aboutme-' + removeDivCountID + '" class="btn-close" aria-label="Close"></button>\
							<div id="aboutme-entry">' + aboutMeVal + '</div>\
							<div id="answerBox" class="answer-box">\
								<label for="answerInput-label" class="form-label">Your Answer</label>\
								<textarea class="form-control" id="answerInput-' + removeDivCountID + '" rows="3"></textarea>\
							</div>\
						</div>'
					)
				}
				
			});
			//Remove div when remove button is clicked
			$(document).on('click', '#remove-aboutme', function() {
				const divLink = $(this).attr('divlink'); // Get the div ID from the button attribute
				$('#' + divLink).remove(); // Select and remove the div by its ID
			});
	
			addSkillButton.click(function() {
				peopleForm.find('#skillsList').show();
				var skillInput = peopleForm.find('#skillInput');
				var skillValue = skillInput.val();
				if (skillValue) {
					var skillObject = { "SKILL": skillValue, "CONCURRENCY_CONTROL_NUMBER": 1 };
					app.plugins.PeopleViewer.createNewSkill(skillObject);
					$('#skillsList').append('<li>' + skillValue + '<span class="remove-skill"> x</span></li>');
					$('#skillInput').val('');
				}
			});
	
			takeScreenShotbutton.click(function() {
				app.plugins.PeopleViewer.takeWebcamCapture();
			});
	
			uploadImage.click(function() {
				app.plugins.PeopleViewer.uploadImageFile();
			});
	
			let timeout;
			$(addCityForm).on("keyup", function() {
				clearTimeout(timeout);
				timeout = setTimeout(function() {
					var value = addCityForm.val();
					var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];
					$.ajax({
						url: "https://geocoder.api.gov.bc.ca/addresses.json",
						data: {
							minScore: 50,
							maxResults: 5,
							echo: 'false',
							brief: true,
							autoComplete: true,
							outputSRS: outputSRS,
							addressString: value,
							apikey: "6097f62f6a8144edae53c59fc7c12351"
						}
					})
					.done(function(data) {
						var suggestions = peopleForm.find('#city-suggestions');
						suggestions.on('click', '.suggestion-item', function() {
							let selectedPlace = $(this).data('place');
							$('#location').val(selectedPlace);
							$('#city-suggestions').hide();
						});
						suggestions.empty().show();
						$.each(data.features, function(index, feature) {
							if (feature.properties.matchPrecision == "LOCALITY") {
								suggestions.append(`<li class="list-group-item suggestion-item" data-place="${feature.properties.fullAddress}">${feature.properties.fullAddress}</li>`);
							}
						});
					});
				}, 800);
			});
			// creates person to database
			createNewPersonButton.click(function() {
				convertImageToBase64(createPersonObject);
				
			});
			// Saves person to database
			savePersonButton.click(function() {
				//Check to see if profile has at least 1 about me
				var aboutMeCount = getAboutMeObjectList()
				if(aboutMeCount.length>0){
					convertImageToBase64(function(imageObject) {
						savePersonObject(imageObject);
						// Close the modal dialog after saving
						$('.bootbox-close-button').click();
					});

				}else{
					showModalDialog("ERROR", "Please answer at least one of the About Me question.");
				}
				
			});
			// Deletes person from database
			deletePersonButton.click(function() {
				
				app.plugins.PeopleViewer.deletePerson(data);
				$('.bootbox-close-button').click();
			});
	
			function convertImageToBase64(callback) {
				var img = document.getElementById('imagePreview');
				var xhr = new XMLHttpRequest();
				xhr.onload = function() {
					var reader = new FileReader();
					reader.onloadend = function() {
						var base64String = reader.result.split(',')[1];
						var imageObject = { base64: base64String };
						callback(imageObject);
					};
					reader.readAsDataURL(xhr.response);
				};
				xhr.open('GET', img.src);
				xhr.responseType = 'blob';
				xhr.send();
			}
	
			function getSkills() {
				var skillInput = peopleForm.find('#skillsList');
				return skillInput.find('li').map(function() {
					return $(this).clone().children('.remove-skill').remove().end().text().trim();
				}).get();
			}
	
			function getAboutMeObjectList() {
				var aboutMeObjectList = [];
				var aboutMeContainer = peopleForm.find('.aboutme');
				$(aboutMeContainer).each(function() {
					const entryText = $(this).find('#aboutme-entry').text().trim();
					const answerText = $(this).find('textarea').val().trim();
					const answerId = $(this).find('#aboutme-entry').attr('answer-id');
					aboutMeObjectList.push({ "QUESTION": entryText, "ANSWER": answerText, "ANSWER_ID":answerId});
				});
				return aboutMeObjectList;
			}
			
			function createPersonObject(imageObject) {
				var imbDate = peopleForm.find('#IMBdate').val();
				if (peopleForm.find('#IMBdate').val() === "") {
					imbDate = null;
				}
				var psaDate = peopleForm.find('#publicservicedate').val();
				if (peopleForm.find('#publicservicedate').val() === "") {
					psaDate = null;
				}
				var superUser = 0;
				if(peopleForm.find('#isSuperuser').is(":checked")){
					superUser = 1;
				}

				var personObject = {
					"USERNAME": peopleForm.find('#IDIR').val(),
					"FNAME": peopleForm.find('#fName').val(),
					"LNAME": peopleForm.find('#lName').val(),
					"PRONOUNS": peopleForm.find('#pronouns').val(),
					"EMAIL": peopleForm.find('#email').val(),
					"JOB_TITLE": peopleForm.find('#Title').val(),
					"ABOUT_ME": getAboutMeObjectList(),
					"WORKUNIT_ID": app.plugins.PeopleViewer.getWorkUnitID(peopleForm.find('#workunit').val()),
					"SKILL_IDS": app.plugins.PeopleViewer.getskillIds(getSkills()),
					"LOCATION": peopleForm.find('#location').val(),
					"OFFICE_ID": app.plugins.PeopleViewer.getofficeID(peopleForm.find('#office').val()),
					"PSA_START_DATE": psaDate,
					"IMB_START_DATE": imbDate,
					"USER_DIRECTORY": "IDIR",
					"IS_SUPERUSER": superUser,
					"CONCURRENCY_CONTROL_NUMBER": 1,
					"PERSON_IMAGE": "data:image/png;base64,"+imageObject.base64
					};
				app.plugins.PeopleViewer.createNewPerson(personObject);
				$('.bootbox-close-button').click();
				//app.plugins.MultiFloatingWindow.close("create-new-staff")
			}
			

			function savePersonObject(imageObject) {
				currentConcurrencyControlNumber++;
				var superUser = 0;
				if(peopleForm.find('#isSuperuser').is(":checked")){
					superUser = 1;
				}
				var imbDate = peopleForm.find('#IMBdate').val();
				if (peopleForm.find('#IMBdate').val() === "") {
					imbDate = null;
				}
				var psaDate = peopleForm.find('#publicservicedate').val();
				if (peopleForm.find('#publicservicedate').val() === "") {
					psaDate = null;
				}
				var personObject = {
					"PERSON_ID": data.PERSON_ID,
					"USERNAME": peopleForm.find('#IDIR').val(),
					"FNAME": peopleForm.find('#fName').val(),
					"LNAME": peopleForm.find('#lName').val(),
					"PRONOUNS": peopleForm.find('#pronouns').val(),
					"EMAIL": peopleForm.find('#email').val(),
					"JOB_TITLE": peopleForm.find('#Title').val(),
					"ABOUT_ME": getAboutMeObjectList(),
					"WORKUNIT_ID": app.plugins.PeopleViewer.getWorkUnitID(peopleForm.find('#workunit').val()),
					"SKILL_IDS": app.plugins.PeopleViewer.getskillIds(getSkills()),
					"LOCATION": peopleForm.find('#location').val(),
					"OFFICE_ID": app.plugins.PeopleViewer.getofficeID(peopleForm.find('#office').val()),
					"PSA_START_DATE": psaDate,
					"IMB_START_DATE": imbDate,
					"USER_DIRECTORY": "IDIR",
					"IS_SUPERUSER": superUser,
					"CONCURRENCY_CONTROL_NUMBER": currentConcurrencyControlNumber, // Add the incremented value
					"PERSON_IMAGE": "data:image/png;base64,"+imageObject.base64
					};
				app.plugins.PeopleViewer.updatePerson(personObject,data.PERSON_ID);
				
				



			}
			showModalDialog(formTitle, peopleForm,'xl');
		});
	}

	/**
	* Function: openStaffManager
	* @param (string) 
	* @returns () nothing
	* Function that opens the staff manager multiwindow
	*/
	openStaffManager(){
		var staffManager = $("<div id='staffManagerContainer'></div>");
		var selectedUser
		//Append filter bar to staff manager
		var filterContainer = $("<div class='input-group input-group-sm mb-2'></div>");
		var filterInput = $("<input id='staffManager-user-filter-input' type='text' class='form-control' placeholder='Filter'></input>")
		let timeout;
			$(filterInput).on("keyup",function() {
				clearTimeout(timeout);
				timeout = setTimeout(function() {
					var value = $(filterInput).val().toLowerCase();
					if(value.length >0){
						var nameToMatch = value;
						// Loop through the options in the select element
   						 $('#staff-matching-users option').each(function() {
       					 var optionText = $(this).text().toLowerCase(); // Get the text of the option
						 // If the text does not contain the name to match, hide the option
						 if (optionText.indexOf(nameToMatch) === -1) {
							$(this).hide(); // Hide the option
						} else {
							$(this).show(); // Show matching options
						}
						})
					}else{
						//if no value, show all
						$('#staff-matching-users option').each(function() {
							$(this).show()
						})
					}
				},300);
			});

		var filterClose = $("<button id='staffManager-reset-user-filter-btn' class='btn btn-secondary' type='button' title='Reset'><span class='oi oi-x'></span></button>")
		filterContainer.append(filterInput)
		filterContainer.append(filterClose)
		staffManager.append(filterContainer)
		//Append filter bar to staff manager
		var formInputContainer = $("<div class='input-group input-group-sm'</div>");
		var formInput = $("<select id='staff-matching-users' class='form-select form-select-sm' size='10'></select>");
		var data  = this.peopleData;
		formInputContainer.append(formInput)
		staffManager.append(formInputContainer)
		//add create and edit buttonsButtons
		var buttonContainer = $("<div class='mt-2 mb-0 text-center'</div>");
		var editButton = $("<button id='staff-edit-user-button' class='btn btn-sm btn-secondary col-5' type='button' disabled=''>Edit</button>");
		var createButton = $("<button id='staff-create-user-button' class='btn btn-sm btn-success col-5' type='button'>Create</button>");
		var clearfilter = staffManager.find('#staffManager-reset-user-filter-btn');
		var filterInput = staffManager.find('#staffManager-user-filter-input');
		clearfilter.click(function() {
			filterInput.val(null)
			var value = $(filterInput).val().toLowerCase();
					if(value.length >0){
						var nameToMatch = value;
						// Loop through the options in the select element
   						 $('#staff-matching-users option').each(function() {
       					 var optionText = $(this).text().toLowerCase(); // Get the text of the option
						 // If the text does not contain the name to match, hide the option
						 if (optionText.indexOf(nameToMatch) === -1) {
							$(this).hide(); // Hide the option
						} else {
							$(this).show(); // Show matching options
						}
						})
					}else{
						//if no value, show all
						$('#staff-matching-users option').each(function() {
							$(this).show()
						})
					}
		})
		createButton.on("click", function(){
			app.plugins.PeopleViewer.editCreateProfile("Create",selectedUser)
			
		})
		editButton.on("click", function(){
			app.plugins.PeopleViewer.editCreateProfile("Edit",selectedUser)
			//app.plugins.PeopleViewer.openStaffEditor(selectedUser)

		})
		
		buttonContainer.append(editButton)
		buttonContainer.append(createButton)
		staffManager.append(buttonContainer)
		
		
		//Ajax Call to get a list of people
		$.each(this.peopleData, function (index, people) {
			var name = people.FNAME+" "+people.LNAME;
			var id = people.USERNAME;
			
			var staffEntry = $("<option value='"+id+"' title='"+name+"'>"+name+"</option>")
			staffEntry.on("click", function(){
				selectedUser = id
				editButton.prop("disabled", false);
			})
			formInput.append(staffEntry)
		})
		app.plugins.MultiFloatingWindow.open("IMB-staff-manager", "IMB Staff Manager", staffManager, 350, null, "right");
	}

	/**
	* Function: buildLocations
	* @param (string) 
	* @returns () nothing
	* Function builds the location layers for offices and cities
	*/
	buildLocations(){
		//reset card list
		//$("#person-list").empty();

		//Clear location data from map
		app.plugins.PeopleViewer.cityLayer.getSource().clear();
		app.plugins.PeopleViewer.officeLayer.getSource().clear();


		var cityList = [];
		var officeLIst = []
		//Build unique list of Cities where people live
		$.each(this.peopleData, function (index, people) {
			if (people.LOCATION && people.LOCATION.length > 0) {
				if (!cityList.includes(people.LOCATION)) {
					cityList.push(people.LOCATION);
				}
			}
			
		})
		
		var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];
		// Define the parameters
		
		//Build city locations data
		$.each(cityList, function (index, city) {
		// Query the DataBC GeoCoder
		$.ajax({
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			data: {
			minScore: 50,
			maxResults: 1,
			echo: 'false',
			brief: true,
			autoComplete: true,
			outputSRS: outputSRS,
			addressString: city,
			apikey: "6097f62f6a8144edae53c59fc7c12351"
			}
		})
		// Handle a successful result
		.done(function(data) {
			var cityFeature = new ol.Feature({
				geometry: new ol.geom.Point(data.features[0].geometry.coordinates), // Set the point coordinates
				});
			//var cityFeature3857 = transformFeature(cityFeature, "EPSG:3005", app.map.getView().getProjection());
			var properties = {};
			properties["City"] = city;
			cityFeature.setProperties(properties);
			app.plugins.PeopleViewer.cityLayer.getSource().addFeature(cityFeature); 
		})
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			}); 	
		})

	
		//Build office locations data
		$.each(this.officeLocationList, function (index, office) {
			var address = office.ADDRESS
			// Query the DataBC GeoCoder
			$.ajax({
				url: "https://geocoder.api.gov.bc.ca/addresses.json",
				data: {
				minScore: 50,
				maxResults: 1,
				echo: 'false',
				brief: true,
				autoComplete: true,
				outputSRS: outputSRS,
				addressString: address,
				apikey: "6097f62f6a8144edae53c59fc7c12351"
				}
			})
			// Handle a successful result
			.done(function(data) {
				var officeFeature = new ol.Feature({
					geometry: new ol.geom.Point(data.features[0].geometry.coordinates), // Set the point coordinates
					});
				//var cityFeature3857 = transformFeature(cityFeature, "EPSG:3005", app.map.getView().getProjection());
				var properties = {};
				properties["Office"] = office.OFFICE;
				officeFeature.setProperties(properties);
				app.plugins.PeopleViewer.officeLayer.getSource().addFeature(officeFeature); 
			})
			// Handle a failure
			.fail(function(jqxhr, settings, exception) {
				}); 	
			})
	}

	/**
	* Function: buildChartByCity
	* @param (string) 
	* @returns () nothing
	* Function that builds the chart by city and opens a multifloating window
	*/
	buildChartByCity(data){
		// Summarize by City
		//var data = app.plugins.PeopleViewer.peopleData;
		const summary = {};
		for (const key in data) {
			const person = data[key];
			const location = person.LOCATION;
			if(location != null){
				if(location.length>0){
					if (!summary[location]) {
						summary[location] = 0;
					}
					summary[location] += 1;
				}
			}
		}
		// Sort the summary by location (alphabetically)
		const sortedSummary = Object.keys(summary)
		.sort()
		.reduce((obj, key) => {
		  obj[key] = summary[key];
		  return obj;
		}, {});

		// Show the chart
		var labels = [];
		var chartData = [];
		
		//Loop through the summarized data and build labels and data for chart
		$.each(sortedSummary, function(index, sumData) {
			labels.push(index)
			chartData.push(sumData)
			
		})	
		app.plugins.ChartPlugin.open("IMB Staff Locations by City", labels, chartData, null, 600, 600, "right");
	}

	/**
	* Function: buildChartByWorkUnit
	* @param (string) 
	* @returns () nothing
	* Function that builds the chart by work unit and opens a multifloating window
	*/
	buildChartByWorkUnit(data){
		// Summarize by City
		const summary = {};
		for (const key in data) {

			const person = data[key];
			
			if(person.WORKUNIT_ID != null){
				const workUnit = app.plugins.PeopleViewer.getPersonWorkunit(person.WORKUNIT_ID);
				if(workUnit.length>0){
					if (!summary[workUnit]) {
						summary[workUnit] = 0;
					}
					summary[workUnit] += 1;
				}
			}
		}
		// Sort the summary by workUnit (alphabetically)
		const sortedSummary = Object.keys(summary)
		.sort()
		.reduce((obj, key) => {
		  obj[key] = summary[key];
		  return obj;
		}, {});

		// Show the chart
		var labels = [];
		var chartData = [];
		
		//Loop through the summarized data and build labels and data for chart
		$.each(sortedSummary, function(index, sumData) {
			labels.push(index)
			chartData.push(sumData)
		})	
		app.plugins.ChartPlugin.open("IMB Staff by Work Unit", labels, chartData, null, 600, 600, "right");
	}

	/**
	* Function: buildChartByOffice
	* @param (string) 
	* @returns () nothing
	* Function that builds the chart by office and opens a multifloating window
	*/
	buildChartByOffice(data){
		// Summarize by City
		//var data = app.plugins.PeopleViewer.peopleData;
		const summary = {};
		for (const key in data) {
			
			
			const person = data[key];
			if(person.OFFICE_ID != null){
				const office = app.plugins.PeopleViewer.getPersonOffice(person.OFFICE_ID)
				if(office.length>0){
					if (!summary[office]) {
						summary[office] = 0;
					}
					summary[office] += 1;
				}
			}
		}
		// Sort the summary by location (alphabetically)
		const sortedSummary = Object.keys(summary)
		.sort()
		.reduce((obj, key) => {
		  obj[key] = summary[key];
		  return obj;
		}, {});

		// Show the chart
		var labels = [];
		var chartData = [];
		
		//Loop through the summarized data and build labels and data for chart
		$.each(sortedSummary, function(index, sumData) {
			labels.push(index)
			chartData.push(sumData)
		})	
		app.plugins.ChartPlugin.open("IMB Staff Locations by Office", labels, chartData, null, 600, 600, "right");
	}

	/**
	* Function: buildChartByIMBStart
	* @param (string) 
	* @returns () nothing
	* Function that builds the chart by summarizing IMB start Dates
	*/
	buildChartByIMBStart(data){
		// Helper function to calculate the difference in years
		function calculateYearDifference(dateString) {
			const currentDate = new Date();
			const pastDate = new Date(dateString);
			const diffTime = currentDate - pastDate;
			return diffTime / (1000 * 60 * 60 * 24 * 365); // Convert from milliseconds to years
		}
		// Function to categorize based on year ranges
		function categorizeByYears(years) {
			if (years < 1) return "Less than a year";
			if (years >= 1 && years < 5) return "1-5 years";
			if (years >= 5 && years < 10) return "5-10 years";
			if (years >= 10 && years < 15) return "10-15 years";
			if (years >= 15 && years < 20) return "15-20 years";
			if (years >= 20 && years < 25) return "20-25 years";
			if (years >= 25 && years < 30) return "25-30 years";
			return "Greater than 30 years";
		}
		// Function to summarize the data by imbdate categories
		
		const summary = {
			"Less than a year": [],
			"1-5 years": [],
			"5-10 years": [],
			"10-15 years": [],
			"15-20 years": [],
			"20-25 years": [],
			"25-30 years": [],
			"Greater than 30 years": []
		};
		
		//var data = app.plugins.PeopleViewer.peopleData;
		
		for (const key in data) {
			const person = data[key];
			if(person.IMB_START_DATE != null){
				const years = calculateYearDifference(person.IMB_START_DATE.date);
				
				if(!isNaN(years)){
					const category = categorizeByYears(years);
					summary[category].push(person.fullname);
				}
			}
		}

		// Show the chart
		var labels = [];
		var chartData = [];
		
		//Loop through the summarized data and build labels and data for chart
		$.each(summary, function(index, sumData) {
			labels.push(index)
			chartData.push(sumData.length)
		})
	app.plugins.ChartPlugin.open("IMB Staff By Start Date in IMB", labels, chartData, null, 600, 600, "right");
	}

	/**
	* Function: filterCardsByFilter
	* @param (string) 
	* @returns () nothing
	* Function that filters profile cards by the filter text entry
	*/
	filterCardsByFilter(value){
		const searchString = value;
		// Select the container holding the cards
		const personContainer = document.getElementById('person-list');

		// Select all cards within the container
		const cards = personContainer.querySelectorAll('.card');

		// Initialize an array to hold the extracted information
		const extractedData = [];

		// Loop through each card and extract attributes
		cards.forEach((card) => {
			var trueValue = 0
			const person = {
				name: card.querySelector('.card-body').innerText.trim(),
				city: card.getAttribute('city'),
				skills: card.getAttribute('skills'),
				workunit: card.getAttribute('workunit'),
				title: card.getAttribute('title'),
				office: card.getAttribute('office')
			};

			// Loop through each key-value pair in the object
			for (const key in person) {
				if (person.hasOwnProperty(key)) {
					const value = person[key].toString().toLowerCase(); // Convert the value to a string and lowercase it
					if (value.includes(searchString)) {
						trueValue+=1;
					}
				}
			}
			if(trueValue>0){
				$(card).show();
			}else{
				$(card).hide();
			}
		});
	}

	/**
	* Function: buildChartByPSAStart
	* @param (string) 
	* @returns () nothing
	* Function that builds the chart by summarizing PSA start Dates
	*/
	buildChartByPSAStart(data){
		
		
		// Helper function to calculate the difference in years
		function calculateYearDifference(dateString) {
			const currentDate = new Date();
			const pastDate = new Date(dateString);
			const diffTime = currentDate - pastDate;
			return diffTime / (1000 * 60 * 60 * 24 * 365); // Convert from milliseconds to years
		}
		// Function to categorize based on year ranges
		function categorizeByYears(years) {
			if (years < 1) return "Less than a year";
			if (years >= 1 && years < 5) return "1-5 years";
			if (years >= 5 && years < 10) return "5-10 years";
			if (years >= 10 && years < 15) return "10-15 years";
			if (years >= 15 && years < 20) return "15-20 years";
			if (years >= 20 && years < 25) return "20-25 years";
			if (years >= 25 && years < 30) return "25-30 years";
			return "Greater than 30 years";
		}
		// Function to summarize the data by imbdate categories
		
		const summary = {
			"Less than a year": [],
			"1-5 years": [],
			"5-10 years": [],
			"10-15 years": [],
			"15-20 years": [],
			"20-25 years": [],
			"25-30 years": [],
			"Greater than 30 years": []
		};
		
		//var data = app.plugins.PeopleViewer.peopleData;
		
		for (const key in data) {
			const person = data[key];
			if(person.PSA_START_DATE != null){
				const years = calculateYearDifference(person.PSA_START_DATE.date);
				if(!isNaN(years)){
					const category = categorizeByYears(years);
					summary[category].push(person.fullname);
				}
			}
			
		}

		// Show the chart
		var labels = [];
		var chartData = [];
		
		//Loop through the summarized data and build labels and data for chart
		$.each(summary, function(index, sumData) {
			labels.push(index)
			chartData.push(sumData.length)
		})

	app.plugins.ChartPlugin.open("IMB Staff By Start Date in Public Service", labels, chartData, null, 600, 600, "right");
	
	}
		
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define Callback
		var callback = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.PeopleViewer.name + ": Plugin failed to initialize");
				return;
			}

			//Change placeholder text for ubersearch
			$("#uberSearch").attr('placeholder', "Map Search");

			//Add people container to map section
			var PersonContainer = $('<div class="person-container" id="person-container"></div>');
			var personList = $('<div class="person-list" id="person-list"></div>');
			var profileOfTheDay = $('<div class="profile-of-the-day" id="profile-of-the-day"></div>');
			$(PersonContainer).append(profileOfTheDay);
			$(PersonContainer).append(personList);
			$('#content').append(PersonContainer);
			
			//hide staff manager and profile editor
			$('button.dropdown-item[data-option-name="Staff Manager"]').hide();
			
			
			//Get Current User
			$.ajax({
				type: "GET",
					//url: "/api/peopleportal/currentuser",
					url: "api/peopleportal/currentuser",
					dataType: "json",
					xhrFields: {
						withCredentials: true
					}
			})
			.done(function(data) {
				
				app.plugins.PeopleViewer.currentUser = data
				//if current user is null, hide edit profile
				if(data.length ===0){
					$('button.dropdown-item[data-option-name="Edit Profile"]').hide();

				}
				//If admin show staff manager
				if(data.IS_SUPERUSER == 1){
					$('button.dropdown-item[data-option-name="Staff Manager"]').show();
					var staffManagerButton = $('<button class="editButtons btn btn-outline-secondary btn-sm" type="button" id="staff-manager" data-option-name="Staff Manager" style=""><span class="menu-icon oi oi-people text-danger"></span>Staff Manager</button>');
					//Register staff manager button click
					$(staffManagerButton).click(function() {
						app.plugins.PeopleViewer.openStaffManager();
					})
				}
				
			})
			.fail(function(jqxhr, settings, exception) {
				var error = jqxhr.responseText;
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		
			//Get Questions
			var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.PeopleViewer.tabContent)[0]);
			$.ajax({
				type: "GET",
					url: "api/peopleportal/offices",
					dataType: "json",
					xhrFields: {
						withCredentials: true
					}
			})
			.done(function(data) {
				app.plugins.PeopleViewer.officeLocationList = data
				spinner.stop();
	
				
			})
			.fail(function(jqxhr, settings, exception) {
				var error = jqxhr.responseText;
				logger("ERROR", error);
				spinner.stop();
				showModalDialog("ERROR", error);
			});
			
			//Get workunits
			var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.PeopleViewer.tabContent)[0]);
			$.ajax({
				type: "GET",
					url: "api/peopleportal/workunits",
					dataType: "json",
					xhrFields: {
						withCredentials: true
					}
			})
			.done(function(data) {
				//Load data to workUnitList
				app.plugins.PeopleViewer.workunitsList = data

				//Load workunit to filter list
				$.each(data, function (index, workUnit) {
					var workUnitName = workUnit.WORKUNIT
					var workUnitID = workUnit.WORKUNIT_ID
					var workUnitDiv = $('<div class="form-check"><input class="form-check-input" type="checkbox" value="" id="flexCheck'+index+'"><label class="form-check-label" for="flexCheck'+index+'">'+workUnitName+'</label></div>')
					$('#pp-work-unit-filter').append(workUnitDiv)

				})


				spinner.stop();
	
				
			})
			.fail(function(jqxhr, settings, exception) {
				var error = jqxhr.responseText;
				logger("ERROR", error);
				spinner.stop();
				showModalDialog("ERROR", error);
			});
			
			// Set class variables
			app.plugins.PeopleViewer.tabNav = tabNav;
			app.plugins.PeopleViewer.tabContent = tabContent;
			
			// Register the get location from map buttons
			$(".fp-search-point .fp-get-location-from-map-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".fp-location-input");
				app.plugins.PeopleViewer.registerMapClickLocation(associatedInput);
			});
			
			// Register the category autocompletes
			$(".fp-search-point .fp-location-input").catcomplete({
				minLength: 3,
				source: app.plugins.PeopleViewer.search,
				autoFocus: true,
				select: function(event, selection) {
					app.plugins.PeopleViewer.registerSearchSelectionLocation($(this), selection.item);
				}
			});

			//Clear filter and rerun toggleContactList
			$("#pp-clear-filter").click(function () {
				app.plugins.PeopleViewer.peopleFilterList = [];
				$('#pp-filter-input').val("");
				
				//Clear Work Unit Filter Selections
				// Select all checkboxes within the "work-unit-filter" div
				var checkboxes = document.querySelectorAll('.work-unit-filter .form-check-input');
				// Loop through each checkbox and set it to unchecked
				checkboxes.forEach((checkbox) => {
				checkbox.checked = false;
				});

				//Clear Title Filter Selection
				// Select all checkboxes within the "work-unit-filter" div
				var checkboxes = document.querySelectorAll('.title-filter .form-check-input');
				// Loop through each checkbox and set it to unchecked
				checkboxes.forEach((checkbox) => {
				checkbox.checked = false;
				});

				//Clear skill selection
				// Select the div containing the buttons
				const skillFiltersDiv = document.getElementById('skillFilters');

				// Get all buttons within the div
				const buttons = skillFiltersDiv.getElementsByTagName('button');

				// Loop through the buttons
				for (let button of buttons) {
					// Check if the button has the 'active' class
					if (button.classList.contains('active')) {
						// Remove the 'active' class to deactivate it
						button.classList.remove('active');
						// Optional: You can add any additional logic here, e.g., changing button appearance
					}
				}

				const personContainer = document.getElementById('person-list');
				// Select all cards within the container
				const cards = personContainer.querySelectorAll('.card');
				// Initialize an array to hold the extracted information
				const extractedData = [];
				// Loop through each card and extract attributes
				cards.forEach((card) => {
					$(card).show()

				})
					app.plugins.PeopleViewer.filterCharts();
			})

			
			//Contacts filter, searches for key words on the variables listed
			let timeout;
			$("#pp-filter-input").on("keyup",function() {
				clearTimeout(timeout);
				timeout = setTimeout(function() {
					var value = $("#pp-filter-input").val().toLowerCase();
					app.plugins.PeopleViewer.filterCardsByFilter(value)
					app.plugins.PeopleViewer.filterCharts();
				},800);
			
			});
			

			// Register single click
			app.plugins.PeopleViewer.singleClick = app.map.on("click", function(event) {
				app.plugins.PeopleViewer.filterCards(event);
				app.plugins.PeopleViewer.filterCharts();
			});

			// Register filter click
			$('.filter-menu .form-check-input').on('change', function() {
				app.plugins.PeopleViewer.filterCards(null)
				app.plugins.PeopleViewer.filterCharts();
				
			});

			//Register chart button click
			$(".chart-button").click(function() {
				var data = app.plugins.PeopleViewer.peopleData
				if(app.plugins.PeopleViewer.peopleFilterList.length>0){
					var data = []
					$.each(app.plugins.PeopleViewer.peopleData, function (index, people) {
						if (app.plugins.PeopleViewer.peopleFilterList.includes(people.USERNAME)) {
							data.push(people)
						}
					})
				}

				var type = $(this).attr("chartType");
				if ( $("#chart-canvas-1").is(":visible") ) {
					$("#chart-canvas-1").remove();
			
				}
				//If chart type is staff by city, run that chart function
				if (type =="staff-by-city"){app.plugins.PeopleViewer.buildChartByCity(data);}
				if (type =="staff-by-office"){app.plugins.PeopleViewer.buildChartByOffice(data);}
				if (type =="staff-by-MOTI-date"){app.plugins.PeopleViewer.buildChartByIMBStart(data);}
				if (type =="staff-by-PSA-date"){app.plugins.PeopleViewer.buildChartByPSAStart(data);}
				if (type =="staff-by-WorkUnit"){app.plugins.PeopleViewer.buildChartByWorkUnit(data);}
			})
			
			//Run css change when window is resized
			$(window).on("resize",  function() {
				app.plugins.PeopleViewer.setCSSOnResize()
			})
			
			//Run initial check when page loads
			app.plugins.PeopleViewer.setCSSOnResize()


			//Add work unit filters


			




			// Register the geolocator buttons
			$(".fp-search-point .fp-get-geolocation-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".fp-location-input");
				app.plugins.PeopleViewer.registerDeviceLocation(associatedInput);
				
			});

			// Set the default search distance as per the application configuration
			$("#fp-search-distance-input").val(app.plugins.PeopleViewer.pcfg.defaultSearchRadiusKm);
			
			// Enable/disable the search distance input as per the application configuration
			$("#fp-search-distance-input").prop("disabled", !app.plugins.PeopleViewer.pcfg.searchRadiusEditable);
			
			// Constrain the search distance input to numbers within a range
			$("#fp-search-distance-input").on("input", function() {
				this.value = this.value.replace(/[^0-9.]/g,'').replace(/(\..*)\./g, '$1');
				app.plugins.PeopleViewer.registerSearchRadius();
			});


			
			// Register search button
			$("#fp-overlay-search-btn").click(function(){
				app.plugins.PeopleViewer.findFeatures();
			});

			//Get people data from API
			app.plugins.PeopleViewer.getData();

			// Log success
			logger("INFO", app.plugins.PeopleViewer.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}