// Amount of notes shown before the starting/current note
var prevNoteCount = 2;
// Time (ms) between notes
var noteInterval = 1000; //1 second
// Calculate time between playedNotes updates
var noteUpdatePrecision = 10;
var noteUpdateInterval = noteInterval/noteUpdatePrecision;
// Initialize vars for song info
var song;
// Store id value of current note
var currentNoteID;
// Interval called upon to play/pause the song
var songLoop;
// For storing the keys pressed between notes
var playedNotes = [];
// Counter for time between notes
var counter = 0;

// Edit HTML elements only once page is loaded
$(document).ready(function() {
    // Fetch JSON data in readable format
    $.getJSON(songDataURL, function (songData) {
        // Send user back to song selection if song ID isn't valid
        if (songID < 0 || songID > songData.length || isNaN(songID)) {
            alert('Invalid song link!');
            // Redirect user to song selection
            location.href = songSelectURL;
        }
        song = songData[songID];
        // Update song title
        $('#song-title').html(song['title']);
        $('#song-desc').html(song['desc']);
        // Properly format first empty notes
        for (var i = 0; i < prevNoteCount; i++)
        {
            $('.note-container').append(`<li id="${i}">~</li>`);
        }
        $.map(song['notes'], function(post, i) {
            // Properly format first note with .current
            if (i == 0) {
                // Add note to notes list and .current class
                $('.note-container').append('<li class="current" id="' + (i + prevNoteCount) + '">' + song['notes'][i] + '</li>');
                // Update current note
                currentNoteID = i + prevNoteCount;
            } else {
                // Add note to notes list
                $('.note-container').append('<li id="' + (i + prevNoteCount) + '">' + song['notes'][i] + '</li>');
            }
        });
    });

    //~~~~~~~~~~~~~~~
    //EVENTS
    //~~~~~~~~~~~~~~~
    // Highlight notes' background when mouse hovers over
    $(document).on('mouseenter', '.note-container > li', function() {
        if ($(this).attr('class') != 'current')
        {
            $(this).css('background-color','gray');
        }
    });
    $(document).on('mouseleave', '.note-container > li',  function() {
        if ($(this).attr('class') != 'current')
        {
            $(this).css('background-color','#abc');
        }
    });
    // Adjust list when new note is clicked on
    $(document).on('click', '.note-container > li', function() {
        // Init variable for clicked node's id
        var clickedID = parseInt($(this).attr('id'));
        // Get relative direction from current note to clicked note
        var forwardNote = clickedID > currentNoteID;
        // Return if clicked note's id suggests it is a spacing note
        //      or if clicked note is already the current note
        if (clickedID < prevNoteCount || clickedID == currentNoteID) { return; }
        
        // Remove current note
        $('.current').css('background-color','#abc');
        $('.current').removeClass('current');
        // Assign id value of new current note as the clicked note
        currentNoteID = clickedID
        // Select next current note
        $(this).addClass('current');
        $(this).css('background-color', 'mediumseagreen');

        // Adjust notes
        if (forwardNote) {
            // Hide old notes
            clearPreviousNotes();
        } else {
            // Show previous notes
            showPreviousNotes();
        }
        
        // If song is playing,
        // Reset setInterval timer to avoid instant note progression
        if (songLoop != undefined) {
            pauseSong();
            playSong();
        }
    });

    // Play / Pause song
    $('#start-btn').click(function() {
        // If song is not playing
        if (songLoop == undefined) {
            playSong();
        } else {
            pauseSong();
        }
    })

    // Start song over by reloading page
    $('#reset-btn').click(function() {
        location.reload();
    })

    // Play song function
    function playSong() {
        $('#start-btn').text('Pause');
        // Call initial
        checkPlayedNotes(moveNoteForward);
        // Move note forward
        songLoop = setInterval(function() {
            checkPlayedNotes(moveNoteForward);
        }, noteUpdateInterval);
    }

    // Pause song function
    function pauseSong() {
        $('#start-btn').text('Play');
        // Stop function calling
        clearInterval(songLoop);
        // Reset songInterval variable
        songLoop = undefined;
    }

    // Progress forward a note in the song
    function moveNoteForward() {
        // If next current note is not valid, autopause the song
        //  - ~~~.length = final note's ID
        //  - currentNoteID + 1 = ID of next current note
        if ($('.note-container > li').length == currentNoteID + 1) {
            pauseSong();
            $('.current').css('background-color','blue');
            return;
        }
        // Remove current note
        $('.current').css('background','#abc');
        $('.current').removeClass('current');
        // Update current note ID
        currentNoteID = currentNoteID + 1;
        // Select next current note
        $('#' + currentNoteID).addClass('current');
        $('#' + currentNoteID).css('background-color', 'mediumseagreen');
        // Clear old notes
        clearPreviousNotes();
        // Reset list of pressed keys
        playedNotes = [];
    }
    
    // Get recently played notes from python file
    function checkPlayedNotes(callback) {
        $.ajax({
            url: "/getNotes",
            type: "GET",
            dataType: "json",
            success: function(response) {
                // Iterate through note values in returned array
                for (var i=0; i < response.length; i++) {
                    playedNotes.push(response[i]);
                }
                counter++;
                console.log(counter);
                // If 1 second has passed correct note is in playedNotes
                if (counter == noteUpdatePrecision && playedNotes.indexOf($('.current').text()) != -1) {
                    console.log(response);
                    // Calls moveNoteForward()
                    callback(playedNotes);
                    // Reset counter
                    counter = 0;
                } else if (counter == noteUpdatePrecision) {
                    // Highlight red background to show wrong note played
                    $('.current').css('background-color', 'red');
                    // Reset counter
                    counter = 0;
                    return;
                }
            }
        });
    }

    // Hide notes that are further than 2 notes behind current notes
    function clearPreviousNotes() {
        // Remove all previous elements to scroll further in song
        $('.note-container > li').each(function() {
            // Compare index of list
            if (parseInt($(this).attr('id')) < currentNoteID-prevNoteCount)
            {
                $(this).hide();
            }
        });
    }

    // Show previously hidden notes
    function showPreviousNotes(noteID) {
        // Show the 2 previous elements
        $('.note-container > li:hidden').each(function() {
            // If ID of note is within 2 notes, show
            if (parseInt($(this).attr('id')) >= currentNoteID - prevNoteCount)
            {
                $(this).show();
            }
        });
    }
});