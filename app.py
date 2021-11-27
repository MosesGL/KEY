from flask import Flask, render_template, request, url_for
import mido
from threading import Thread
# Song list is stored in csv format
import csv
# JSON is used when sending messages between the web server and application
import json

# Define app
app = Flask(__name__)

# Define note letters
NOTES_FLAT = ['A','B&#9837;','B','C','D&#9837;','D','E&#9837;','E','F','F&#9837;','G','A&#9837;']
NOTES_SHARP = ['A','A&#9839;','B','C','C&#9839;','D','D&#9839;','E','F','F&#9839;','G','G&#9839;']

# Name of file with song data
SAVED_SONGS_FILE = 'static/data/song_data.csv'
# User prefer sharps or flats?
use_sharp = False
# Range of keyboard
lowest_key = 21

# List of songs
song_list = []
# List of pressed notes
notes_pressed = []

# Route to home page
@app.route('/')
def home():
	return render_template('home.html')

# Route to song selection page
@app.route('/song_selection')
def song_selection():
	return render_template('song_selection.html')

# Route to song display page
@app.route('/song_display')
def song_display():
	song_index = request.args['songIndex']
	return render_template('song_display.html', songIndex=song_index)

# Route to new song page
@app.route('/new_song')
def new_song():
	return render_template('new_song.html')

# Route to get song data
@app.route('/get_songs', methods=['GET'])
def get_songs():
	return json.dumps(song_list)

# Route to get pressed notes
@app.route('/get_notes', methods=['GET'])
def get_notes():
	data = json.dumps(notes_pressed.copy())
	notes_pressed.clear()
	return data
	#return json.dumps(['A','B'])

# Route to save a new song
@app.route('/save_song', methods=['POST'])
def save_song():
	# Get song data
	new_song = json.loads(request.data)
	# Add song to song list
	song_list.append(new_song)
	# Write new song list to file
	save_song_csv(new_song)
	# Return user to song selection
	return 'Success'

# Route to remove a song
@app.route('/remove_song', methods=['POST'])
def remove_song():
	# Get index of song to remove (convert to int)
	song_index = int(json.loads(request.data))
	# Remove requested song
	remove_song_csv(song_index)
	return 'Success'


# Read song data from CSV file
def load_songs():
	global song_list
	# Open CSV file
	with open(SAVED_SONGS_FILE, 'r') as song_file:
		# Create csv reader to parse file
		reader = csv.reader(song_file)
		# Reformat data from each row (song)
		for row in reader:
			title = row[0]
			desc = row[1]
			notes = row[2].split('-')
			song_list.append({'title':title,'desc':desc,'notes':notes})

# Write new song data to CSV file
def save_song_csv(new_song):
	# Open CSV file for appending
	with open(SAVED_SONGS_FILE, 'a') as song_file:
		# Create csv writer
		writer = csv.writer(song_file)
		# Write every element of song into row (notes separated by -)
		writer.writerow([new_song['title'],new_song['desc'],'-'.join(new_song['notes'])])

# Remove a specific song from CSV file and song list by songID
def remove_song_csv(song_index):
	# Remove song from list
	del song_list[song_index]
	# Open CSV file for reading and writing
	with open(SAVED_SONGS_FILE,'w') as song_file:
		# Create csv writer
		writer = csv.writer(song_file)
		# Rewrite every row with new song_list
		for song in song_list:
			writer.writerow([song['title'],song['desc'],'-'.join(song['notes'])])
			
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
	# Start thread that gets input from midi keyboard
	p = Thread(target=get_next_note, args=(notes_pressed,))
	p.start()
	# Load songs from file
	load_songs()
	# Run main web app
	app.run(debug=True, use_reloader=False)
	p.join()