from flask import Flask, render_template, request, url_for
import mido
from song import Song
import json

# Define app
app = Flask(__name__)

def get_next_note(note):
	# Create a midi reader
	with mido.open_input() as inport:
		for msg in inport:
			# If key is fully pressed
			# - if note pressed matches sought for note
			# - velocity!=0 prevents ghost notes
			if (msg.type=='note_on' and msg.velocity!=0):
				# CONVERT NOTE NUMBER TO LETTER
				
				# COMPARE PRESSED NOTE TO SOUGHT FOR NOTE
				if (msg.note == note):
					return True

@app.route('/getNotes', methods=['GET'])
def getNotes():
    data = ['E','C','G','D']
	# TAKE IN (POST) CURRENT NOTE VARIABLE

	# GET_NEXT_NOTE(note)

    return json.dumps(data)

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
	songID = request.args['songID']
	return render_template('song.html', songID=songID)

# Route to new song page
@app.route("/new_song")
def new_song():
	return render_template('new_song.html')

# Run main program through the socket
if __name__ == '__main__':
	app.run()