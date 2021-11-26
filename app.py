from flask import Flask, render_template, request, url_for
import mido
from song import Song
import json
from threading import Thread

# Define app
app = Flask(__name__)

# Define note letters
NOTES_FLAT = ['A','B&#9837;','B','C','D&#9837;','D','E&#9837;','E','F','F&#9837;','G','A&#9837;']
NOTES_SHARP = ['A','A&#9839;','B','C','C&#9839;','D','D&#9839;','E','F','F&#9839;','G','G&#9839;']
# User prefer sharps or flats?
use_sharp = False
# Range of keyboard
lowest_key = 21

notes_pressed = []

# Route to home page
@app.route("/")
def home():
	return render_template('home.html')

# Route to song selection page
@app.route("/song_select")
def song_select():
	# Import songlist data
	return render_template('song_selection.html')

# Route to song display page
@app.route("/song_display")
def song_display():
	song_id = request.args['songID']
	return render_template('song_display.html', songID=song_id)

# Route to new song page
@app.route("/new_song")
def new_song():
	return render_template('new_song.html')

@app.route('/get_notes', methods=['GET'])
def return_notes():
	data = json.dumps(notes_pressed.copy())
	notes_pressed.clear()
	return data

# Function to translate midi key numbers to note letters
def translate_key(key_num):
    if (use_sharp):
        return NOTES_SHARP[key_num % len(NOTES_SHARP)]
    else:
        return NOTES_FLAT[key_num % len(NOTES_FLAT)]

# Function that returns recently played note
def get_next_note(notes_pressed):
	# Open port to listen for note presses
	with mido.open_input() as inport:
		# Retreive key presses from port
		for msg in inport:
			# If key press is valid
			# - note is pressed
			# - velocity!=0 (prevents ghost notes)
			if (msg.type=='note_on' and msg.velocity!=0 and msg.channel==0):
				# Add new note to list
				notes_pressed.append(translate_key(msg.note - lowest_key))


# Run main program
if __name__ == '__main__':
	p = Thread(target=get_next_note, args=(notes_pressed,))
	p.start()
	app.run(debug=True, use_reloader=False)
	p.join()