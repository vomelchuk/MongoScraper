var express = require("express");
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require("mongoose");

var router = express.Router();

var db = require("../models");
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/storiesPopulator", {
  useMongoClient: true
});


// Opening site
router.get("/", function(req, res){

	db.Story.find(
		{"saved": false},
		function(err, dbStories){
			res.render("index", {stories: dbStories});
	});

});

// Saved stories
router.get("/savedStories", function(req, res){
	
	db.Story.find({"saved": true}).exec(function(err, dbStories){
		res.render("saved", {stories: dbStories});
	});
	
});

// Saving story
router.post("/saveStory", function(req, res){
	
	db.Story.findOneAndUpdate(
		{"_id": req.body.id},
		{"saved": true},
		function(err, dbStory){
			res.status(200).send("Story saved");
			console.log("Scraped story was saved to DB.");
		}
	);

	
});

// Deleting story
router.post("/deleteStory", function(req, res){
	
	db.Story.findById({_id: req.body.id})
		.then(function(story){
			db.Note.remove({_id: {$in: story.note}}, function(err, dbStory){
				if(!err) {};
			});
		}).then(function(){
			db.Story.remove({_id: req.body.id}, function(err, dbStory){
				if(!err) console.log("Story was deleted from DB /_id =",req.body.id,"/");
			});
		});

});

// Deleting note
router.post("/deleteNote", function(req,res){
	//console.log("[story, note]->",req.body.storyId,',',req.body.noteId);
	db.Note.remove(
		{_id: req.body.noteId}, 
		function(err, data){
			if(!err) {};
		}).then(function(){
			db.Story.update(
				{_id: req.body.storyId}, 
				{$pull: 
					{"note": req.body.noteId}
				}, 
				(err, story) => {
					if (err) {
						res.status(400).json(err);
					}
					res.status(200);
					console.log("Note was deleted");
				}
			)

		});

});

// Notes
router.put('/api/notes', function(req, res){
	db.Story.findById({ _id: req.body.id })
		.populate("note")
		.then(function(dbStory) {
			res.json(dbStory);
		})
		.catch(function(err) {
			res.json(err);

		});
}); 

//Save note 
router.post("/api/saveNote", function(req, res){

	db.Note
		.create(req.body)
		.then(function(dbNote) {
			//return db.Story.findById({ _id: req.body.id }).populate("note").save(dbNote);
			return db.Story.update({ _id: req.body.id }, {$push: {"note": dbNote}}, function(err, i){
				if (err) throw err;
			});
		})
		.then(function(dbStory) {
			res.json(dbStory);
			console.log("Note was saved to story");
		})
		.catch(function(err) {
			res.json(err);
		});	

});


// Scraping stories
router.get("/api/scrape", function(req, res) {

	var srapedStoriesCount = 0;

	request('http://www.foxnews.com/world.html', function (error, response, html) {
		if (!error && response.statusCode == 200) {

		  	var $ = cheerio.load(html);
		  	
			$('div.content.article-list').children("article").each(function(i, element){

				var title0 = $(this).children("div.info").children("header").children("h2.title").children("a").text().trim();
				var summary0 = $(this).children("div.info").children("div.content").children("p.dek").children("a").text().trim();
				var link0 = $(this).children("div.info").children("header").children("h2.title").children("a").attr("href");
				
				if( String(link0).startsWith("/",0) ) {
					link0 = 'http://www.foxnews.com/' + link0;
				}

				if (title0 == undefined || summary0 == undefined || link0 == undefined) return;

				var isSaved = false;
				db.Story.findOne({link: link0}).exec(function(err, story) {
					if (story == null) isSaved = true;
					//console.log("story is finding", i);
				}).then(function(isSaved){
					if(!isSaved){

						var story = new db.Story({
							title: title0,
							summary: summary0,
							link: link0, 
							saved: false
						});

						story.save(function(err, createdStory){
							if (err) {
								console.log(err);
							} else{
								//console.log("Story was scraped", i);	
							}
						});
						++srapedStoriesCount;
						//console.log("Story is saved", i);
					}
				});
				
			});
			console.log("Handling stories end");
		}
		console.log("Requeset end", srapedStoriesCount);
	});
	//res.json(req.body);

	console.log("router end",srapedStoriesCount);
});


// export module
module.exports = router;