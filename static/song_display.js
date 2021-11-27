// Edit HTML elements only once page is loaded
$(document).ready(function() {
    // Var for counting to see if config['note_interval'] has passed
    var noteCheckCounter;
    // Interval called upon to control song playback
    var songLoop = undefined;
    // For storing the keys pressed between notes
    var playedNotes = [];
    // Get config information
    var config = getConfig();
    // Time (ms) between each note update
    var noteCheckInterval = config['note_interval'] / config['update_precision'];
    // Load song information onto web page's elements
    getSong(setupSong, songIndex);


    //~~~~~~~~~~~~~~~
    // WEB REQUESTS
    //~~~~~~~~~~~~~~~


    // Get config information
    function getConfig() {
        config = $.ajax({
            async: false,
            url: "/get_config",
            type: "GET",
            dataType: "json"
        }).responseText;
        return JSON.parse(config);
    }
    // Set new JSON information
    function setConfig(key, value) {
        // Send song info to main app.py to save
        $.ajax({
            url: '/set_config',
            data: JSON.stringify([key, value]),
            contentType: 'application/json;charset=UTF-8',
            type: 'POST',
            success: function() {
                // Alert user that song was saved
                alert('Config Saved!');
            }
        });
    }

    // Set song variable by retrieving data
    function getSong(callback, songIndex) {
        $.ajax({
            url: "/get_songs",
            type: "GET",
            dataType: "json",
            success: function(songs) {
                // If song index is valid
                if (!isNaN(songIndex) && songIndex < songs.length && songIndex >= 0) {
                    // Return song value
                    callback(songs[songIndex]);
                }
                // Send user back to song selection if song index isn't valid
                else {
                    alert('Invalid song link!');
                    // Redirect user to song selection
                    location.href = songSelectURL;
                }
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
            success: function(notes) {
                // Iterate through note values in returned array
                for (var i=0; i < notes.length; i++) {
                    // Convert musical symbols to their html equivalents
                    var note = notes[i].replace('&#9837;','♭');
                    note = note.replace('&#9839;','♯');
                    // Add note to list
                    playedNotes.push(note);
                }
                // Check to see if pressed notes match selected note
                var matchingNote = function() {
                    var goalString= $('#selected').text();
                    for (var i=0;i<playedNotes.length;i++) {
                        if (playedNotes[i] == goalString) {
                            return true;
                        }
                    }
                    return false;
                }();
                // If correct note is in playedNotes
                if (matchingNote) {
                    // Calls moveNoteForward()
                    callback();
                    // Reset counter
                    noteCheckCounter = 0;
                    // Reset played notes
                    playedNotes = [];
                // If correct note was not played and it has been a second
                } else if (noteIntervalPassed) {
                    // Highlight red background to show wrong note played
                    $('#selected').css('background-color', config['missed_note_color']);
                }
            }
        });
    }

    // Clear list of previously pressed notes
    function clearPressedNotes() {
        $.ajax({
            url: "/clear_notes"
        });
    }


    //~~~~~~~~~~~~~~~
    // FUNCTIONS
    //~~~~~~~~~~~~~~~


    // Load song information onto web page's elements
    function setupSong(song) {
        // Update song titles & description
        $('.song_title').each(function() {
            $(this).html(song['title']);
        });
        $('.song_desc').html(song['desc']);
        // Properly format first empty notes
        for (var i = 0; i < config['display_spacing_notes']; i++)
        {
            $('.note_container').append(`<li>~</li>`);
        }
        $.map(song['notes'], function(note, i) {
            // Properly format first note with #selected
            if (i == 0) {
                // Add note to notes list and #selected class
                $('.note_container').append('<li id="selected" style="background-color:'+config['selected_note_color']+'">' + note + '</li>');
            } else {
                // Add note to notes list
                $('.note_container').append('<li>' + note + '</li>');
            }
        });
    }

    // Play song function
    function startSong() {
        // Clear list of previously pressed notes
        clearPressedNotes();
        // Return if there are no notes in the song
        if ($('.note_container li').length == config['display_spacing_notes']) { return; }
        // Change play/pause button's text
        $('#play_btn').text('Pause');
        // If last note in ul is selected
        if ($('.note_container > li').length-1 == $('#selected').index()) {
            // Change selected note to first note in ul
            changeSelectedNote(config['display_spacing_notes']);
        }
        if (config['wait_for_note']) {
            // Reset note counter
            noteCheckCounter = 0;
            // Move note forward every (noteCheckInterval) ms
            songLoop = setInterval(function() {
                // counter == config['update_precision'] (noteInterval has passed)
                var noteIntervalPassed = noteCheckCounter == config['update_precision'];
                checkPlayedNotes(moveNoteForward, noteIntervalPassed);
                // If counter says noteInterval was reached, reset counter
                if (noteIntervalPassed) { noteCheckCounter = 0; }
                // Increase counter
                noteCheckCounter++;
            }, noteCheckInterval);
        } else {
            // After config['note_interval'] ms
            setTimeout(function() {
                // Call initial update
                moveNoteForward();
                // Move note forward every config['note_interval'] ms
                songLoop = setInterval(moveNoteForward, config['note_interval']);
            }, config['note_interval']);
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

    // Progress forward a note in the song
    function moveNoteForward() {
        // Get index of selected note
        var selectedNoteIndex = $('#selected').index();
        // If on last note of song
        //  - ~~~.length-1 = final note's index
        //  - selectedNoteIndex = index of selected note
        if ($('.note_container > li').length-1 == selectedNoteIndex) {
            stopSong();
            $('#selected').css('background-color',config['finish_note_color']);
            return;
        }
        // Change selected note to next note in ul
        changeSelectedNote(selectedNoteIndex + 1);
        // Reset list of pressed keys
        playedNotes = [];
    }
    // Changes selected note to new note (param: index of new selected note)
    function changeSelectedNote(newNoteIndex) {
        // Return if clicked note's id suggests it is a spacing note
        if (newNoteIndex < config['display_spacing_notes']) { return; }
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
        $('li:nth-child('+childIndex+')').css('background-color',config['selected_note_color']);
        
        if (forwardNote) {
            // Hide old notes
            clearPreviousNotes();
        } else {
            // Show previously hidden notes
            showPreviousNotes();
        }
    }

    // Hide notes that are further than (config['display_spacing_notes']) notes behind selected note
    function clearPreviousNotes() {
        // Index of selected note
        var selectedNoteIndex = $('#selected').index();
        // Remove previous elements to "move forward" in note list
        $('.note_container > li').each(function() {
            // If index of note is not within (config['display_spacing_notes']) notes of selected note, hide element
            if ($(this).index() < selectedNoteIndex - config['display_spacing_notes'])
            {
                $(this).hide();
            }
        });
    }
    // Show notes that are within (config['display_spacing_notes']) notes behind selected note
    function showPreviousNotes() {
        // Index of selected note
        var selectedNoteIndex = $('#selected').index();
        // Show previous elements to "move back" in note list
        $('.note_container > li:hidden').each(function() {
            // If index of note is within (config['display_spacing_notes']) notes of selected note, show element
            if ($(this).index() >= selectedNoteIndex - config['display_spacing_notes'])
            {
                $(this).show();
            }
        });
    }


    //~~~~~~~~~~~~~~~
    // EVENTS
    //~~~~~~~~~~~~~~~


    // Highlight notes' background when mouse hovers over
    $(document).on('mouseenter', '.note_container > li', function() {
        if ($(this).attr('id') != 'selected')
        {
            $(this).css('background-color',config['hover_note_color']);
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
});