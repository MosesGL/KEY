// Amount of notes shown before the starting selected note
var prevNoteCount = 4;
// Time between notes (ms) when playing through song
var noteInterval = 1000; //1 second
// How precise the note updating is
var noteCheckPrecision = 4;
// Time (ms) between each note update
var noteCheckInterval = noteInterval / noteCheckPrecision;
// Bool, should program wait for correct key press
var waitForNotePress = true;
// Var for counting to see if noteInterval has passed
var noteCheckCounter;
// stores song play loop state
var songLoop = undefined;
// stores recording loop state
var recordLoop = undefined;
// For storing the keys pressed between notes
var playedNotes = [];
// Background color of selected notes
var selectedNoteColor = "mediumseagreen";
// Background color of hovered over notes
var hoverNoteColor = "gray";
// Background color of last note in song when completed
var finishNoteColor = "blue";

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

    // Adjust list to focus on clicked note (on left click)
    $(document).on('click', '.note_container > li', function() {
        // Stop playing/recording loops
        stopLoops();
        // Change selected note to this note
        changeSelectedNote($(this).index());
    });

    // Delete selected note
    $('#delete_btn').on('click', function() {
        // Stop playing/recording loops
        stopLoops();
        // If there are no notes in the song, return 
        if ($('.note_container li').length <= prevNoteCount) { return; }
        // Fetch selected element
        var selectedNoteIndex = $('#selected').index();
        // Remove selected note element
        $('#selected').remove();
        // If note position is at beginning of list and note in its place exists
        if (prevNoteCount == selectedNoteIndex) {
            // Make replacement note the new selected note
            changeSelectedNote(selectedNoteIndex);
        }
        else {
            // Make previous note the new selected note
            changeSelectedNote(selectedNoteIndex - 1);
        }
    });

    // Clear all added notes
    $('#clear_btn').on('click', function() {
        // Stop playing/recording loops
        stopLoops();
        // Clear all note blocks from list
        $('.note_container').empty();
        // Add spacing notes back
        addSpacingNotes();
    });
    
    // Start / Stop playing song
    $('#play_btn').on('click', function() {
        // If song playing loop is not active
        if (songLoop == undefined) {
            startSong();
        } else {
            stopSong();
        }
    });

    // Start / Stop recording song
    $('#record_btn').on('click', function() {
        // If recording loop is not active
        if (recordLoop == undefined) {
            startRec();
        } else {
            stopRec();
        }
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

    // Play song function
    function startRec() {
        // Stop playing song
        stopSong();
        // Change record button's text
        $('#record_btn').text('Stop Recording');
        // Call initial update
        getPlayedNotes(instantiateNotes);
        // Move note forward every (noteCheckInterval) ms
        recordLoop = setInterval(function() {
            getPlayedNotes(instantiateNotes);
        }, noteCheckInterval);
    }

    // Pause song function
    function stopRec() {
        // Only stop recording loop if it's already playing
        if (recordLoop != undefined) {
            // Change record button's text
            $('#record_btn').text('Record');
            // Stop function calling
            clearInterval(recordLoop);
            // Reset songInterval variable
            recordLoop = undefined;
        }
    }

    // Stop playing and recording song loops
    function stopLoops() {
        // Stop playing song loop
        stopSong();
        // Stop recording loop
        stopRec();
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

    // Add list of notes to html page
    function instantiateNotes(notes) {
        for (var i=0; i < notes.length; i++) {
            // Add note to notes list
            $('.note_container').append('<li>' + notes[i] + '</li>');
        }
        // Switch selected note to last note added to ul
        changeSelectedNote($('.note_container li:last-child').index());
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