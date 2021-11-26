// Amount of notes shown before the starting/current note
var prevNoteCount = 2;
// Time (ms) between notes
var noteInterval = 1000; //1 second
// Initialize vars for song info
var song;
// Store id value of current note
var currentNoteID;
// Interval called upon to play/pause the song
var songLoop;
// For storing the keys pressed between notes
var playedNotes = [];

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
        // Update song titles
        $('.song_title').each(function() {
            $(this).html(song['title']);
        });
        $('.song_desc').html(song['desc']);
        // Properly format first empty notes
        for (var i = 0; i < prevNoteCount; i++)
        {
            $('.note_container').append(`<li>~</li>`);
        }
        $.map(song['notes'], function(post, i) {
            // Properly format first note with #current
            if (i == 0) {
                // Add note to notes list and #current class
                $('.note_container').append('<li id="current">' + song['notes'][i] + '</li>');
                // Update current note
                currentNoteID = i + prevNoteCount;
            } else {
                // Add note to notes list
                $('.note_container').append('<li>' + song['notes'][i] + '</li>');
            }
        });
    });

    //~~~~~~~~~~~~~~~
    //EVENTS
    //~~~~~~~~~~~~~~~
    // Highlight notes' background when mouse hovers over
    $(document).on('mouseenter', '.note_container > li', function() {
        if ($(this).attr('id') != 'current')
        {
            $(this).css('background-color','gray');
        }
    });
    $(document).on('mouseleave', '.note_container > li',  function() {
        if ($(this).attr('id') != 'current')
        {
            $(this).css('background-color','#abc');
        }
    });
    // Adjust list when new note is clicked on
    $(document).on('click', '.note_container > li', function() {
        // Init variable for clicked node's id
        var clickedID = $(this).index();
        // Get relative direction from current note to clicked note
        var forwardNote = clickedID > currentNoteID;
        // Return if clicked note's id suggests it is a spacing note
        //      or if clicked note is already the current note
        if (clickedID < prevNoteCount || clickedID == currentNoteID) { return; }
        
        // Remove current note
        $('#current').css('background-color','#abc');
        $('#current').removeAttr('id');
        // Assign id value of new current note as the clicked note
        currentNoteID = clickedID
        // Select next current note
        $(this).attr('id','current');
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
    $('#start_btn').click(function() {
        // If song is not playing
        if (songLoop == undefined) {
            playSong();
        } else {
            pauseSong();
        }
    });

    // Start song over by reloading page
    $('#reset_btn').click(function() {
        location.reload();
    });

    // Play song function
    function playSong() {
        $('#start_btn').text('Pause');
        // After 1 second
        setTimeout(function() {
            // Call initial update
            checkPlayedNotes(moveNoteForward);
            // Move note forward
            songLoop = setInterval(function() {
                checkPlayedNotes(moveNoteForward);
            }, noteInterval);
        }, noteInterval);
    }

    // Pause song function
    function pauseSong() {
        $('#start_btn').text('Play');
        // Stop function calling
        clearInterval(songLoop);
        // Reset songInterval variable
        songLoop = undefined;
    }

    // Progress forward a note in the song
    function moveNoteForward() {
        // If on last note of song
        //  - ~~~.length = final note's ID
        //  - currentNoteID = ID of current note
        if ($('.note_container > li').length == currentNoteID) {
            pauseSong();
            $('#current').css('background-color','blue');
            return;
        }
        // Remove current note
        $('#current').css('background','#abc');
        $('#current').removeAttr('id');
        // Update current note ID
        currentNoteID = currentNoteID + 1;
        // Select next current note
        $('li:nth-child('+currentNoteID+')').attr('id','current');
        $('li:nth-child('+currentNoteID+')').css('background-color', 'mediumseagreen');
        // Clear old notes
        clearPreviousNotes();
        // Reset list of pressed keys
        playedNotes = [];
    }
    
    // Get recently played notes from python file
    function checkPlayedNotes(callback) {
        $.ajax({
            url: "/get_notes",
            type: "GET",
            dataType: "json",
            success: function(response) {
                // Iterate through note values in returned array
                for (var i=0; i < response.length; i++) {
                    playedNotes.push(response[i]);
                }
                // If correct note is in playedNotes
                if (playedNotes.indexOf($('#current').text()) != -1) {
                    // Calls moveNoteForward()
                    callback(playedNotes);
                } else {
                    // Highlight red background to show wrong note played
                    $('#current').css('background-color', 'red');
                    // Reset counter
                }
            }
        });
    }

    // Hide notes that are further than 2 notes behind current notes
    function clearPreviousNotes() {
        // Remove all previous elements to scroll further in song
        $('.note_container > li').each(function() {
            // Compare index of list
            if ($(this).index() < currentNoteID-prevNoteCount)
            {
                $(this).hide();
            }
        });
    }

    // Show previously hidden notes
    function showPreviousNotes(noteID) {
        // Show the 2 previous elements
        $('.note_container > li:hidden').each(function() {
            // If ID of note is within 2 notes, show
            if ($(this).index() >= currentNoteID - prevNoteCount)
            {
                $(this).show();
            }
        });
    }
});