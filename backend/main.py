from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3

app = FastAPI(title="贪吃蛇游戏后端API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database setup
def init_db():
    conn = sqlite3.connect("snake_game.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            max_score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


# Models
class Score(BaseModel):
    player_name: str
    score: int
    max_score: int


class ScoreResponse(BaseModel):
    id: int
    player_name: str
    score: int
    max_score: int
    created_at: str


# Routes
@app.post("/api/scores", response_model=ScoreResponse)
async def add_score(score: Score):
    conn = sqlite3.connect("snake_game.db")
    c = conn.cursor()
    c.execute(
        "INSERT INTO scores (player_name, score, max_score) VALUES (?, ?, ?)",
        (score.player_name, score.score, score.max_score),
    )
    score_id = c.lastrowid
    c.execute("SELECT created_at FROM scores WHERE id = ?", (score_id,))
    created_at = c.fetchone()[0]
    conn.commit()
    conn.close()

    return ScoreResponse(
        id=int(score_id),
        player_name=score.player_name,
        score=score.score,
        max_score=score.max_score,
        created_at=created_at,
    )


@app.get("/api/scores", response_model=List[ScoreResponse])
async def get_scores(limit: int = 10):
    conn = sqlite3.connect("snake_game.db")
    c = conn.cursor()
    c.execute(
        "SELECT id, player_name, score, max_score, created_at FROM scores ORDER BY score DESC LIMIT ?",
        (limit,),
    )
    scores = [
        ScoreResponse(
            id=row[0],
            player_name=row[1],
            score=row[2],
            max_score=row[3],
            created_at=row[4],
        )
        for row in c.fetchall()
    ]
    conn.close()
    return scores


@app.get("/api/scores/max", response_model=Optional[ScoreResponse])
async def get_max_score():
    conn = sqlite3.connect("snake_game.db")
    c = conn.cursor()
    c.execute(
        "SELECT id, player_name, score, max_score, created_at FROM scores ORDER BY score DESC LIMIT 1"
    )
    row = c.fetchone()
    conn.close()

    if row:
        return ScoreResponse(
            id=row[0],
            player_name=row[1],
            score=row[2],
            max_score=row[3],
            created_at=row[4],
        )
    return None


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
