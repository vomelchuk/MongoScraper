$(document).ready(function() {


	$("#scrapeStories").on("click", getStories);
	$(".save").on("click", saveStory);

	function saveStory(){

		var storyId =$(this).attr("id");
		$("#story-"+storyId).hide();

		$.ajax("/saveStory", {
			type: "POST",
			data: {id: storyId},
			success: setTimeout(function(){
				location.reload();
			}, 1000)
		});

	}

	function getStories() {

		//var count = $(".panel-default").length;
		//console.log('stories:', count);
		// $.get("api/scrape").then(function(data){
		// 	console.log(data);
		// 	setTimeout(function(){
		// 		location.reload();
		// 	}, 1000)
		// });
		$.ajax("api/scrape", {
			type: "GET",
			//data: { "count": count},
			success: setTimeout(function(){
				location.reload();
			}, 1000)
		})

	}


});
