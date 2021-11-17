from flask import Flask, render_template, request, url_for
import mido
from song import Song
from flask_socketio import SocketIO

# Define app
app = Flask(__name__)
# Create a socket for transmitting data later
socketio = SocketIO(app, cors_allowed_origins="*")

# Event listener for socket
@socketio.on("get_next_note")
def get_next_note(note):
	print('hhhhh')
	print(note['value'])
	# Create a midi reader
	with mido.open_input() as inport:
		for msg in inport:
			# If key is fully pressed
			# - channel==0 because input comes in through two channels
			# - velocity!=0 prevents ghost notes
			if (msg.type=='note_on' and msg.channel==0 and msg.velocity!=0):
				print(str(msg.note) + ", " + str(msg.time))

# Event listener for socket
@socketio.on("note_press")
def update():
	print('worked')
	return render_template('home.html')

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
	socketio.run(app)