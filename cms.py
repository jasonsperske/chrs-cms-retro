import web
import json
from PIL import Image
from openai import OpenAI
import base64
import io
from dotenv import load_dotenv
from cmstypes import Library, Entry

load_dotenv()
client = OpenAI()
render = web.template.render('templates', base='layout')
db = web.database(dbn='sqlite', db='library.sqlite')
urls = (
  '/', 'index',
  '/entry/(.*)', 'entry',
  '/api/openai/vision', 'vision'
)

def generatePrompt(files):
  prompt = " ".join([
    "I have pictures of a book, a manual or possibly a magazine. Respond in the",
    "form of a JSON. I would like you to tell me what type of media it",
    'is in a field called `mediaType` with "book" for a book and "magazine"',
    "for magazine. Tell me the title (if available) in field called `title`,",
    "the author (if available) in a field called `author`. If the media",
    "is a book tell me the year it was initially published if available.",
    "If the media is a magazine tell me the year it was issued in a field",
    "called `yearPublished` and the month in a field called `monthPublished`",
    "if it can be determined. If its possible tell me the name of the",
    "publisher in a field called `publishedBy`. If it is possible, tell me",
    "the place where the book was published in a field called `publishedLocation`.",
    "If it is possible tell me the edition of the book or magazine in a field",
    "called `edition`, if the edition is published in a later year tell me in",
    "a fieled called `editionYear`. If it is possible identify the ISBN number",
    '(also sometimes labeled "International Standard Book No.") in a field',
    'called `serialNumber`. If it is possible identify the "Library of Congress',
    'Catalog Card Number" number (also sometimes labeled "Library of Congress',
    'Catalog Number") in a field called `catalogNumber`. There may be more than',
    "one interpretation, give me these multiple interpretations with a confidence",
    "score between 0 and 1 for each.",
  ])
  
  return [
    {"role": "system", "content": prompt},
    {
      "role": "user",
      "content": list(map(lambda file: {
        "type": "image_url",
        "image_url": {
          "url": f"data:image/jpg;base64,{file}",
          "detail": "auto"
        }}, files))
    }]

class index:
  
  def GET(self):
    library = Library.fetch(db)
    
    return render.index(library)

class entry:
  def GET(self, id):
    entry = Entry.fetch(int(id), db)
    return render.view(entry)

class vision:
  def POST(self):
    form = web.input(files=[])
    files = []

    for file in form['files']:
      try:
        img_byte_arr = io.BytesIO()
        im = Image.open(io.BytesIO(file))
        im.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        im.save(img_byte_arr, format='JPEG')
        files.append(str(base64.b64encode(img_byte_arr.getvalue()), 'utf-8'))
      except IOError:
        print("cannot create thumbnail for image")

    response = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=generatePrompt(files),
    )
    
    web.header('Content-Type', 'application/json')
    return json.dumps({
      'success': True,
      'response': response.to_dict()})

if __name__ == "__main__":
  app = web.application(urls, globals())
  app.run()

