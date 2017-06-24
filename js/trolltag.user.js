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

console.log("[global] Troll Tag userscript has started");

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
    console.log("[window] Window is now normalized and deframed");

    /////////////////////
    // function InitDB //
    /////////////////////

    function InitDB(localforage) {
        // Init database
        localforage.config({
            description: 'Troll Tag userscript local database'
        });

        // Check if database is ready (callback)
        localforage.ready().then(function () {
            // This code runs once localforage
            // has fully initialized the selected driver.
            console.log("[window/localforage.ready] Localforage driver in use: " + localforage.driver()); // LocalStorage
        }).catch(function (e) {
            console.log(e); // `No available storage method found.`
            // One of the cases that `ready()` rejects,
            // is when no usable storage driver is found
        });
    }

    /////////////////////

    ///////////////////
    // UserTag class //
    ///////////////////

    function UserTag(tagname, id, appendage, color) {
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
        console.log("[UserTag] Created new UserTag: " + this.tagname + ", " + this.appendage + ", " + this.color);

        function addid(id)		// id is a string: "/idxxxxxx..."
        {
            this.idlist.add(id);
            console.log("Added new id = " + id + " to UserTag " + this.tagname);
            return id;
        }

        function removeid(id)	// id is a string: "/idxxxxxx..."
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

    function UserTagDB(localforage) {
        this.map = new Map();
        // Check LFDB by retrieving number of keys (callback)
        /*		localforage.length().then(function(numberOfKeys) {
         // Outputs the length of the database.
         console.log("[UserTagDB/localforage.length().then] Number of keys in LFDB: " + numberOfKeys);
         }).catch(function(err) {
         console.log(err);
         });
         */
        // Load data from local DB (using localforage) into this.map
        //console.log("[UserTagDB] Ready for DB loading");
        /*		localforage.iterate(function(value, key, iterationNumber)
         {
         // Resulting key/value pair -- this callback will be executed for every item in the DB
         this.map.set(key, value);	// fill this.map with entries from DB
         console.log("[UserTagDB/localforage.iterate] Filling this.map with entries from LFDB: " + key + ", " + value.tagname + ", " + value.appendage + ", " + value.color);
         })
         .then(function() {
         console.log("[UserTagDB/localforage.iterate().then] Iteration has completed, DB is now loaded");
         })
         .catch(function(err) {
         console.log(err);
         });
         */
        // Load data from localforage) DB into this.map (ass-through method)
        // Find the number of items in the datastore

        function loadDB(localforage) {
            localforage.length().then(function (numberOfKeys) {
                // Loop over each of the items
                for (var i = 0; i < numberOfKeys; i++) {
                    console.log("[UserTagDB/localforage.length().then] LFDB length = " + numberOfKeys);
                    console.log("[UserTagDB/localforage.length().then] iteration = " + i);
                    // Get the key
                    localforage.key(i).then(function (keyName) {
                        console.log("[UserTagDB/localforage...] iteration = " + i);
                        console.log("[UserTagDB/localforage...] key = " + keyName);
                        // Retrieve the data
                        localforage.getItem(keyName).then(db.addTagToMap(value));
                        console.log("[UserTagDB/localforage...] Added (hopefully) item " + keyName + " to db.map");
                    });
                }
            });
        }

        // Test this.map
        for (let [key, value] of this.map) {
            console.log("[UserTagDB/localforage.iterate().then] Testing this.map: " + key + ", " + value.tagname + ", " + value.appendage + ", " + value.color);
        }
        console.log("[UserTagDB] DB is now (hopefully) loaded");

        // Add tag to this.map only (not touching localforage)
        function addTagToMap(newtag) {
            this.map.set(newtag.tagname, newtag);
            console.log("[UserTagDB.addThisTagToMap] Added (hopefully) item " + newtag.tagname + " to db.map");
        }

        // Delete tag from this.map only (not touching localforage)
        function deleteTagFromMap(tagname) {
            if (this.map.delete(tagname)) {
                console.log("Entry with key '" + tagname + "' was deleted from UserTagDB.map");
            } else {
                console.log("Entry with key '" + tagname + "' was alredy absent from UserTagDB.map");
            }
        }

        function createTag(tagname, id, appendage, color) {
            var newtag = new UserTag(tagname, id, appendage, color);
            this.map.set(newtag.tagname, newtag);
            // console.log("Added UserTag " + this.map.get(newtag.tagname).tagname + " to map.set");
            // console.log(newtag.idlist.has(id));
            // console.log(this.map.get(tagname).idlist.has(id));
            // Let's try to save objects (value=newtag) with newtag.tagname as a key into localforage DB
            // Otherwise, we can try to save value=[newtag.idlist, newtag.color, new.appendage]
            localforage.setItem(newtag.tagname, newtag).then(function (newtag) {
                // Do other things once the value has been saved
                console.log("[UserTagDB.createTag/localforage.setItem().then] Added new entry to LFDB: " + newtag.tagname + ", " + newtag.appendage + ", " + newtag.color);
                return newtag;
            })
                .catch(function (err) {
                    console.log(err);
                });
        }

        function deleteTag(tagname) {
            if (this.map.delete(tagname)) {
                console.log("Entry with key '" + tagname + "' was deleted from UserTagDB.map");
            } else {
                console.log("Entry with key '" + tagname + "' was alredy absent from UserTagDB.map");
            }
            localforage.removeItem(tagname).then(function () {
                // Run this code once the key has been removed
                console.log("Entry with key '" + tagname + "' was deleted from DB");
            })
                .catch(function (err) {
                    console.log(err);
                });
        }

    }

    /////////////////////

    function GenerateMenu(map) {
        // Compose a huge string representing menu items
        var htmlMenuItemString = "";
        for (let key of map.keys()) {
            htmlMenuItemString += ("<menuitem label='" + key + "' onclick='console.log(\"Clicked 'Tag user' as submenu item\");return false;'></menuitem>");
        }
        var htmlMenuString = "\
			<menu type='context' id='usertagging'> \
				<menu label='Tag user as'>" + htmlMenuItemString + "</menu> \
				<menuitem label='Untag user' onclick='console.log(\"Clicked 'Untag user'\");return false;'></menuitem> \
			</menu> \
		";
        return htmlMenuString;
    }

    /*
     // Test full LFDB after-load (persistence)
     localforage.iterate(function(value, key, iterationNumber)
     {
     // Resulting key/value pair -- this callback will be executed for every item in the DB
     //this.map.set(key, value);	// fill this.map with entries from DB
     console.log("[window/localforage.iterate] LFDB persistence test: " + iterationNumber + ", " + key + ", " + value.tagname + ", " + value.appendage + ", " + value.color);
     })
     .then(function() {
     console.log("[window/localforage.iterate().then] LFDB persistence test completed");
     })
     .catch(function(err) {
     // This code runs if there were any errors
     console.log(err);
     });
     */
    // Test DB after writing new entries
    /*	localforage.getItem('Possible troll').then(function(value)
     {
     // This code runs once the value has been loaded from the offline store
     console.log("Testing after-write DB with 'Possible troll' entry: " + value.tagname + ", " + value.appendage + ", " + value.color);
     }).catch(function(err)
     {
     // This code runs if there were any errors
     console.log(err);
     });
     */
    // jQuery fuckfest^W magic
    $(function ()	// similar to $(document).ready(function()
    {
        InitDB(localforage);
        console.log("[window/$] Localforage DB is now initialized, ready to load");
        // Load data from LFDB (if present)
        var db = new UserTagDB(localforage);
        db.loadDB(localforage);
        console.log("[window/$] Localforage DB is now loaded into UserTagDB");
        // Test writing new entries into LFDB
        //db.createTag("Possible troll", "/id688591", "<span style=\"font-style:bold;color:green\"><sup>[troll]</sup></span>", "");
        //db.createTag("Trusted source", "/id210336", "trusted");

        $("body")															// start search inside body
            .find("a")														// search for links
            .filter("[class='author'],[class='im-mess-stack--lnk']")		// standard userlinks (in posts/comments) always have one of these properties
            .attr("contextmenu", "usertagging")								// to make an element use this context menu, add contextmenu="usertagging" attribute to it
            .append(GenerateMenu(db.map))											// "usertagging" matches the id attribute of the menu element
            .each(function ()												// apply the following function to search results
            {
                for (let [key, currentTag] of db.map)						// iterate over all UserTagDB entries
                {
                    //console.log("Now inside outer 'for' loop, processing db.map entry '" + currentTag.tagname + "'");
                    for (let id of currentTag.idlist)						// iterate over all ids associated with the UserTag
                    {
                        //console.log("Now inside outer 'for' loop, processing id '" + id + "'");
                        $(this).filter("[href='" + id + "']")				// only process entries that match current id
                            .each(function ()								// add markup according to currentTag settings
                            {
                                //console.log("Now inside inner 'each' function");
                                // if (currentTag.color) {};			// decide what to color first
                                $(this).append(currentTag.appendage)	// currentTag.appendage is itself a formatted string (can have <color>, <sup>, etc.)
                                    .css("color", currentTag.color);	// recolors whole username (appendage can be colored independently)
                            });
                    }
                }
            });
    });
    // Phew!

    console.log("[window] In-window script has finished");

})(window);

console.log("[global] Troll Tag userscript has stopped");