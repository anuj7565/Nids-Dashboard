from fastapi import FastAPI

app = FastAPI(title="NIDS Dashboard API")


@app.get("/health")
def health():
    return {"status": "ok"}