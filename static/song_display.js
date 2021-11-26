// Amount of notes shown before the starting/current note
var prevNoteCount = 2;
// Time (ms) between notes
var noteInterval = 1000; //1 second
// How precise the note updating is
var noteCheckPrecision = 4;
// Time (ms) between each note update
var noteCheckInterval = noteInterval / noteCheckPrecision;
// Var for counting to see if noteInterval has passed
var noteCheckCounter;
// Initialize vars for song info
var song;
// Interval called upon to play/pause the song
var songLoop;
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
        // Change selected note to this note
        changeCurrentNote($(this).index());
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
        // If last note in ul is selected
        if ($('.note_container > li').length-1 == $('#selected').index()) {
            // Change selected note to first note in ul
            changeCurrentNote(prevNoteCount);
        }
        noteCheckCounter = 0;
        // Call initial update
        checkPlayedNotes(moveNoteForward);
        // Move note forward
        songLoop = setInterval(function() {
            console.log()
            // counter == noteCheckPrecision (noteInterval has passed)
            checkPlayedNotes(moveNoteForward, noteCheckCounter == noteCheckPrecision);
            // If counter says noteInterval was reached, reset counter
            if (noteCheckCounter == noteCheckPrecision) { noteCheckCounter = 0; }
            noteCheckCounter++;
        }, noteCheckInterval);
    }

    // Pause song function
    function pauseSong() {
        $('#start_btn').text('Play');
        // Stop function calling
        clearInterval(songLoop);
        // Reset songInterval variable
        songLoop = undefined;
    }
    
    // Get recently played notes from python file
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
        var selectedNoteIndex = $('#selected').index();
        // If on last note of song
        //  - ~~~.length-1 = final note's index
        //  - selectedNoteIndex = index of current note
        if ($('.note_container > li').length-1 == selectedNoteIndex) {
            pauseSong();
            $('#selected').css('background-color',finishNoteColor);
            return;
        }

        // Change selected note to next note in ul
        changeCurrentNote(selectedNoteIndex + 1);

        // Reset list of pressed keys
        playedNotes = [];
    }

    // Changes currently selected note to new note (param: index of new selected note)
    function changeCurrentNote(newNoteIndex) {
        // Get index of currently selected note
        var selectedNote = $('#selected');
        // Get relative direction from currently selected note to new note
        var forwardNote = newNoteIndex > selectedNote.index();
        // Return if clicked note's id suggests it is a spacing note
        //      or if clicked note is already the current note
        if (newNoteIndex < prevNoteCount || newNoteIndex == selectedNote.index()) { return; }

        // Remove currently selected note
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


    // Hide notes that are further than (prevNoteCount) notes behind current notes
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

    // Show previously hidden notes
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