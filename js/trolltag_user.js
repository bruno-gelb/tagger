// ==UserScript==
// @name			Troll Tag
// @version			0.1
// @namespace		
// @description		Allows to tag usernames on social networks (currently VK.com) with text/color markers
// @license			
// @downloadURL		
// @updateURL		
// @include			http*://vk.com/*
// @include			http*://*.vk.com/*
// @match			*://*.vk.com/*
// @require			https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.min.js
// @require         https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require			https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @resource		https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @compatible		firefox
// ==/UserScript==

// Incompatibility with Chrome/Opera/Safari due to usage of menuitem
// TODO: add user input: working menus and dialog box for a new userTag
// TODO: make sure we really need jQueryUI + theme

console.log("Troll Tag userscript has started");

// [1] Оборачиваем скрипт в замыкание, для кроссбраузерности (opera, ie)
(function (window, undefined)	// [2] нормализуем window
{
    var w;
    if (typeof unsafeWindow != undefined) {
        w = unsafeWindow;
    } else {
        w = window;
    }

    // [3] не запускаем скрипт во фреймах
    // без этого условия скрипт будет запускаться несколько раз на странице с фреймами
    if (w.self != w.top) {
        return;
    }

    console.log("Window is now normalized and deframed");

    // Init database
//	localforage.config({
//    	driver		: [localforage.INDEXEDDB,
//             		   localforage.LOCALSTORAGE],
//		description : 'Troll Tag userscript local database'
//	});

    // Check if database is ready
//	localforage.ready().then(function() {
    // This code runs once localforage
    // has fully initialized the selected driver.
//		console.log(localforage.driver()); // LocalStorage
//	}).catch(function (e) {
//		console.log(e); // `No available storage method found.`
    // One of the cases that `ready()` rejects,
    // is when no usable storage driver is found
//	});

//	var localforage = localforage.createInstance({
//  		name: "nameHere"
//	});

    ///////////////////
    // UserTag class //
    ///////////////////

    class UserTag {
        // Example calls: myTag1("NewTag1"); myTag2("NewTag2", "", ""); myTag3("NewTag3", "/id00000", "<sup>troll</sup>", "green")
        constructor(tagname, id, appendage, color) {
            this.tagname = tagname;					// string, used both as a name (for menus) and a DB key
            if ((typeof(id) === "string") && (id !== "") && (id !== "undefined")) {	// id must be a non-empty string
                this.idlist = new Set([id]);		// right-click > Tag user > New tag... (create UserTag with its first id)
            } else {
                this.idlist = new Set();			// empty Set (no ids were passed)
            }
            if (typeof appendage !== "undefined") {
                this.appendage = appendage;			// string, possibly with HTML (with <color>, <sup>, etc.)
            } else {
                this.appendage = "";
            }
            if (typeof color !== "undefined") {
                this.color = color;					// string, to recolor whole username: "green", "#007F00", ""
            } else {
                this.color = "";
            }
            return tagname;
        }

        addid(id)		// id is a string: "/idxxxxxx..."
        {
            this.idlist.add(id);
            console.log("Added new id = " + id + " to UserTag " + this.tagname);
            return id;
        }

        removeid(id)	// id is a string: "/idxxxxxx..."
        {
            if (this.idlist.delete(id)) {
                console.log("Removed id = " + id + " from UserTag " + this.tagname);
            } else {
                console.log("id = " + id + " is absent from UserTag " + this.tagname);
            }
            return id;
        }
    }
    ///////////////////

    /////////////////////
    // UserTagDB class //
    /////////////////////

    class UserTagDB {
        // Example call: db = new UserTagDB(localforage);
        constructor(localdb) {
            this.map = new Map();
            // Load data from local DB (using localForage) into this.map
//			localdb.iterate(function(value, key, iterationNumber)
//			{
            // Resulting key/value pair -- this callback will be executed for every item in the DB
//				this.map.set(key, value);	// fill this.map with entries from DB
//				console.log("Loaded DB entry with key '" + key + "' into UserTagDB.map");
//			})
//			.then(function() {
            console.log("Iteration has completed");
//			})
//			.catch(function(err) {
            // This code runs if there were any errors
//				console.log(err);
//			});
//			return this;
        }

        // Example calls: db.createTag("NewTag1"); db.createTag("NewTag2", "/id00000", "trusted", "");
        createTag(tagname, id, appendage, color) {
            let newtag = new UserTag(tagname, id, appendage, color);
            this.map.set(newtag.tagname, newtag);
            // console.log("Added UserTag " + this.map.get(newtag.tagname).tagname + " to map.set");
            // console.log(newtag.idlist.has(id));
            // console.log(this.map.get(tagname).idlist.has(id));
            // Let's try to save objects (value=newtag) with newtag.tagname as a key into localForage DB
            // Otherwise, we can try to save value=[newtag.idlist, newtag.color, new.appendage]
//			localforage.setItem(newtag.tagname, newtag).then(function()
//			{
            // Do other things once the value has been saved
//				console.log("Added new entry with key '" + newtag.tagname + "' to DB");
//			})
//			.catch(function(err) {
            // This code runs if there were any errors
//				console.log(err);
//			});
//			return newtag;
        }

        deleteTag(tagname) {
            if (this.map.delete(tagname)) {
                console.log("Entry with key '" + tagname + "' was deleted from UserTagDB.map");
            } else {
                console.log("Entry with key '" + tagname + "' was alredy absent from UserTagDB.map");
            }
//			localforage.removeItem(tagname).then(function() {
            // Run this code once the key has been removed
//				console.log("Entry with key '" + tagname + "' was deleted from DB");
//			})
//			.catch(function(err) {
            // This code runs if there were any errors
//				console.log(err);
//			});
        }

    }
    /////////////////////

    // Init database & load with data from localForage DB (if present)
//	db = new UserTagDB(localforage);
    db = new UserTagDB(0);

    // Test
    db.createTag("Possible troll", "/id688591", "<span style=\"font-style:bold;color:green\"><sup>[troll]</sup></span>", "");
    db.createTag("Trusted source", "/id210336", "trusted");

    // Compose a huge string representing menu items
    var htmlMenuItemString = "";
    for (let key of db.map.keys()) {
        htmlMenuItemString += ("<menuitem label='" + key + "' onclick='console.log(\"Clicked 'Tag user' as submenu item\");return false;'></menuitem>");
    }
    var htmlMenuString = "\
		<menu type='context' id='usertagging'> \
			<menu label='Tag user as'>" + htmlMenuItemString + "</menu> \
			<menuitem label='Untag user' onclick='console.log(\"Clicked 'Untag user'\");return false;'></menuitem> \
		</menu> \
	";

    // jQuery fuckfest^W magic
    $(function ()															// similar to $(document).ready(function()
    {
        $("body")															// start search inside body
            .find("a")														// search for links
            .filter("[class='author'],[class='im-mess-stack--lnk']")		// standard userlinks (in posts/comments) always have one of these properties
            .attr("contextmenu", "usertagging")								// to make an element use this context menu, add contextmenu="usertagging" attribute to it
            .append(htmlMenuString)											// "usertagging" matches the id attribute of the menu element
            .each(function ()												// apply the following function to search results
            {
                for (let [key, currentTag] of db.map)						// iterate over all UserTagDB entries
                {
                    console.log("Now inside outer 'for' loop, processing db.map entry '" + currentTag.idlist[0] + "'");
                    for (let id of currentTag.idlist)						// iterate over all ids associated with the UserTag
                    {
                        console.log("Now inside outer 'for' loop, processing id '" + id + "'");
                        $(this).filter("[href='" + id + "']")				// only process entries that match current id
                            .each(function ()								// add markup according to currentTag settings
                            {
                                console.log("Now inside inner 'each' function");
                                // if (currentTag.color) {};			// decide what to color first
                                $(this).append(currentTag.appendage)	// currentTag.appendage is itself a formatted string (can have <color>, <sup>, etc.)
                                    .css("color", currentTag.color);	// recolors whole username (appendage can be colored independently)
                            });
                    }
                }
            });
    });
    // Phew!

    console.log("Troll Tag userscript has stopped");

})(window);
