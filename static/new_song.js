// Edit HTML elements only once page is loaded
$(document).ready(function() {
    // Var for counting to see if config['note_interval'] has passed
    var noteCheckCounter;
    // Interval called upon to control song playback
    var songLoop = undefined;
    // Interval called upon to control recording
    var recordLoop = undefined;
    // For storing the keys pressed between notes
    var playedNotes = [];
    // Get config information
    if (config == undefined) {
        config = getConfig();
    }
    // Time (ms) between each note update
    var noteCheckInterval = config['note_interval'] / config['update_precision'];
    // Add empty notes at beginning of song for spacing
    addSpacingNotes();


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

    // Get recently played notes from python file (for recording)
    function getPlayedNotes(callback) {
        $.ajax({
            url: "/get_notes",
            type: "GET",
            dataType: "json",
            success: function(notes) {
                // Calls instantiateNotes()
                callback(notes);
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

    // Send new song data to app.py to save
    function saveSong() {
        // Stop song playing/recording
        stopLoops();
        // Get song data
        var title = $('#title_input').val();

        // Returns true if (param title) matches an existing song in data
        var matchingSongTitles = function () {
            // Get value of title input
            var tmp_title = $('#title_input').val();
            var result = false;
            // Get songs
            $.ajax({
                async: false,
                url: "/get_songs",
                type: "GET",
                dataType: "json",
                success: function(songs) {
                    // Iterate songs
                    for (var i=0;i<songs.length;i++) {
                        // If inputted title matches a song title from data
                        if (songs[i].title == tmp_title) {
                            result = true;
                        }
                    }
                }
            });
            console.log(result);
            return result;
        }();

        // If title text field is empty
        if (!title.trim()) {
            // Alert user that song was saved
            alert('Please enter a valid song title.');
            // Highlight border of title
            $('#title_input').css('border','2px solid '+config['invalid_color']);
            // Exit function
            return;
        }
        // If the inputted title already exists in song data
        else if (matchingSongTitles) {
            // Alert user that song was saved
            alert('Song '+title+' already exists. Please enter a new title.');
            // Highlight border of title
            $('#title_input').css('border','2px solid '+config['invalid_color']);
            // Exit function
            return;
        }
        // If title is valid, reset border
        else {
            $('#title_input').css('border','2px inset #EBE9ED');
        }
        // If there are no notes in the song
        if ($('.note_container li').length == config['nsong_spacing_notes']) {
            // Alert user that song was saved
            alert('Please add notes to song.');
            // Highlight border of note container
            $('.note_container').css('border','2px solid '+config['invalid_color']);
            // Exit function
            return;
        } else {
            // Reset border of note container
            $('.note_container').css('border','inherit');
        }
        var desc = $('#desc_input').val();
        var notes = [];
        // Populate note list with recorded li elements
        $('.note_container > li').each(function() {
            // Avoid spacing notes
            if ($(this).index() >= config['nsong_spacing_notes']) {
                notes.push($(this).text());
            }
        });
        // Create song dict
        var new_song = {
            'title': title,
            'desc': desc,
            'notes': notes
        }
        // Send song info to main app.py to save
        $.ajax({
            url: '/save_song',
            data: JSON.stringify(new_song),
            contentType: 'application/json;charset=UTF-8',
            type: 'POST',
            success: function() {
                // Alert user that song was saved
                alert(title + ' was successfully saved!');
                // Redirect user to song selection
                location.href = songSelectURL;
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


    // Play song function
    function startSong() {
        // Clear list of previously pressed notes
        clearPressedNotes();
        // Return if there are no notes in the song
        if ($('.note_container li').length == config['nsong_spacing_notes']) { return; }
        // Change play/pause button's text
        $('#play_btn').text('Pause');
        // If last note in ul is selected
        if ($('.note_container > li').length-1 == $('#selected').index()) {
            // Change selected note to first note in ul
            changeSelectedNote(config['nsong_spacing_notes']);
        }
        if (config['wait_for_note']) {
            // Reset note counter
            noteCheckCounter = 0;
            // Move note forward every (noteCheckInterval) ms
            songLoop = setInterval(function() {
                // counter == config['update_precision'] (note interval has passed)
                var noteIntervalPassed = noteCheckCounter == config['update_precision'];
                checkPlayedNotes(moveNoteForward, noteIntervalPassed);
                // If counter says note interval was reached, reset counter
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

    // Play song function
    function startRec() {
        // Clear list of previously pressed notes
        clearPressedNotes();
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

    // Add empty notes at beginning of song for spacing
    function addSpacingNotes() {
        // ADD SPACING NOTES
        for (var i=0;i < config['nsong_spacing_notes']; i++) {
            // Add note to notes list
            $('.note_container').append('<li>~</li>');
        }
    }
    // Add list of notes to html page
    function instantiateNotes(notes) {
        // Reset border of note container if it was previously error-colored
        $('.note_container').css('border','inherit');
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
            $('#selected').css('background-color',config['finish_note_color']);
            return;
        }
        // Change selected note to next note in ul
        changeSelectedNote(selectedNoteIndex + 1);
    }
    // Changes selected note to new note (param: index of new selected note)
    function changeSelectedNote(newNoteIndex) {
        // Return if clicked note's id suggests it is a spacing note
        if (newNoteIndex < config['nsong_spacing_notes']) { return; }
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

    // Hide notes that are further than (config['nsong_spacing_notes']) notes behind selected note
    function clearPreviousNotes() {
        // Index of selected note
        var selectedNoteIndex = $('#selected').index();
        // Remove previous elements to "move forward" in note list
        $('.note_container > li').each(function() {
            // If index of note is not within (config['nsong_spacing_notes']) notes of selected note, hide element
            if ($(this).index() < selectedNoteIndex - config['nsong_spacing_notes'])
            {
                $(this).hide();
            }
        });
    }
    // Show notes that are within (config['nsong_spacing_notes']) notes behind selected note
    function showPreviousNotes() {
        // Index of selected note
        var selectedNoteIndex = $('#selected').index();
        // Show previous elements to "move back" in note list
        $('.note_container > li:hidden').each(function() {
            // If index of note is within (config['nsong_spacing_notes']) notes of selected note, show element
            if ($(this).index() >= selectedNoteIndex - config['nsong_spacing_notes'])
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
        if ($('.note_container li').length <= config['nsong_spacing_notes']) { return; }
        // Fetch selected element
        var selectedNoteIndex = $('#selected').index();
        // Remove selected note element
        $('#selected').remove();
        // If note position is at beginning of list and note in its place exists
        if (config['nsong_spacing_notes'] == selectedNoteIndex) {
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

    // Save song
    $('#save_btn').on('click', function() {
        saveSong();
    });
});