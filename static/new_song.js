// stores recording loop state
var recordLoop = undefined;
// Precision of recording note updates (ms)
var noteCheckInterval = 250;

var currentNoteID = 0;
var prevNoteCount = 4;

$(document).ready(function() {
    // Add empty notes at beginning of song for spacing
    function addSpacingNotes() {
        // ADD SPACING NOTES
        for (var i=0;i < prevNoteCount; i++) {
            // Add note to notes list
            $('.note_container').append('<li>~</li>');
        }
    }
    addSpacingNotes();

    // Fetch JSON song data in readable format
    /*$.getJSON(songDataURL, function (songData) {
        var song = songData[0];
        // Update song title
        $('#song-title').html(song['title']);
        $('#song-desc').html(song['desc']);
    });*/

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

    // Adjust list to focus on clicked note (on left click)
    $(document).on('click', '.note_container > li', function() {
        // Stop song recording
        stopRec();

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
        currentNoteID = clickedID;
        // Select next current note
        $(this).attr('id','current');
        $(this).css('background-color', 'mediumseagreen');

        // Adjust notes
        if (forwardNote) {
            // Hide old notes
            clearPreviousNotes();
        } else {
            // Show previous notes-
            showPreviousNotes();
        }
    });

    // Delete currently selected note
    $('#delete_btn').click(function() {
        // Stop song recording
        stopRec();

        // If there are no notes in the song, return 
        if ($('.note_container li').length <= prevNoteCount) { return; }
        // Init variable for clicked node's id
        var selectedID = $('#current').index();
        // Remove selected element
        $('#current').remove();
        // If note position is at beginning of list and note in its place exists
        if (prevNoteCount == selectedID) {
            var index = prevNoteCount + 1;
            // Make replacement note the new current note
            $('.note_container > li:nth-child('+index+')').attr('id','current');
            $('.note_container > li:nth-child('+index+')').css('background-color', 'mediumseagreen');
        }
        else {
            // Make previous note the new current note
            $('.note_container > li:nth-child('+selectedID+')').attr('id','current');
            $('.note_container > li:nth-child('+selectedID+')').css('background-color', 'mediumseagreen');
            // Assign id value of new current note
            currentNoteID = selectedID - 1;
        }

        // Show previously hidden notes
        showPreviousNotes();
    });

    // Clear all added notes
    $('#clear_btn').click(function() {
        // Stop song recording
        stopRec();
        // Clear all note blocks from list
        $('.note_container').empty();
        // Add spacing notes back
        addSpacingNotes();
    });

/*
    // Play song function
    function playSong() {
        $('#start-btn').text('Pause');
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
        $('#start-btn').text('Play');
        // Stop function calling
        clearInterval(songLoop);
        // Reset songInterval variable
        songLoop = undefined;
    }
*/
    // Start / Stop recording song
    $('#record_btn').click(function() {
        // If song is not recording
        if (recordLoop == undefined) {
            startRec();
        } else {
            stopRec();
        }
    });

    // Play song function
    function startRec() {
        $('#record_btn').text('Stop Recording');
        // Call initial update
        getPlayedNotes(instantiateNotes);
        // Move note forward
        recordLoop = setInterval(function() {
            getPlayedNotes(instantiateNotes);
        }, noteCheckInterval);
    }

    // Pause song function
    function stopRec() {
        $('#record_btn').text('Record');
        // Stop function calling
        clearInterval(recordLoop);
        // Reset songInterval variable
        recordLoop = undefined;
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
            if ($(this).index() >= currentNoteID-prevNoteCount)
            {
                $(this).show();
            }
        });
    }

    // Get recently played notes from python file
    function getPlayedNotes(callback) {
        $.ajax({
            url: "/get_notes",
            type: "GET",
            dataType: "json",
            success: function(response) {
                // Calls instantiateNotes(recentlyPlayedNotes)
                callback(response);
            }
        });
    }

    // Add list of notes to html page
    function instantiateNotes(notes) {
        for (var i=0; i < notes.length; i++) {
            // Add note to notes list
            $('.note_container').append('<li>' + notes[i] + '</li>');
            // Remove current note
            $('#current').css('background','#abc');
            $('#current').removeAttr('id');
            // Assign id value of new current note as the clicked note
            currentNoteID = $('.note_container li:last-child').index();
            // Select next current note
            $('.note_container li:last-child').attr('id','current');
            $('.note_container li:last-child').css('background-color', 'mediumseagreen');
            clearPreviousNotes();
        }
    }
});