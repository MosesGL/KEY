// Edit HTML elements only once page is loaded
$(document).ready(function() {
    // Var for counting to see if config['note_interval'] has passed
    var noteCheckCounter;
    // Vars called upon to control song playback
    var playingSong = false; // Needed because when button is pressed too quickly, loop is not active
    var songLoop = undefined;
    // For storing the keys pressed between notes
    let playedNotes = [];
    // Get config information
    if (config == undefined) {
        config = getConfig();
    }
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
            url: "/get_config",
            type: "GET",
            dataType: "json"
        }).responseText;
        if (config == undefined) {
            location.reload();
        }
        return JSON.parse(config);
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
                    var note = notes[i];
                    // Get note index in list of every available note
                    var noteIndex = config['NOTES'].indexOf(note);
                    // Reformat note with correct symbols
                    if (config['use_sharps']) {
                        note = config['NOTES_SHARP'][noteIndex];
                    } else {
                        note = config['NOTES_FLAT'][noteIndex];
                    }
                    // Reformat note with correct symbols
                    note = note.replace('&#9839;','♯');
                    note = note.replace('&#9837;','♭');
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

    // Clear list of previously pressed notes in app.py
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
        if (song['desc'] == "") {
            $('.song_desc').hide();
        }
        // For every note in song
        $.map(song['notes'], function(note, i) {
            // Get note index in list of every available note
            var noteIndex = config['NOTES'].indexOf(note);
            // Reformat note with correct symbols
            if (config['use_sharps']) {
                note = config['NOTES_SHARP'][noteIndex];
            } else {
                note = config['NOTES_FLAT'][noteIndex];
            }
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
        // Continue if there are notes in the song
        if (songLoop == undefined && $('.note_container > li').length != 0) {
            // Clear list of previously pressed notes
            clearPressedNotes();
            // Change play/pause button's text
            $('#play_btn').text('Pause');
            // If last note in ul is selected
            if ($('.note_container > li').length-1 == $('#selected').index()) {
                // Change selected note to first note in ul
                changeSelectedNote(0);
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
    }
    // Pause song function
    function stopSong() {
        // Only stop songLoop if song is already playing
        if (songLoop != undefined) {
            // Change play/pause button's text
            $('#play_btn').text('Play');
            // Stop function calling
            clearInterval(songLoop);
            // Reset songInterval variable
            songLoop = undefined;
            playingSong = false;
        }
    }

    // Update progress bar to show position in song
    function updateProgressBar() {
        // Get position percentage in song
        var position = $('#selected').index()/($('.note_container > li').length-1);
        // Update value of progress bar
        $('.song_progress_value').css('width',(position*100).toString() + "%");
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
        $('.note_container > li:nth-child('+childIndex+')').attr('id','selected');
        $('.note_container > li:nth-child('+childIndex+')').css('background-color',config['selected_note_color']);
        
        if (forwardNote) {
            // Hide old notes
            clearPreviousNotes();
        } else {
            // Show previously hidden notes
            showPreviousNotes();
        }
        updateProgressBar();
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

    // When progress bar is clicked
    $('.song_progress').on('click',function(event) {
        stopSong();
        // Mouse distance from left edge
        var mouseX = event.pageX;
        // Width of screen
        var screenWidth = $(window).width();
        // Calculate li index around same percentage
        //   index/num-elements = value/progress-bar-max-value
        var index = parseInt($('.note_container > li').length*mouseX/screenWidth);
        // Change selected note to that index^
        changeSelectedNote(index);
    });

    // Play / Pause song
    $('#play_btn').on('click', function() {
        // If song loop is not active
        if (!playingSong) {
            playingSong = true;
            startSong();
        } else {
            stopSong();
        }
    });

    // Start song over by reloading page
    $('#reset_btn').on('click', function() {
        location.reload();
    });

    // Stop playing if inputs are changed
    $('input').on('change',function() {
        stopSong();
    });
});