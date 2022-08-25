from fastapi import FastAPI
from pydantic import BaseModel
class Item(BaseModel):
    url: str
    title: str
    isBookmarked: bool
    command: str
app = FastAPI()

@app.post("/api")
async def ocr_request(item:Item):
    print("get ocr req: ",item.url,item.title,item.isBookmarked)
    return {"message": "ok"}