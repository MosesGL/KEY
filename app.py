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

CONFIG_FILE = 'static/data/config.json'
SAVED_SONGS_FILE = 'static/data/song_data.csv'

# Config data list
config_data = {}

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

# Route to get config data
@app.route('/get_config', methods=['GET'])
def get_config():
	return json.dumps(config_data)

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

# Route to get pressed notes
@app.route('/clear_notes')
def clear_notes():
	notes_pressed.clear()
	return 'Success'

# Route to SET config data
@app.route('/set_config', methods=['POST'])
def set_config():
	# Get config arguments
	config_info = json.loads(request.data)
	print(config_info)
	config_data[config_info[0]] = config_info[1]
	# Save config file with new data
	save_config()
	return 'Success'

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

# Route, redirects to settings pagg
@app.route('/settings')
def settings():
	return render_template('settings.html')

# Read and return data from config file
def load_config():
	# Open json file and return data inside it
	with open(CONFIG_FILE,'r') as infile:
		return json.load(infile)

# Save data to config file
def save_config():
	# Open json file and write config data to it
	with open(CONFIG_FILE,'w') as outfile:
		json.dump(config_data, outfile, indent=4)

# Read and return song data from CSV file
def load_songs():
	temp_list = []
	# Open CSV file
	with open(SAVED_SONGS_FILE, 'r') as infile:
		# Create csv reader to parse file
		reader = csv.reader(infile)
		# Reformat data from each row (song)
		for row in reader:
			title = row[0]
			desc = row[1]
			notes = row[2].split('-')
			temp_list.append({'title':title,'desc':desc,'notes':notes})
		return temp_list

# Write new song data to CSV file
def save_song_csv(new_song):
	# Open CSV file for appending
	with open(SAVED_SONGS_FILE, 'a') as outfile:
		# Create csv writer
		writer = csv.writer(outfile)
		# Write every element of song into row (notes separated by -)
		writer.writerow([new_song['title'],new_song['desc'],'-'.join(new_song['notes'])])

# Remove a specific song from CSV file and song list by songID
def remove_song_csv(song_index):
	# Remove song from list
	del song_list[song_index]
	# Open CSV file for reading and writing
	with open(SAVED_SONGS_FILE,'w') as outfile:
		# Create csv writer
		writer = csv.writer(outfile)
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
	# Get config information
	config_data = load_config()
	# config_data['use_sharp'] = False
	# config_data['note_interval'] = 1000
	# config_data['note_check_precision'] = 6
	# config_data['wait_for_note_press'] = True
	# config_data['selected_note_color'] = 'mediumseagreen'
	# config_data['hover_note_color'] = 'gray'
	# config_data['missed_note_color'] = 'red'
	# config_data['finish_note_color'] = 'blue'
	# config_data['invalid_color'] = 'red'
	# config_data['display_prev_note_count'] = 2
	# config_data['new_song_prev_note_count'] = 4
	print(config_data)
	# Start thread that gets input from midi keyboard
	p = Thread(target=get_next_note, args=(notes_pressed,))
	p.start()
	# Load songs from file
	song_list = load_songs()
	# Run main web app
	app.run(debug=True, use_reloader=False)
	p.join()