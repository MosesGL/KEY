# Song object for storing default + player-made songs
# - inherits from dict for json serialization
class Song(dict):
    def __init__(self, title, description, notes):
        dict.__init__(self, title=title, description=description, notes=notes)