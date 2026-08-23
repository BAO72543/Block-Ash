"""
Fake Leaderboard Foundation for Block Blast.

This module defines the data structure and generation logic for the
fake leaderboard displayed on the main home screen. The leaderboard
shows a list of fictional players with their scores to create a
competitive atmosphere without requiring a backend.

The web frontend (index.html / js/app.js) consumes this data structure
to render the leaderboard UI on the left side of the home screen.
The design is intentionally theme-agnostic and layout-agnostic so it
works with any UI theme and on square (1:1) screens required by
platforms like PlayGamma.
"""


class FakeLeaderboardEntry:
    """A single entry in the fake leaderboard."""

    def __init__(self, rank, name, score, is_player=False):
        self.rank = rank
        self.name = name
        self.score = score
        self.is_player = is_player

    def to_dict(self):
        """Serialize the entry to a plain dict for JSON/frontend use."""
        return {
            "rank": self.rank,
            "name": self.name,
            "score": self.score,
            "is_player": self.is_player,
        }


class FakeLeaderboard:
    """
    Foundation for the fake leaderboard shown on the home screen.

    Provides a stable, theme-agnostic data source that the frontend
    renders. The leaderboard is intentionally "fake" (pre-generated
    fictional players) to give the home screen a lively, competitive
    feel without requiring a backend.

    The data structure is kept simple and portable so it can be
    mirrored in JavaScript for the web frontend.
    """

    # Fictional player names used to populate the leaderboard.
    DEFAULT_PLAYERS = [
        ("NovaBlast", 48250),
        ("PixelQueen", 43120),
        ("BlockMaster", 39870),
        ("GridGuru", 35460),
        ("TetrisTitan", 32190),
        ("CubeCrusher", 28740),
        ("MegaMiner", 25430),
        ("ShapeShifter", 22180),
        ("LineLord", 19850),
        ("BrickBaron", 16420),
    ]

    def __init__(self, entries=None, player_score=0):
        """
        Initialize the fake leaderboard.

        Args:
            entries: Optional list of (name, score) tuples. If None,
                     DEFAULT_PLAYERS is used.
            player_score: The current player's best score, inserted
                          into the leaderboard at the correct rank.
        """
        self.player_score = player_score
        self._entries = self._build_entries(entries or self.DEFAULT_PLAYERS)

    def _build_entries(self, players):
        """Build ranked entries, inserting the player at the right position."""
        combined = [(name, score, False) for name, score in players]
        combined.append(("You", self.player_score, True))
        # Sort by score descending
        combined.sort(key=lambda item: item[1], reverse=True)
        return [
            FakeLeaderboardEntry(idx + 1, name, score, is_player)
            for idx, (name, score, is_player) in enumerate(combined)
        ]

    def get_entries(self):
        """Return all leaderboard entries as a list of dicts."""
        return [entry.to_dict() for entry in self._entries]

    def get_top(self, count=10):
        """Return the top N entries as a list of dicts."""
        return [entry.to_dict() for entry in self._entries[:count]]

    def get_player_rank(self):
        """Return the player's rank (1-based), or None if not present."""
        for entry in self._entries:
            if entry.is_player:
                return entry.rank
        return None

    def get_player_score(self):
        """Return the player's score."""
        return self.player_score