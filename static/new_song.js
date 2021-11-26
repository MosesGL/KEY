// stores recording loop state
var recordLoop = undefined;
// Precision of recording note updates (ms)
var noteCheckInterval = 250;

var prevNoteCount = 4;

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
        // Stop recording notes
        stopRec();
        // Change selected note to this note
        changeCurrentNote($(this).index());
    });

    // ADUBGSUDBGSDBGDSG
    // Delete currently selected note
    $('#delete_btn').click(function() {
        // Stop recording notes
        stopRec();

        // If there are no notes in the song, return 
        if ($('.note_container li').length <= prevNoteCount) { return; }
        // Fetch currently selected element
        var selectedNoteIndex = $('#selected').index();
        // Remove selected note element
        $('#selected').remove();
        // If note position is at beginning of list and note in its place exists
        if (prevNoteCount == selectedNoteIndex) {
            // Make replacement note the new current note
            changeCurrentNote(selectedNoteIndex);
        }
        else {
            // Make previous note the new current note
            changeCurrentNote(selectedNoteIndex - 1);
        }
    });

    // Clear all added notes
    $('#clear_btn').click(function() {
        // Stop recording notes
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
        }
        // Switch selected note to last note added to ul
        changeCurrentNote($('.note_container li:last-child').index());
    }

    // Changes currently selected note to new note (param: index of new selected note)
    function changeCurrentNote(newNoteIndex) {
        // Return if clicked note's id suggests it is a spacing note
        if (newNoteIndex < prevNoteCount) { return; }
        
        // Bool, answers the question: is the new note backwards or forwards in the song list
        var forwardNote;

        // If selected note exists
        if ($('#selected').length > 0) {

            // Get index of currently selected note
            var selectedNote = $('#selected');
            // Get relative direction from currently selected note to new note
            forwardNote = newNoteIndex > selectedNote.index();

            // Return if clicked note is already the current note
            if (newNoteIndex == selectedNote.index()) { return; }

            // Remove currently selected note
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