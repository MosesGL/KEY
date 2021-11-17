// Amount of notes shown before the starting/current note
var prevNoteCount = 2;
// Initialize vars for song info
var song;
var notes;
// Store id value of current note
var currentNoteID;

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
        notes = song['notes'];
        // Update song title
        $('#song-title').html(song['title']);
        $('#song-desc').html(song['desc']);
        // Properly format first empty notes
        for (var i = 0; i < prevNoteCount; i++)
        {
            $('.note-container').append(`<li id="${i}">~</li>`);
        }
        $.map(notes, function(post, i) {
            // Properly format first note with .current
            if (i == 0) {
                // Add note to notes list and .current class
                $('.note-container').append('<li class="current" id="' + (i + prevNoteCount) + '">' + notes[i] + '</li>');
                // Update current note
                currentNoteID = i + prevNoteCount;
            } else {
                // Add note to notes list
                $('.note-container').append('<li id="' + (i + prevNoteCount) + '">' + notes[i] + '</li>');
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
    });

    // Start looking for keyboard input by triggering socketio event
    $('#start-btn').click(function() {
        // Initialize socket
        //var socket = io.connect("http://127.0.0.1:5000");
        //socket.emit('get_next_note', {data: currentNoteID});
    })

    // Start song over by reloading page
    $('#reset-btn').click(function() {
        location.reload();
    })

    //WHEN CORRECT NOTE IS PLAYED, moveNoteForward()

    function moveNoteForward() {
        if ($('.note-container > li').length == prevNoteCount + 1) { return; }
        currentNoteID = parseInt($('.current').attr('id'));
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
    }

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