// When document is loaded
$(document).ready(function() {
    // Retrieve song data from app.py
    $.ajax({
        url: "/get_songs",
        type: "GET",
        dataType: "json",
        success: function(songData) {
            // Add links for each song
            $.map(songData, function(song, i) {
                // Song link (?songID=i gives song number to song_display)
                var songLink = '<a href="'+songDisplayURL+'?songIndex='+i+'" class="song_link">'+song.title+'</a>';
                // Song removal link (?songID=i gives song number to song_display)
                var removeSongBtn = '<button id="'+i+'" class="remove_song_btn">Delete</button>';
                // Add links to song list
                $('.songlist').append('<li>'+songLink+removeSongBtn+'</li>');
            });
        }
    });
    
    // When user clicks on "remove song" button
    //  Because buttons are dynamically created, $(document) must be used
    $(document).on('click','.remove_song_btn',function() {
        // Get song index attributed to button
        songIndex = $(this).attr('id');
        // Send song index to app.py to remove
        $.ajax({
            url: '/remove_song',
            data: JSON.stringify(songIndex),
            contentType: 'application/json;charset=UTF-8',
            type: 'POST',
        });
        // Reload page
        location.reload();
    });
});