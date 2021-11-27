// Amount of notes shown before the starting selected note
var prevNoteCount = 2;
// Time (ms) between notes
var noteInterval = 1000; //1 second
// How precise the note updating is
var noteCheckPrecision = 4;
// Time (ms) between each note update
var noteCheckInterval = noteInterval / noteCheckPrecision;
// Bool, should program wait for correct key press
var waitForNotePress = true;
// Var for counting to see if noteInterval has passed
var noteCheckCounter;
// Initialize vars for song info
var song;
// Interval called upon to play/pause the song
var songLoop = undefined;
// For storing the keys pressed between notes
var playedNotes = [];
// Background color of selected notes
var selectedNoteColor = "mediumseagreen";
// Background color of hovered over notes
var hoverNoteColor = "gray";
// Background color of last note in song when completed
var finishNoteColor = "blue";

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
            // Properly format first note with #selected
            if (i == 0) {
                // Add note to notes list and #selected class
                $('.note_container').append('<li id="selected" style="background-color:'+selectedNoteColor+'">' + song['notes'][i] + '</li>');
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
        if ($(this).attr('id') != 'selected')
        {
            $(this).css('background-color',hoverNoteColor);
        }
    });
    $(document).on('mouseleave', '.note_container > li',  function() {
        if ($(this).attr('id') != 'selected')
        {
            $(this).css('background-color','transparent');
        }
    });
    // Adjust list when new note is clicked on
    $(document).on('click', '.note_container > li', function() {
        // Stop song playing loop
        stopSong();
        // Change selected note to this note
        changeSelectedNote($(this).index());
    });

    // Play / Pause song
    $('#play_btn').on('click', function() {
        // If song loop is not active
        if (songLoop == undefined) {
            startSong();
        } else {
            stopSong();
        }
    });

    // Start song over by reloading page
    $('#reset_btn').on('click', function() {
        location.reload();
    });

    // Play song function
    function startSong() {
        // Return if there are no notes in the song
        if ($('.note_container li').length-1 == prevNoteCount) { return; }
        // Change play/pause button's text
        $('#play_btn').text('Pause');
        // If last note in ul is selected
        if ($('.note_container > li').length-1 == $('#selected').index()) {
            // Change selected note to first note in ul
            changeSelectedNote(prevNoteCount);
        }
        if (waitForNotePress) {
            // Reset note counter
            noteCheckCounter = 0;
            // Move note forward every (noteCheckInterval) ms
            songLoop = setInterval(function() {
                // counter == noteCheckPrecision (noteInterval has passed)
                var noteIntervalPassed = noteCheckCounter == noteCheckPrecision;
                checkPlayedNotes(moveNoteForward, noteIntervalPassed);
                // If counter says noteInterval was reached, reset counter
                if (noteIntervalPassed) { noteCheckCounter = 0; }
                // Increase counter
                noteCheckCounter++;
            }, noteCheckInterval);
        } else {
            // After (noteInterval) ms
            setTimeout(function() {
                // Call initial update
                moveNoteForward();
                // Move note forward every (noteInterval)
                songLoop = setInterval(moveNoteForward, noteInterval);
            }, noteInterval);
        }
    }

    // Pause song function
    function stopSong() {
        // Only stop songLoop if it's already playing
        if (songLoop != undefined) {
            // Change play/pause button's text
            $('#play_btn').text('Play');
            // Stop function calling
            clearInterval(songLoop);
            // Reset songInterval variable
            songLoop = undefined;
        }
    }
    
    // Get recently played notes from python file,
    //   Check them to see if they match the selected note
    function checkPlayedNotes(callback, noteIntervalPassed) {
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
                if (playedNotes.indexOf($('#selected').text()) != -1) {
                    // Calls moveNoteForward()
                    callback();
                    // Reset counter
                    noteCheckCounter = 0;
                // If correct note was not played and it has been a second
                } else if (noteIntervalPassed) {
                    // Highlight red background to show wrong note played
                    $('#selected').css('background-color', 'red');
                }
            }
        });
    }

    // Progress forward a note in the song
    function moveNoteForward() {
        // Get index of selected note
        var selectedNoteIndex = $('#selected').index();
        // If on last note of song
        //  - ~~~.length-1 = final note's index
        //  - selectedNoteIndex = index of selected note
        if ($('.note_container > li').length-1 == selectedNoteIndex) {
            stopSong();
            $('#selected').css('background-color',finishNoteColor);
            return;
        }
        // Change selected note to next note in ul
        changeSelectedNote(selectedNoteIndex + 1);
        // Reset list of pressed keys
        playedNotes = [];
    }

    // Changes selected note to new note (param: index of new selected note)
    function changeSelectedNote(newNoteIndex) {
        // Get index of selected note
        var selectedNote = $('#selected');
        // Get relative direction from selected note to new note
        var forwardNote = newNoteIndex > selectedNote.index();
        // Return if clicked note's id suggests it is a spacing note
        //    or if clicked note is already the selected note
        if (newNoteIndex < prevNoteCount || newNoteIndex == selectedNote.index()) { return; }
        // Remove selected note
        selectedNote.css('background-color','transparent');
        selectedNote.removeAttr('id');
        // Select new note
        var childIndex = newNoteIndex + 1;
        $('li:nth-child('+childIndex+')').attr('id','selected');
        $('li:nth-child('+childIndex+')').css('background-color',selectedNoteColor);
        
        if (forwardNote) {
            // Hide old notes
            clearPreviousNotes();
        } else {
            // Show previously hidden notes
            showPreviousNotes();
        }
    }

    // Changes selected note to new note (param: index of new selected note)
    function changeSelectedNote(newNoteIndex) {
        // Return if clicked note's id suggests it is a spacing note
        if (newNoteIndex < prevNoteCount) { return; }
        // Bool, answers the question: is the new note backwards or forwards in the song list
        var forwardNote;
        // If selected note exists
        if ($('#selected').length > 0) {
            // Get index of selected note
            var selectedNote = $('#selected');
            // Return if clicked note is already the selected note
            if (newNoteIndex == selectedNote.index()) { return; }
            // Get relative direction from selected note to new note
            forwardNote = newNoteIndex > selectedNote.index();

            // Remove selected note
            selectedNote.css('background-color','transparent');
            selectedNote.removeAttr('id');
        }
        // If no notes are selected
        else {
            forwardNote = false;
        }

        // Select new note (Child indices start at 1, not 0)
        var childIndex = newNoteIndex + 1;
        $('li:nth-child('+childIndex+')').attr('id','selected');
        $('li:nth-child('+childIndex+')').css('background-color',selectedNoteColor);
        
        if (forwardNote) {
            // Hide old notes
            clearPreviousNotes();
        } else {
            // Show previously hidden notes
            showPreviousNotes();
        }
    }


    // Hide notes that are further than (prevNoteCount) notes behind selected note
    function clearPreviousNotes() {
        // Index of selected note
        var selectedNoteIndex = $('#selected').index();
        // Remove previous elements to "move forward" in note list
        $('.note_container > li').each(function() {
            // If index of note is not within (prevNoteCount) notes of selected note, hide element
            if ($(this).index() < selectedNoteIndex - prevNoteCount)
            {
                $(this).hide();
            }
        });
    }

    // Show notes that are within (prevNoteCount) notes behind selected note
    function showPreviousNotes() {
        // Index of selected note
        var selectedNoteIndex = $('#selected').index();
        // Show previous elements to "move back" in note list
        $('.note_container > li:hidden').each(function() {
            // If index of note is within (prevNoteCount) notes of selected note, show element
            if ($(this).index() >= selectedNoteIndex - prevNoteCount)
            {
                $(this).show();
            }
        });
    }
});